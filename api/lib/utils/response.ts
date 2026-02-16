import { ApiResponse, PaginationInfo } from '@/lib/types';

export function successResponse<T>(
  data: T,
  pagination?: PaginationInfo
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(pagination && { pagination }),
  };
}

export function errorResponse(
  error: string,
  message?: string
): ApiResponse {
  return {
    success: false,
    error,
    ...(message && { message }),
  };
}
