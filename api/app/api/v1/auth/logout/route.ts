import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, blacklistToken } from '@/lib/auth/middleware';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    // Verify token
    await requireAuth(request);

    // Extract token from header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Add token to blacklist
      await blacklistToken(token);
    }

    return NextResponse.json(
      successResponse({ message: 'Logged out successfully' })
    );
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        errorResponse('Invalid or expired token'),
        { status: 401 }
      );
    }

    console.error('[Auth] Logout error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
