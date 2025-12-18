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
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`timestamp\` DATETIME NOT NULL,
      \`source_ip\` VARCHAR(45),
      \`source_port\` INT,
      \`dest_ip\` VARCHAR(45),
      \`dest_port\` INT,
      \`protocol\` VARCHAR(20),
      \`user\` VARCHAR(255),
      \`message\` TEXT,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    const connection = await pool.getConnection();
    // Check if column exists (for existing tables) because 'CREATE TABLE IF NOT EXISTS' won't add columns
    try {
      await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`user\` VARCHAR(255) AFTER \`protocol\``);
    } catch (e) {
      // Ignore error if column already exists
    }

    await connection.query(createTableQuery);
    connection.release();
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
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
