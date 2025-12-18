import { pool } from './db';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Compress existing log tables to save disk space
 * SAFE: Only compresses, does not delete data
 * 
 * Usage: 
 *   Dry run: node dist/compress-tables.js --dry-run
 *   Execute: node dist/compress-tables.js
 */

const DRY_RUN = process.argv.includes('--dry-run');

async function compressExistingTables() {
    try {
        console.log('🗜️  Starting table compression...');
        if (DRY_RUN) {
            console.log('⚠️  DRY RUN MODE - No changes will be made\n');
        } else {
            console.log('⚠️  LIVE MODE - Tables will be compressed\n');
        }

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

        console.log(`Found ${tables.length} tables\n`);

        let toCompress = 0;
        let alreadyCompressed = 0;
        let totalSavingsEstimate = 0;

        for (const table of tables) {
            const { TABLE_NAME, ROW_FORMAT, size_mb, row_count } = table;

            if (ROW_FORMAT === 'Compressed') {
                console.log(`✅ ${TABLE_NAME}: Already compressed (${size_mb}MB, ${row_count} rows)`);
                alreadyCompressed++;
                continue;
            }

            const estimatedSavings = size_mb * 0.6; // Estimate 60% reduction
            totalSavingsEstimate += estimatedSavings;
            toCompress++;

            console.log(`📦 ${TABLE_NAME}: ${size_mb}MB, ${row_count} rows (est. savings: ${estimatedSavings.toFixed(2)}MB)`);

            if (!DRY_RUN) {
                try {
                    // Compress table
                    console.log(`   Compressing...`);
                    await pool.query(`
                        ALTER TABLE \`${TABLE_NAME}\` 
                        ROW_FORMAT=COMPRESSED 
                        KEY_BLOCK_SIZE=8
                    `);

                    // Optimize to reclaim space
                    console.log(`   Optimizing...`);
                    await pool.query(`OPTIMIZE TABLE \`${TABLE_NAME}\``);

                    // Get new size
                    const [after]: any = await pool.query(`
                        SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
                        FROM information_schema.TABLES 
                        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                    `, [process.env.DB_NAME || 'logser', TABLE_NAME]);

                    const newSize = after[0]?.size_mb || 0;
                    const actualSavings = size_mb - newSize;
                    const percent = size_mb > 0 ? ((actualSavings / size_mb) * 100).toFixed(1) : 0;

                    console.log(`   ✅ ${size_mb}MB → ${newSize}MB (saved ${actualSavings.toFixed(2)}MB, ${percent}%)\n`);

                } catch (error: any) {
                    console.error(`   ❌ Failed: ${error.message}\n`);
                }
            }
        }

        console.log('\n📊 Summary:');
        console.log(`  ✅ Already compressed: ${alreadyCompressed} tables`);
        console.log(`  📦 To compress: ${toCompress} tables`);
        console.log(`  💾 Estimated savings: ${totalSavingsEstimate.toFixed(2)}MB`);

        if (DRY_RUN) {
            console.log('\n💡 Run without --dry-run to apply compression');
        } else {
            console.log('\n✨ Compression complete!');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

compressExistingTables();
