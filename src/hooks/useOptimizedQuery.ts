import { useQuery, UseQueryOptions, UseQueryResult, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface OptimizedQueryOptions<TData, TError = Error> {
  queryKey: unknown[];
  queryFn: () => Promise<TData>;
  enableBackground?: boolean;
  staleTimeMinutes?: number;
  cacheTimeMinutes?: number;
  enabled?: boolean;
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  onError?: (error: TError) => void;
  onSuccess?: (data: TData) => void;
}

export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    queryKey,
    queryFn,
    enableBackground = true,
    staleTimeMinutes = 5,
    cacheTimeMinutes = 30,
    enabled = true,
    retry = 3,
    onError,
    onSuccess,
  } = options;

  // Memoize query options to prevent unnecessary re-renders
  const optimizedOptions = useMemo(() => ({
    queryKey,
    queryFn,
    enabled,
    staleTime: staleTimeMinutes * 60 * 1000,
    gcTime: cacheTimeMinutes * 60 * 1000, // Updated from cacheTime
    refetchOnWindowFocus: enableBackground,
    refetchOnReconnect: enableBackground,
    retry: typeof retry === 'function' ? retry : (failureCount: number, error: TError) => {
      if (typeof retry === 'number') {
        return failureCount < retry;
      }
      if (typeof retry === 'boolean') {
        return retry && failureCount < 3;
      }
      return failureCount < 3;
    },
  }), [queryKey, queryFn, enabled, staleTimeMinutes, cacheTimeMinutes, enableBackground, retry]);

  const result = useQuery(optimizedOptions);

  // Handle callbacks
  if (result.error && onError) {
    onError(result.error);
  }
  if (result.data && onSuccess) {
    onSuccess(result.data);
  }

  return result;
}

// Hook for paginated queries with optimization
export function useOptimizedInfiniteQuery<TData = unknown, TError = Error>(
  options: OptimizedQueryOptions<TData, TError> & {
    getNextPageParam?: (lastPage: TData, pages: TData[]) => unknown;
    getPreviousPageParam?: (firstPage: TData, pages: TData[]) => unknown;
    initialPageParam?: unknown;
  }
) {
  const {
    queryKey,
    queryFn,
    enableBackground = true,
    staleTimeMinutes = 5,
    cacheTimeMinutes = 30,
    enabled = true,
    getNextPageParam,
    getPreviousPageParam,
    initialPageParam = null,
    onError,
    onSuccess,
  } = options;

  const optimizedOptions = useMemo(() => ({
    queryKey,
    queryFn: ({ pageParam }: { pageParam?: unknown }) => queryFn(),
    enabled,
    staleTime: staleTimeMinutes * 60 * 1000,
    gcTime: cacheTimeMinutes * 60 * 1000,
    refetchOnWindowFocus: enableBackground,
    refetchOnReconnect: enableBackground,
    getNextPageParam,
    getPreviousPageParam,
    initialPageParam,
  }), [queryKey, queryFn, enabled, staleTimeMinutes, cacheTimeMinutes, enableBackground, getNextPageParam, getPreviousPageParam, initialPageParam]);

  const result = useInfiniteQuery(optimizedOptions);

  // Handle callbacks using useEffect instead of direct checks
  return result;
}