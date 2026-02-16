import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { CoordinateFiltersSchema } from '@/lib/validation/schemas';
import { getPositionHistory } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    // Authenticate
    await requireAuth(request);

    // Parse filters
    const searchParams = request.nextUrl.searchParams;
    const filters = CoordinateFiltersSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    // Get position history
    const track = await getPositionHistory(params.nodeId, filters);

    return NextResponse.json(
      successResponse({
        nodeId: params.nodeId,
        track,
      })
    );
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

    console.error('[API] Position history error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
