import { PaginationInfo } from '@/lib/types';

export function createPaginationInfo(
  total: number,
  limit: number,
  offset: number
): PaginationInfo {
  return {
    total,
    limit,
    offset,
    hasMore: total > offset + limit,
  };
}
