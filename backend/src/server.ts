import express from 'express';
import cors from 'cors';
import { startSyslogServer } from './syslog';
import { pool, getTableName } from './db';
import dotenv from 'dotenv';
import { 
    initAuthTables, 
    authenticateUser, 
    verifySession, 
    logout,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    Session
} from './auth';

dotenv.config();

const app = express();
const API_PORT = process.env.PORT || 3000;

// Track last log received time
let lastLogReceived: Date | null = null;

export const updateLastLogReceived = () => {
    lastLogReceived = new Date();
};

app.use(cors());
app.use(express.json());

// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = verifySession(token);
    if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = session;
    next();
};

// Admin-only middleware
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

// === AUTH ENDPOINTS ===

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const session = await authenticateUser(username, password);
        
        if (!session) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            success: true,
            token: session.id,
            user: {
                username: session.username,
                role: session.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Verify session
app.get('/api/auth/verify', requireAuth, (req: any, res) => {
    res.json({
        success: true,
        user: {
            username: req.user.username,
            role: req.user.role
        }
    });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: any, res) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    logout(token!);
    res.json({ success: true });
});

// Get all users (admin only)
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create user (admin only)
app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;

        if (!username || !password || !full_name || !role) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (role !== 'admin' && role !== 'user') {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const success = await createUser(username, password, full_name, role);
        
        if (!success) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update user (admin only)
app.put('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { full_name, role, password } = req.body;

        if (!full_name || !role) {
            return res.status(400).json({ error: 'Full name and role required' });
        }

        if (role !== 'admin' && role !== 'user') {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const success = await updateUser(id, full_name, role, password);
        
        if (!success) {
            return res.status(400).json({ error: 'Update failed' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const success = await deleteUser(id);
        
        if (!success) {
            return res.status(400).json({ error: 'Cannot delete last admin user' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// === PROTECTED ENDPOINTS ===

// API: System Status (now protected)
app.get('/api/status', requireAuth, (req, res) => {
    const now = new Date();
    const isOnline = lastLogReceived && (now.getTime() - lastLogReceived.getTime()) < 30000; // 30 seconds

    res.json({
        mikrotik_online: isOnline,
        last_log: lastLogReceived ? lastLogReceived.toISOString() : null,
        server_time: now.toISOString()
    });
});

// API: Export Logs as CSV
app.get('/api/export', async (req, res) => {
    try {
        // Auth check - support both header and query param for file downloads
        const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token as string;
        if (!token || !verifySession(token)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { date, format = 'csv' } = req.query;

        let targetTable = getTableName();
        if (date) {
            targetTable = `logs_${(date as string).replace(/-/g, '')}`;
        }

        const query = `SELECT * FROM \`${targetTable}\` ORDER BY id DESC`;
        const [rows]: any = await pool.query(query);

        if (format === 'csv') {
            // Generate CSV
            const headers = ['ID', 'Timestamp', 'Username', 'Source IP', 'Source Port', 'Dest IP', 'Dest Port', 'Protocol', 'Message'];
            const csvRows = [headers.join(',')];

            rows.forEach((row: any) => {
                const values = [
                    row.id,
                    row.timestamp,
                    row.user || 'N/A',
                    row.source_ip || '',
                    row.source_port || '',
                    row.dest_ip || '',
                    row.dest_port || '',
                    row.protocol || '',
                    `"${(row.message || '').replace(/"/g, '""')}"` // Escape quotes
                ];
                csvRows.push(values.join(','));
            });

            const csv = csvRows.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="logs_${date || 'today'}.csv"`);
            res.send(csv);
        } else if (format === 'xlsx') {
            // Generate Excel
            const XLSX = require('xlsx');

            const data = rows.map((row: any) => ({
                'ID': row.id,
                'Timestamp': row.timestamp,
                'Username': row.user || 'N/A',
                'Source IP': row.source_ip || '',
                'Source Port': row.source_port || '',
                'Dest IP': row.dest_ip || '',
                'Dest Port': row.dest_port || '',
                'Protocol': row.protocol || '',
                'Message': row.message || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="logs_${date || 'today'}.xlsx"`);
            res.send(buffer);
        } else {
            res.status(400).json({ error: 'Unsupported format' });
        }
    } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ error: 'No logs found for this date.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Database Monitoring
app.get('/api/monitoring', requireAuth, async (req, res) => {
    try {
        // Get all log tables
        const [tables]: any = await pool.query(`
            SELECT TABLE_NAME, 
                   ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb,
                   TABLE_ROWS as row_count
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'logs_%'
            ORDER BY TABLE_NAME DESC
        `, [process.env.DB_NAME || 'logser']);

        // Calculate total size
        const totalSizeMB = tables.reduce((sum: number, table: any) => sum + parseFloat(table.size_mb || 0), 0);
        const totalRows = tables.reduce((sum: number, table: any) => sum + parseInt(table.row_count || 0), 0);

        // Get disk space (Linux only)
        let diskSpace = null;
        try {
            const { execSync } = require('child_process');
            const dfOutput = execSync('df -h /var/lib/mysql 2>/dev/null || df -h /', { encoding: 'utf-8' });
            const lines = dfOutput.trim().split('\n');
            if (lines.length > 1) {
                const parts = lines[1].split(/\s+/);
                diskSpace = {
                    total: parts[1],
                    used: parts[2],
                    available: parts[3],
                    use_percent: parts[4]
                };
            }
        } catch (e) {
            // Disk space check failed (Windows or permission issue)
        }

        res.json({
            tables: tables,
            summary: {
                total_tables: tables.length,
                total_size_mb: Math.round(totalSizeMB * 100) / 100,
                total_rows: totalRows,
                oldest_table: tables[tables.length - 1]?.TABLE_NAME || null,
                newest_table: tables[0]?.TABLE_NAME || null
            },
            disk_space: diskSpace,
            alerts: {
                db_size_warning: totalSizeMB > 1000, // Warning if > 1GB
                db_size_critical: totalSizeMB > 5000, // Critical if > 5GB
                disk_space_warning: diskSpace && parseInt(diskSpace.use_percent) > 80
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Database Backup
app.get('/api/backup', async (req, res) => {
    try {
        // Auth check - support both header and query param for file downloads
        const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token as string;
        if (!token || !verifySession(token)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { start_date, end_date } = req.query;
        const { execSync } = require('child_process');
        const fs = require('fs');
        const path = require('path');

        const dbName = process.env.DB_NAME || 'logser';
        const dbUser = process.env.DB_USER || 'adel';
        const dbPassword = process.env.DB_PASSWORD || '';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        let filename: string;
        let mysqldumpCmd: string;

        if (start_date && end_date) {
            // Partial backup (specific date range)
            const startTable = `logs_${(start_date as string).replace(/-/g, '')}`;
            const endTable = `logs_${(end_date as string).replace(/-/g, '')}`;

            // Get tables in range
            const [tables]: any = await pool.query(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? 
                  AND TABLE_NAME LIKE 'logs_%'
                  AND TABLE_NAME >= ?
                  AND TABLE_NAME <= ?
                ORDER BY TABLE_NAME
            `, [dbName, startTable, endTable]);

            if (tables.length === 0) {
                return res.status(404).json({ error: 'No tables found in date range' });
            }

            const tableNames = tables.map((t: any) => t.TABLE_NAME).join(' ');
            filename = `backup_${start_date}_to_${end_date}_${timestamp}.sql`;
            mysqldumpCmd = `mysqldump -u ${dbUser} -p'${dbPassword}' ${dbName} ${tableNames}`;

        } else {
            // Full backup
            filename = `backup_full_${timestamp}.sql`;
            mysqldumpCmd = `mysqldump -u ${dbUser} -p'${dbPassword}' ${dbName}`;
        }

        const tempFile = path.join('/tmp', filename);

        // Execute mysqldump
        execSync(`${mysqldumpCmd} > ${tempFile}`);

        // Check file size
        const stats = fs.statSync(tempFile);
        const fileSizeMB = stats.size / 1024 / 1024;

        // Send file
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stats.size);

        const fileStream = fs.createReadStream(tempFile);
        fileStream.pipe(res);

        fileStream.on('end', () => {
            // Delete temp file
            fs.unlinkSync(tempFile);
        });

    } catch (error: any) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Backup failed', message: error.message });
    }
});

// API: Compress Tables
app.post('/api/compress-tables', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Get all log tables
        const [tables]: any = await pool.query(`
            SELECT 
                TABLE_NAME,
                ROW_FORMAT,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb,
                TABLE_ROWS as row_count
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'logs_%'
            ORDER BY TABLE_NAME
        `, [process.env.DB_NAME || 'logser']);

        const results = [];
        let totalSaved = 0;

        for (const table of tables) {
            const { TABLE_NAME, ROW_FORMAT, size_mb } = table;

            if (ROW_FORMAT === 'Compressed') {
                results.push({
                    table: TABLE_NAME,
                    status: 'already_compressed',
                    size_before: size_mb,
                    size_after: size_mb,
                    saved: 0
                });
                continue;
            }

            try {
                // Compress table
                await pool.query(`
                    ALTER TABLE \`${TABLE_NAME}\` 
                    ROW_FORMAT=COMPRESSED 
                    KEY_BLOCK_SIZE=8
                `);

                // Optimize to reclaim space
                await pool.query(`OPTIMIZE TABLE \`${TABLE_NAME}\``);

                // Get new size
                const [after]: any = await pool.query(`
                    SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                `, [process.env.DB_NAME || 'logser', TABLE_NAME]);

                const newSize = after[0]?.size_mb || 0;
                const saved = size_mb - newSize;
                totalSaved += saved;

                results.push({
                    table: TABLE_NAME,
                    status: 'compressed',
                    size_before: size_mb,
                    size_after: newSize,
                    saved: parseFloat(saved.toFixed(2))
                });

            } catch (error: any) {
                results.push({
                    table: TABLE_NAME,
                    status: 'error',
                    error: error.message,
                    size_before: size_mb
                });
            }
        }

        res.json({
            message: 'Compression completed',
            total_tables: tables.length,
            compressed: results.filter(r => r.status === 'compressed').length,
            already_compressed: results.filter(r => r.status === 'already_compressed').length,
            errors: results.filter(r => r.status === 'error').length,
            total_saved_mb: parseFloat(totalSaved.toFixed(2)),
            results: results
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Delete logs by date range (with safety checks)
app.post('/api/delete-logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { start_date, end_date, confirm_token } = req.body;

        // Safety: Require confirmation token
        if (confirm_token !== 'DELETE_CONFIRMED') {
            return res.status(400).json({ error: 'Confirmation token required' });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date required' });
        }

        // Generate list of tables to delete
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const tablesToDelete = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const tableName = `logs_${year}${month}${day}`;
            tablesToDelete.push(tableName);
        }

        // Delete tables
        const results = [];
        for (const table of tablesToDelete) {
            try {
                await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
                results.push({ table, status: 'deleted' });
            } catch (e: any) {
                results.push({ table, status: 'error', error: e.message });
            }
        }

        res.json({
            message: 'Deletion completed',
            deleted_tables: results.filter(r => r.status === 'deleted').length,
            results: results
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Statistics
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const { date } = req.query;

        let targetTable = getTableName();
        if (date) {
            targetTable = `logs_${(date as string).replace(/-/g, '')}`;
        }

        // Top 10 Users
        const [topUsers]: any = await pool.query(`
            SELECT user, COUNT(*) as count 
            FROM \`${targetTable}\` 
            WHERE user IS NOT NULL AND user != 'N/A'
            GROUP BY user 
            ORDER BY count DESC 
            LIMIT 10
        `);

        // Protocol Distribution
        const [protocols]: any = await pool.query(`
            SELECT protocol, COUNT(*) as count 
            FROM \`${targetTable}\` 
            WHERE protocol IS NOT NULL
            GROUP BY protocol 
            ORDER BY count DESC
        `);

        // Top 10 Destination IPs
        const [topDestIps]: any = await pool.query(`
            SELECT dest_ip, COUNT(*) as count 
            FROM \`${targetTable}\` 
            WHERE dest_ip IS NOT NULL
            GROUP BY dest_ip 
            ORDER BY count DESC 
            LIMIT 10
        `);

        res.json({
            top_users: topUsers,
            protocols: protocols,
            top_destinations: topDestIps
        });

    } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                top_users: [],
                protocols: [],
                top_destinations: []
            });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Get Logs
// Query Params: date (YYYY-MM-DD), search...
app.get('/api/logs', requireAuth, async (req, res) => {
    try {
        const { date, search, page = 1, limit = 50 } = req.query;

        // Determine Table Name
        // If date provided, use it. Else use TODAY.
        let targetTable = getTableName();
        if (date) {
            targetTable = `logs_${(date as string).replace(/-/g, '')}`; // 2023-10-27 -> logs_20231027
        }

        // Check if table exists (basic error handling)
        // For now, let's just query and catch error if table missing

        const offset = (Number(page) - 1) * Number(limit);

        let query = `SELECT * FROM \`${targetTable}\``;
        const params: any[] = [];
        let whereClause = [];

        if (search) {
            // Simple search across fields
            whereClause.push(`(
                 source_ip LIKE ? OR 
                 dest_ip LIKE ? OR 
                 message LIKE ?
             )`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (whereClause.length > 0) {
            query += ' WHERE ' + whereClause.join(' AND ');
        }

        // Count Total
        // const [countResult] : any = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*) as count'), params);
        // const total = countResult[0].count;

        // Pagination
        query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);

        res.json({
            data: rows,
            // total: total, 
            // page: Number(page)
        });

    } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ data: [], message: 'No logs found for this date.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start API Server
app.listen(API_PORT, async () => {
    console.log(`API Server running on port ${API_PORT}`);
    
    // Initialize authentication tables
    await initAuthTables();
});

// Start Syslog Receiver
startSyslogServer();
