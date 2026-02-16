import { SignJWT, jwtVerify } from 'jose';
import { JWTPayload, User } from '@/lib/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
);

const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '3600'); // 1 hour
const JWT_REFRESH_EXPIRES_IN = parseInt(
  process.env.JWT_REFRESH_EXPIRES_IN || '604800'
); // 7 days

export async function generateToken(user: User): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRES_IN}s`)
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(user: User): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_REFRESH_EXPIRES_IN}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function getTokenExpiresIn(): number {
  return JWT_EXPIRES_IN;
}

export function getRefreshTokenExpiresIn(): number {
  return JWT_REFRESH_EXPIRES_IN;
}
