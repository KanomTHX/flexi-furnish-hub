import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { logger } from '@/utils/logger';

interface OptimizedQueryOptions<TData, TError = Error> extends UseQueryOptions<TData, TError> {
  // Add custom options for optimization
  enableBackground?: boolean;
  staleTimeMinutes?: number;
  cacheTimeMinutes?: number;
}

export function useOptimizedQuery<TData = unknown, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  const {
    enableBackground = true,
    staleTimeMinutes = 5,
    cacheTimeMinutes = 30,
    ...queryOptions
  } = options;

  // Memoize query options to prevent unnecessary re-renders
  const optimizedOptions = useMemo(() => ({
    ...queryOptions,
    staleTime: staleTimeMinutes * 60 * 1000,
    cacheTime: cacheTimeMinutes * 60 * 1000,
    refetchOnWindowFocus: enableBackground,
    refetchOnReconnect: enableBackground,
    retry: (failureCount: number, error: TError) => {
      // Custom retry logic
      if (failureCount >= 3) return false;
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('auth')) {
        return false;
      }
      
      return true;
    },
    onError: (error: TError) => {
      logger.error('Query failed', error instanceof Error ? error : new Error(String(error)), {
        queryKey: JSON.stringify(queryKey)
      });
      
      // Call original onError if provided
      if (queryOptions.onError) {
        queryOptions.onError(error);
      }
    },
    onSuccess: (data: TData) => {
      logger.debug('Query succeeded', {
        queryKey: JSON.stringify(queryKey),
        dataSize: JSON.stringify(data).length
      });
      
      // Call original onSuccess if provided
      if (queryOptions.onSuccess) {
        queryOptions.onSuccess(data);
      }
    }
  }), [queryOptions, staleTimeMinutes, cacheTimeMinutes, enableBackground, queryKey]);

  return useQuery(queryKey, queryFn, optimizedOptions);
}

// Hook for paginated queries with optimization
export function useOptimizedInfiniteQuery<TData = unknown, TError = Error>(
  queryKey: unknown[],
  queryFn: ({ pageParam }: { pageParam?: unknown }) => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> & {
    getNextPageParam?: (lastPage: TData, pages: TData[]) => unknown;
    getPreviousPageParam?: (firstPage: TData, pages: TData[]) => unknown;
  } = {}
) {
  const {
    enableBackground = true,
    staleTimeMinutes = 5,
    cacheTimeMinutes = 30,
    getNextPageParam,
    getPreviousPageParam,
    ...queryOptions
  } = options;

  const optimizedOptions = useMemo(() => ({
    ...queryOptions,
    staleTime: staleTimeMinutes * 60 * 1000,
    cacheTime: cacheTimeMinutes * 60 * 1000,
    refetchOnWindowFocus: enableBackground,
    refetchOnReconnect: enableBackground,
    getNextPageParam,
    getPreviousPageParam,
    onError: (error: TError) => {
      logger.error('Infinite query failed', error instanceof Error ? error : new Error(String(error)), {
        queryKey: JSON.stringify(queryKey)
      });
      
      if (queryOptions.onError) {
        queryOptions.onError(error);
      }
    }
  }), [queryOptions, staleTimeMinutes, cacheTimeMinutes, enableBackground, queryKey, getNextPageParam, getPreviousPageParam]);

  return useQuery(queryKey, queryFn, optimizedOptions);
}