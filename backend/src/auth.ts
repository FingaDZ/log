import { pool } from './db';
import crypto from 'crypto';

export interface User {
    id: number;
    username: string;
    password_hash: string;
    full_name: string;
    role: 'admin' | 'user';
    created_at: Date;
    last_login?: Date;
}

export interface Session {
    id: string;
    user_id: number;
    username: string;
    role: string;
    created_at: Date;
    expires_at: Date;
}

// In-memory session store (use Redis in production)
const sessions = new Map<string, Session>();

// Hash password with SHA-256
export const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Generate session token
export const generateSessionToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Create sessions table if not exists
export const initAuthTables = async () => {
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`username\` VARCHAR(50) UNIQUE NOT NULL,
                \`password_hash\` VARCHAR(64) NOT NULL,
                \`full_name\` VARCHAR(100) NOT NULL,
                \`role\` ENUM('admin', 'user') DEFAULT 'user',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`last_login\` TIMESTAMP NULL,
                INDEX idx_username (\`username\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Check if admin user exists
        const [users]: any = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        
        if (users[0].count === 0) {
            // Create default admin user (username: admin, password: admin123)
            const defaultPasswordHash = hashPassword('admin123');
            await pool.query(
                'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
                ['admin', defaultPasswordHash, 'Administrator', 'admin']
            );
            console.log('✅ Default admin user created (username: admin, password: admin123)');
        }

        console.log('✅ Auth tables initialized');
    } catch (error) {
        console.error('Error initializing auth tables:', error);
    }
};

// Authenticate user
export const authenticateUser = async (username: string, password: string): Promise<Session | null> => {
    try {
        const passwordHash = hashPassword(password);
        const [users]: any = await pool.query(
            'SELECT * FROM users WHERE username = ? AND password_hash = ?',
            [username, passwordHash]
        );

        if (users.length === 0) {
            return null;
        }

        const user = users[0];

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Create session
        const sessionToken = generateSessionToken();
        const session: Session = {
            id: sessionToken,
            user_id: user.id,
            username: user.username,
            role: user.role,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        sessions.set(sessionToken, session);
        return session;
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
};

// Verify session
export const verifySession = (token: string): Session | null => {
    const session = sessions.get(token);
    if (!session) {
        return null;
    }

    // Check if expired
    if (new Date() > session.expires_at) {
        sessions.delete(token);
        return null;
    }

    return session;
};

// Logout
export const logout = (token: string): boolean => {
    return sessions.delete(token);
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const [users]: any = await pool.query(
            'SELECT id, username, full_name, role, created_at, last_login FROM users ORDER BY created_at DESC'
        );
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

// Create user
export const createUser = async (username: string, password: string, fullName: string, role: 'admin' | 'user'): Promise<boolean> => {
    try {
        const passwordHash = hashPassword(password);
        await pool.query(
            'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
            [username, passwordHash, fullName, role]
        );
        return true;
    } catch (error) {
        console.error('Error creating user:', error);
        return false;
    }
};

// Update user
export const updateUser = async (id: number, fullName: string, role: 'admin' | 'user', password?: string): Promise<boolean> => {
    try {
        if (password) {
            const passwordHash = hashPassword(password);
            await pool.query(
                'UPDATE users SET full_name = ?, role = ?, password_hash = ? WHERE id = ?',
                [fullName, role, passwordHash, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET full_name = ?, role = ? WHERE id = ?',
                [fullName, role, id]
            );
        }
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
};

// Delete user
export const deleteUser = async (id: number): Promise<boolean> => {
    try {
        // Prevent deleting the last admin
        const [admins]: any = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        const [user]: any = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        
        if (user.length > 0 && user[0].role === 'admin' && admins[0].count <= 1) {
            return false; // Cannot delete last admin
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
};
