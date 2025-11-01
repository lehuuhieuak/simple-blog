import { useQuery, UseQueryOptions } from '@tanstack/react-query';

/**
 * Factory function to create pagination query hooks
 * Eliminates boilerplate for list/pagination queries
 */
export function createPaginationQuery<TData>(
  queryKeyBuilder: (page: number, limit: number) => readonly unknown[],
  queryFn: (page: number, limit: number) => Promise<TData>,
  defaultOptions?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  return (page = 1, limit = 10, options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>) => {
    return useQuery<TData>({
      queryKey: queryKeyBuilder(page, limit),
      queryFn: () => queryFn(page, limit),
      ...defaultOptions,
      ...options,
    });
  };
}

/**
 * Factory function to create single item query hooks (with enabled condition)
 * Useful for detail views that fetch a single resource by slug/id
 */
export function createDetailQuery<TData>(
  queryKeyBuilder: (id: string | number) => readonly unknown[],
  queryFn: (id: string | number) => Promise<TData>,
  defaultOptions?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  return (id?: string | number, options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>) => {
    return useQuery<TData>({
      queryKey: queryKeyBuilder(id!),
      queryFn: () => queryFn(id!),
      enabled: !!id, // Only run if id exists
      ...defaultOptions,
      ...options,
    });
  };
}

/**
 * Factory function to create filtered/searched query hooks
 * Useful for queries with multiple dynamic parameters
 */
export function createFilteredQuery<TData, TParams extends Record<string, any>>(
  queryKeyBuilder: (params: TParams) => readonly unknown[],
  queryFn: (params: TParams) => Promise<TData>,
  defaultOptions?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  return (params: TParams, options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>) => {
    return useQuery<TData>({
      queryKey: queryKeyBuilder(params),
      queryFn: () => queryFn(params),
      ...defaultOptions,
      ...options,
    });
  };
}
