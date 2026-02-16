import { getPool } from './connection';
import { hashPassword } from '@/lib/auth/password';

export async function initializeDatabase(): Promise<void> {
  const pool = getPool();

  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        active BOOLEAN DEFAULT TRUE,
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[DB] Users table initialized');

    // Create token_blacklist table (for logout functionality)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[DB] Token blacklist table initialized');

    // Check if any users exist
    const [rows] = await pool.execute<any[]>(
      'SELECT COUNT(*) as count FROM users'
    );

    // Create default admin user if no users exist
    if (rows[0].count === 0) {
      const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin';
      const hashedPassword = await hashPassword(defaultPassword);

      await pool.execute(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );

      console.log('[DB] Default admin user created (username: admin, password: admin)');
      console.warn('[SECURITY] Please change the default admin password immediately!');
    }

    console.log('[DB] Database initialization complete');
  } catch (error) {
    console.error('[DB] Database initialization error:', error);
    throw error;
  }
}
