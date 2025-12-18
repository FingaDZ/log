import { pool, getTableName } from './db';
import { promises as fs } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ARCHIVE_DIR = process.env.ARCHIVE_DIR || '/var/log/clm-archives';
const ARCHIVE_AGE_DAYS = parseInt(process.env.ARCHIVE_AGE_DAYS || '30');

/**
 * Archive old log tables to compressed JSON files
 * Run monthly via cron: 0 2 1 * * node dist/archive.ts
 */

interface ArchiveMetadata {
    year: number;
    month: number;
    tables: string[];
    created_at: string;
    total_rows: number;
    original_size_mb: number;
    compressed_size_mb: number;
}

async function archiveOldLogs() {
    try {
        console.log('📦 Starting log archiving process...\n');

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_AGE_DAYS);
        const cutoffTableName = `logs_${cutoffDate.getFullYear()}${String(cutoffDate.getMonth() + 1).padStart(2, '0')}${String(cutoffDate.getDate()).padStart(2, '0')}`;

        console.log(`Archiving tables older than: ${cutoffTableName} (${ARCHIVE_AGE_DAYS} days ago)\n`);

        // Get tables to archive
        const [tables]: any = await pool.query(`
            SELECT TABLE_NAME,
                   ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb,
                   TABLE_ROWS as row_count
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME LIKE 'logs_%'
              AND TABLE_NAME < ?
            ORDER BY TABLE_NAME
        `, [process.env.DB_NAME || 'logser', cutoffTableName]);

        if (tables.length === 0) {
            console.log('✅ No tables to archive.');
            process.exit(0);
        }

        console.log(`Found ${tables.length} tables to archive\n`);

        // Group tables by month
        const monthlyGroups: { [key: string]: any[] } = {};

        for (const table of tables) {
            const match = table.TABLE_NAME.match(/logs_(\d{4})(\d{2})/);
            if (match) {
                const [, year, month] = match;
                const key = `${year}-${month}`;
                if (!monthlyGroups[key]) {
                    monthlyGroups[key] = [];
                }
                monthlyGroups[key].push(table);
            }
        }

        // Archive each month
        for (const [yearMonth, monthTables] of Object.entries(monthlyGroups)) {
            const [year, month] = yearMonth.split('-');
            await archiveMonth(parseInt(year), parseInt(month), monthTables);
        }

        console.log('\n✨ Archiving complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

async function archiveMonth(year: number, month: number, tables: any[]) {
    try {
        console.log(`\n📅 Archiving ${year}-${String(month).padStart(2, '0')}...`);

        // Create archive directory
        const archiveDir = path.join(ARCHIVE_DIR, String(year), String(month).padStart(2, '0'));
        await fs.mkdir(archiveDir, { recursive: true });

        // Collect all data
        const allData: any[] = [];
        let totalRows = 0;
        let totalSize = 0;

        for (const table of tables) {
            console.log(`  Exporting ${table.TABLE_NAME}...`);

            const [rows]: any = await pool.query(`SELECT * FROM \`${table.TABLE_NAME}\` ORDER BY id`);
            allData.push(...rows);
            totalRows += table.row_count;
            totalSize += parseFloat(table.size_mb);
        }

        // Write to JSON file
        const jsonFile = path.join(archiveDir, `logs_${year}${String(month).padStart(2, '0')}.json`);
        const gzFile = `${jsonFile}.gz`;

        console.log(`  Writing ${totalRows} rows to ${path.basename(gzFile)}...`);

        await fs.writeFile(jsonFile, JSON.stringify(allData, null, 2));

        // Compress
        await pipeline(
            createReadStream(jsonFile),
            createGzip({ level: 9 }),
            createWriteStream(gzFile)
        );

        // Delete uncompressed JSON
        await fs.unlink(jsonFile);

        // Get compressed size
        const stats = await fs.stat(gzFile);
        const compressedSizeMB = stats.size / 1024 / 1024;

        // Create metadata
        const metadata: ArchiveMetadata = {
            year,
            month,
            tables: tables.map(t => t.TABLE_NAME),
            created_at: new Date().toISOString(),
            total_rows: totalRows,
            original_size_mb: totalSize,
            compressed_size_mb: parseFloat(compressedSizeMB.toFixed(2))
        };

        await fs.writeFile(
            path.join(archiveDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        console.log(`  ✅ Archived: ${totalSize.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${((1 - compressedSizeMB / totalSize) * 100).toFixed(1)}% reduction)`);

        // Drop archived tables
        console.log(`  Dropping ${tables.length} tables...`);
        for (const table of tables) {
            await pool.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
        }

        console.log(`  ✅ Dropped ${tables.length} tables`);

    } catch (error) {
        console.error(`❌ Failed to archive ${year}-${month}:`, error);
        throw error;
    }
}

archiveOldLogs();
