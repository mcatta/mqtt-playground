import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getLatestTelemetry } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    // Authenticate
    await requireAuth(request);

    // Get latest telemetry
    const telemetry = await getLatestTelemetry(params.nodeId);

    if (!telemetry) {
      return NextResponse.json(
        errorResponse('No telemetry data found for node'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(telemetry));
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        errorResponse('Invalid or expired token'),
        { status: 401 }
      );
    }

    console.error('[API] Latest telemetry error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
