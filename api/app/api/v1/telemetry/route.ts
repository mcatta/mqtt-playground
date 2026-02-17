import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TelemetryFiltersSchema } from '@/lib/validation/schemas';
import { getTelemetry } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { createPaginationInfo } from '@/lib/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = TelemetryFiltersSchema.parse({
      nodeId: searchParams.get('nodeId'),
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    // Execute query
    const { data, total } = await getTelemetry(filters);

    // Return response with pagination
    return NextResponse.json(
      successResponse(
        data,
        createPaginationInfo(total, filters.limit, filters.offset)
      )
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

    console.error('[API] Telemetry error:', error);
    return NextResponse.json(
      errorResponse('Internal server error', error.message),
      { status: 500 }
    );
  }
}
