import { pool } from './db';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Compress existing log tables to save disk space
 * Run this script once to compress all existing tables
 * 
 * Usage: node dist/compress-tables.js
 */

async function compressExistingTables() {
    try {
        console.log('🗜️  Starting table compression...\n');

        // Get all log tables
        const [tables]: any = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'logs_%'
            ORDER BY TABLE_NAME
        `, [process.env.DB_NAME || 'logser']);

        console.log(`Found ${tables.length} tables to compress\n`);

        let compressed = 0;
        let failed = 0;

        for (const { TABLE_NAME } of tables) {
            try {
                console.log(`Compressing ${TABLE_NAME}...`);

                // Get size before
                const [before]: any = await pool.query(`
                    SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                `, [process.env.DB_NAME || 'logser', TABLE_NAME]);

                const sizeBefore = before[0]?.size_mb || 0;

                // Compress table
                await pool.query(`
                    ALTER TABLE \`${TABLE_NAME}\` 
                    ROW_FORMAT=COMPRESSED 
                    KEY_BLOCK_SIZE=8
                `);

                // Optimize to reclaim space
                await pool.query(`OPTIMIZE TABLE \`${TABLE_NAME}\``);

                // Get size after
                const [after]: any = await pool.query(`
                    SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                `, [process.env.DB_NAME || 'logser', TABLE_NAME]);

                const sizeAfter = after[0]?.size_mb || 0;
                const saved = sizeBefore - sizeAfter;
                const percent = sizeBefore > 0 ? ((saved / sizeBefore) * 100).toFixed(1) : 0;

                console.log(`  ✅ ${TABLE_NAME}: ${sizeBefore}MB → ${sizeAfter}MB (saved ${saved}MB, ${percent}%)\n`);
                compressed++;

            } catch (error: any) {
                console.error(`  ❌ Failed to compress ${TABLE_NAME}:`, error.message);
                failed++;
            }
        }

        console.log('\n📊 Compression Summary:');
        console.log(`  ✅ Compressed: ${compressed} tables`);
        console.log(`  ❌ Failed: ${failed} tables`);
        console.log('\n✨ Compression complete!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

compressExistingTables();
