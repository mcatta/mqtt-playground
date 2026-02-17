import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { generateToken, getTokenExpiresIn } from '@/lib/auth/jwt';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Verify existing token
    const payload = await requireAuth(request);

    // Generate new token
    const userForToken: User = {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
      created_at: new Date(),
      last_login: new Date(),
      active: true,
    };

    const newToken = await generateToken(userForToken);

    return NextResponse.json(
      successResponse({
        token: newToken,
        expiresIn: getTokenExpiresIn(),
      })
    );
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        errorResponse('Invalid or expired token'),
        { status: 401 }
      );
    }

    console.error('[Auth] Refresh error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
