import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db/connection';
import { initializeDatabase } from '@/lib/db/migrations';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken, getTokenExpiresIn } from '@/lib/auth/jwt';
import { LoginSchema } from '@/lib/validation/schemas';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { User } from '@/lib/types';

// Initialize database on first request
let dbInitialized = false;

export async function POST(request: NextRequest) {
  try {
    // Initialize database if not already done
    if (!dbInitialized) {
      await initializeDatabase();
      dbInitialized = true;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);

    const pool = getPool();

    // Find user by username
    const [rows] = await pool.execute<any[]>(
      'SELECT id, username, password_hash, role, active FROM users WHERE username = ?',
      [validatedData.username]
    );

    if (rows.length === 0) {
      return NextResponse.json(errorResponse('Invalid credentials'), {
        status: 401,
      });
    }

    const user = rows[0];

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        errorResponse('Account is disabled'),
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validatedData.password,
      user.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(errorResponse('Invalid credentials'), {
        status: 401,
      });
    }

    // Update last login
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [
      user.id,
    ]);

    // Generate JWT token
    const userForToken: User = {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: new Date(),
      last_login: new Date(),
      active: user.active,
    };

    const token = await generateToken(userForToken);

    // Return success response
    return NextResponse.json(
      successResponse({
        token,
        expiresIn: getTokenExpiresIn(),
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      })
    );
  } catch (error: any) {
    console.error('[Auth] Login error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        errorResponse('Validation failed', error.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
