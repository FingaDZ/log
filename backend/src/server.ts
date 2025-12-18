import express from 'express';
import cors from 'cors';
import { startSyslogServer } from './syslog';
import { pool, getTableName } from './db';
import dotenv from 'dotenv';

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

// API: System Status
app.get('/api/status', (req, res) => {
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

// API: Statistics
app.get('/api/stats', async (req, res) => {
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
app.get('/api/logs', async (req, res) => {
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
app.listen(API_PORT, () => {
    console.log(`API Server running on port ${API_PORT}`);
});

// Start Syslog Receiver
startSyslogServer();
