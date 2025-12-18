import mysql from 'mysql2/promise';
import { format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'adel',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'logser',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to get Table Name for a given Date
export const getTableName = (date: Date = new Date()) => {
  return `logs_${format(date, 'yyyyMMdd')}`;
};

// Check and Create Table if not exists
export const ensureDailyTableExists = async (tableName: string) => {
  try {
    const connection = await pool.getConnection();

    // Check if table already exists
    const [existing]: any = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `, [process.env.DB_NAME || 'logser', tableName]);

    if (existing.length > 0) {
      // Table exists - only ensure 'user' column exists (backward compatibility)
      try {
        await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`user\` VARCHAR(255) AFTER \`protocol\``);
        console.log(`Added 'user' column to existing table: ${tableName}`);
      } catch (e) {
        // Column already exists, ignore
      }
    } else {
      // New table - create with optimized schema
      const createTableQuery = `
        CREATE TABLE \`${tableName}\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`timestamp\` DATETIME NOT NULL,
          \`source_ip\` VARCHAR(45),
          \`source_port\` SMALLINT UNSIGNED,
          \`dest_ip\` VARCHAR(45),
          \`dest_port\` SMALLINT UNSIGNED,
          \`protocol\` VARCHAR(10),
          \`user\` VARCHAR(64),
          \`message\` VARCHAR(512),
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_timestamp (\`timestamp\`),
          INDEX idx_user (\`user\`)
        ) ENGINE=InnoDB 
          ROW_FORMAT=COMPRESSED 
          KEY_BLOCK_SIZE=8 
          DEFAULT CHARSET=utf8mb4 
          COLLATE=utf8mb4_unicode_ci;
      `;

      await connection.query(createTableQuery);
      console.log(`Created new optimized table: ${tableName}`);
    }

    connection.release();
  } catch (error) {
    console.error(`Error ensuring table ${tableName}:`, error);
  }
};

export const insertLog = async (logData: any) => {
  const tableName = getTableName();

  await ensureDailyTableExists(tableName);

  const query = `
        INSERT INTO \`${tableName}\` 
        (timestamp, source_ip, source_port, dest_ip, dest_port, protocol, user, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    new Date(),
    logData.source_ip || null,
    logData.source_port || null,
    logData.dest_ip || null,
    logData.dest_port || null,
    logData.protocol || 'UNKNOWN',
    logData.user || null,
    logData.message || ''
  ];

  try {
    const [result] = await pool.query(query, values);
    return result;
  } catch (error) {
    console.error('Error inserting log:', error);
  }
};
