import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { JWTPayload } from '@/lib/types';
import { AuthenticationError } from '@/lib/utils/errors';
import { getPool } from '@/lib/db/connection';
import crypto from 'crypto';

export async function verifyAuth(
  request: NextRequest
): Promise<JWTPayload | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return null;
    }

    // Verify token
    const payload = await verifyToken(token);

    return payload;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload> {
  const user = await verifyAuth(request);

  if (!user) {
    throw new AuthenticationError('Invalid or expired token');
  }

  return user;
}

export async function blacklistToken(token: string): Promise<void> {
  try {
    const pool = getPool();

    // Hash the token for storage
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiration time (token expiry + 1 hour buffer)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    await pool.execute(
      'INSERT INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)',
      [tokenHash, expiresAt]
    );
  } catch (error) {
    console.error('[Auth] Error blacklisting token:', error);
    throw error;
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const pool = getPool();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await pool.execute<any[]>(
      'SELECT id FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    return rows.length > 0;
  } catch (error) {
    console.error('[Auth] Error checking token blacklist:', error);
    return false;
  }
}

// Cleanup expired tokens (can be called periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM token_blacklist WHERE expires_at <= NOW()');
  } catch (error) {
    console.error('[Auth] Error cleaning up expired tokens:', error);
  }
}
