import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { RecentEventsSchema } from '@/lib/validation/schemas';
import { getRecentEvents } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);

    // Parse limit parameter
    const searchParams = request.nextUrl.searchParams;
    const { limit } = RecentEventsSchema.parse({
      limit: searchParams.get('limit'),
    });

    // Get recent events
    const events = await getRecentEvents(limit);

    return NextResponse.json(successResponse(events));
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        errorResponse('Invalid or expired token'),
        { status: 401 }
      );
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        errorResponse('Validation failed', error.message),
        { status: 400 }
      );
    }

    console.error('[API] Recent events error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
