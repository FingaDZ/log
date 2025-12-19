import mysql from 'mysql2/promise';
import { format } from 'date-fns';
import type { Pool } from 'mysql2/promise';

// Lazy pool creation - will be created on first use
let _pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!_pool) {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'adel',
      password: process.env.DB_PASSWORD || '!Yara@2014',
      database: process.env.DB_NAME || 'logser',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return _pool;
};

// For backward compatibility
export const pool = new Proxy({} as Pool, {
  get: (target, prop) => {
    return (getPool() as any)[prop];
  }
});

export const getTableName = (date: Date = new Date()) => {
  return `logs_${format(date, 'yyyyMMdd')}`;
};

export const ensureDailyTableExists = async (tableName: string) => {
  try {
    const connection = await getPool().getConnection();

    // Using IF NOT EXISTS to prevent errors if table already exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
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
    const [result] = await getPool().query(query, values);
    return result;
  } catch (error) {
    console.error('Error inserting log:', error);
  }
};
