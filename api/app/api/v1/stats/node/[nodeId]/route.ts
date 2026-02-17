import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { NodeStatsSchema } from '@/lib/validation/schemas';
import { getNodeStats } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    // Authenticate
    await requireAuth(request);

    // Parse period filter
    const searchParams = request.nextUrl.searchParams;
    const { period } = NodeStatsSchema.parse({
      period: searchParams.get('period'),
    });

    // Get node statistics
    const stats = await getNodeStats(params.nodeId, period);

    if (!stats) {
      return NextResponse.json(
        errorResponse('No statistics found for node'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(stats));
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

    console.error('[API] Node stats error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
