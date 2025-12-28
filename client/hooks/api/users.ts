import { apiClient } from '@/lib/api';
import type {
  ICreateUserRequest,
  IGetUsersParams,
  IUpdateUserRequest,
} from '@/types/user.type';
import {
  createFilteredQuery,
  createCreateMutation,
  createUpdateMutation,
  createDeleteMutation,
} from '@/hooks/factory';

/**
 * Query Keys for Users
 * Hierarchical structure with params-based list key
 */
export const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: (params: IGetUsersParams) =>
    [...usersQueryKeys.lists(), params] as const,
};

/**
 * Query: Get all users with filters and pagination
 * Factory-generated filtered query hook supporting search and email filter
 */
export function useUsers(page = 1, limit = 10, search = '', email = '') {
  const params = { page, limit, search, email };

  return createFilteredQuery(
    (p) => usersQueryKeys.list(p as unknown as IGetUsersParams),
    (p) => apiClient.users.getAllUsers(p as unknown as IGetUsersParams)
  )(params as unknown as Record<string, unknown>);
}

/**
 * Mutation: Create new user
 * Invalidates users list on success
 * Retry disabled to prevent duplicate user creation
 */
export const useCreateUser = createCreateMutation(
  (data: ICreateUserRequest) => apiClient.users.createUser(data),
  {
    invalidateKeys: [usersQueryKeys.lists()],
  },
  undefined,
  { retry: 0 } // Disable retry for user creation to prevent duplicates
);

/**
 * Mutation: Update existing user
 * Invalidates users list on success
 * Accepts { id, data } object
 */
export const useUpdateUser = createUpdateMutation(
  ({ id, data }: { id: number; data: IUpdateUserRequest }) =>
    apiClient.users.updateUser(id, data),
  {
    invalidateKeys: [usersQueryKeys.lists()],
  }
);

/**
 * Mutation: Delete user
 * Invalidates users list on success
 * Accepts user id as number
 */
export const useDeleteUser = createDeleteMutation(
  (id: number) => apiClient.users.deleteUser(id),
  {
    invalidateKeys: [usersQueryKeys.lists()],
  }
);
