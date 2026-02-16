import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getNodeDetails } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    // Authenticate
    await requireAuth(request);

    // Get node details
    const nodeDetails = await getNodeDetails(params.nodeId);

    if (!nodeDetails) {
      return NextResponse.json(
        errorResponse('Node not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(nodeDetails));
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        errorResponse('Invalid or expired token'),
        { status: 401 }
      );
    }

    console.error('[API] Node details error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
