import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Mutation callback options
 */
export interface MutationCallbacks<TData, TError = AxiosError> {
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: TError) => void;
}

/**
 * Configuration for cache invalidation strategy
 */
export interface InvalidationConfig {
  /** Query keys to invalidate on mutation success */
  invalidateKeys?: (readonly unknown[])[];
  /** Whether to refetch immediately after invalidation */
  refetchPages?: boolean;
}

/**
 * Factory function to create CREATE mutation hooks
 * Handles cache invalidation automatically
 */
export function createCreateMutation<TData, TInput, TError = AxiosError>(
  mutationFn: (data: TInput) => Promise<TData>,
  invalidationConfig?: InvalidationConfig,
  callbacks?: MutationCallbacks<TData, TError>,
  options?: Omit<UseMutationOptions<TData, TError, TInput>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TInput>({
      mutationFn,
      onSuccess: async (data) => {
        // Invalidate specified query keys
        if (invalidationConfig?.invalidateKeys) {
          await Promise.all(
            invalidationConfig.invalidateKeys.map((queryKey) =>
              queryClient.invalidateQueries({
                queryKey,
                refetchType: invalidationConfig.refetchPages ? 'active' : 'none',
              })
            )
          );
        }

        // Call user callback
        await callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
      retry: 1,
      ...options,
    });
  };
}

/**
 * Factory function to create UPDATE mutation hooks
 * Handles cache invalidation and detail view updates
 */
export function createUpdateMutation<TData, TInput, TError = AxiosError>(
  mutationFn: (data: TInput) => Promise<TData>,
  invalidationConfig?: InvalidationConfig,
  callbacks?: MutationCallbacks<TData, TError>,
  options?: Omit<UseMutationOptions<TData, TError, TInput>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TInput>({
      mutationFn,
      onSuccess: async (data) => {
        // Invalidate specified query keys
        if (invalidationConfig?.invalidateKeys) {
          await Promise.all(
            invalidationConfig.invalidateKeys.map((queryKey) =>
              queryClient.invalidateQueries({
                queryKey,
                refetchType: invalidationConfig.refetchPages ? 'active' : 'none',
              })
            )
          );
        }

        // Call user callback
        await callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
      retry: 1,
      ...options,
    });
  };
}

/**
 * Factory function to create DELETE mutation hooks
 * Handles cache invalidation for list views
 */
export function createDeleteMutation<TData, TInput, TError = AxiosError>(
  mutationFn: (data: TInput) => Promise<TData>,
  invalidationConfig?: InvalidationConfig,
  callbacks?: MutationCallbacks<TData, TError>,
  options?: Omit<UseMutationOptions<TData, TError, TInput>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TInput>({
      mutationFn,
      onSuccess: async (data) => {
        // Invalidate specified query keys
        if (invalidationConfig?.invalidateKeys) {
          await Promise.all(
            invalidationConfig.invalidateKeys.map((queryKey) =>
              queryClient.invalidateQueries({
                queryKey,
                refetchType: invalidationConfig.refetchPages ? 'active' : 'none',
              })
            )
          );
        }

        // Call user callback
        await callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
      retry: 0, // Don't retry deletes
      ...options,
    });
  };
}

/**
 * Generic mutation factory - use when you need custom behavior
 * Provides standard cache invalidation and error handling
 */
export function createMutation<TData, TInput, TError = AxiosError>(
  mutationFn: (data: TInput) => Promise<TData>,
  invalidationConfig?: InvalidationConfig,
  callbacks?: MutationCallbacks<TData, TError>,
  options?: Omit<UseMutationOptions<TData, TError, TInput>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TInput>({
      mutationFn,
      onSuccess: async (data) => {
        if (invalidationConfig?.invalidateKeys) {
          await Promise.all(
            invalidationConfig.invalidateKeys.map((queryKey) =>
              queryClient.invalidateQueries({
                queryKey,
                refetchType: invalidationConfig.refetchPages ? 'active' : 'none',
              })
            )
          );
        }

        await callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
      ...options,
    });
  };
}

/**
 * Factory function to create mutations with direct cache updates
 * Useful for auth scenarios where you want to update cache directly instead of invalidating
 */
export function createMutationWithCache<TData, TInput, TCacheData, TError = AxiosError>(
  mutationFn: (data: TInput) => Promise<TData>,
  cacheConfig: {
    queryKey: readonly unknown[];
    updateFn: (data: TData, previousData?: TCacheData) => TCacheData;
  },
  callbacks?: MutationCallbacks<TData, TError>,
  options?: Omit<UseMutationOptions<TData, TError, TInput>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TInput>({
      mutationFn,
      onSuccess: async (data) => {
        const previousData = queryClient.getQueryData<TCacheData>(cacheConfig.queryKey);
        const newData = cacheConfig.updateFn(data, previousData);
        queryClient.setQueryData(cacheConfig.queryKey, newData);

        await callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
      ...options,
    });
  };
}

/**
 * Factory function to create cache-clearing mutations
 * Use for logout or global reset operations
 */
export function createCacheClearMutation<TData, TInput, TError = AxiosError>(
  mutationFn: (data: TInput) => Promise<TData>,
  clearStrategy: 'all' | (readonly unknown[])[] = 'all',
  callbacks?: MutationCallbacks<TData, TError>,
  options?: Omit<UseMutationOptions<TData, TError, TInput>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TInput>({
      mutationFn,
      onSuccess: async (data) => {
        if (clearStrategy === 'all') {
          queryClient.clear();
        } else {
          await Promise.all(
            clearStrategy.map((queryKey) =>
              queryClient.removeQueries({ queryKey })
            )
          );
        }

        await callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
      ...options,
    });
  };
}
