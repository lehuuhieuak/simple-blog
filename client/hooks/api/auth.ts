import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { LoginRequest, RegisterRequest } from '@/lib/api';
import {
  createMutationWithCache,
  createCacheClearMutation,
} from '@/hooks/factory';
import type { IUser } from '@/types/user.type';

/**
 * Query Keys for Authentication
 * Simple flat structure for auth state
 */
export const authQueryKeys = {
  user: ['user'] as const,
};

/**
 * Query: Get current authenticated user
 * Direct useQuery call (not factory-generated) because it has custom retry behavior
 */
export function useUser() {
  return useQuery({
    queryKey: authQueryKeys.user,
    queryFn: () => apiClient.auth.getMe(),
    retry: false, // Don't retry auth failures
  });
}

/**
 * Mutation: User login
 * Updates cache directly with returned user data instead of invalidating
 * Factory-generated mutation with cache update
 */
export const useLogin = createMutationWithCache(
  (data: LoginRequest) => apiClient.auth.login(data),
  {
    queryKey: authQueryKeys.user,
    updateFn: (data: { user: IUser }) => data.user,
  }
);

/**
 * Mutation: User registration
 * Updates cache directly with returned user data instead of invalidating
 * Factory-generated mutation with cache update
 */
export const useRegister = createMutationWithCache(
  (data: RegisterRequest) => apiClient.auth.register(data),
  {
    queryKey: authQueryKeys.user,
    updateFn: (data: { user: IUser }) => data.user,
  }
);

/**
 * Mutation: User logout
 * Clears entire query cache on success
 * Factory-generated cache-clearing mutation
 */
export const useLogout = createCacheClearMutation(
  () => apiClient.auth.logout(),
  'all' // Clear all cache on logout
);