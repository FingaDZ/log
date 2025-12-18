import express from 'express';
import cors from 'cors';
import { startSyslogServer } from './syslog';
import { pool, getTableName } from './db';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const API_PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
