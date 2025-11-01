import { apiClient } from '@/lib/api';
import type { CreateTagRequest, UpdateTagRequest } from '@/lib/api';
import {
  createPaginationQuery,
  createCreateMutation,
  createUpdateMutation,
  createDeleteMutation,
} from '@/hooks/factory';

/**
 * Query Keys for Tags
 * Hierarchical structure for efficient cache management
 */
export const tagsQueryKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsQueryKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...tagsQueryKeys.lists(), page, limit] as const,
};

/**
 * Query: Get all tags with pagination
 * Factory-generated pagination query hook
 */
export const useTags = createPaginationQuery(
  (page, limit) => tagsQueryKeys.list(page, limit),
  (page, limit) => apiClient.tags.getTags(page, limit)
);

/**
 * Mutation: Create new tag
 * Invalidates tags list on success
 */
export const useCreateTag = createCreateMutation(
  (data: CreateTagRequest) => apiClient.tags.createTag(data),
  {
    invalidateKeys: [tagsQueryKeys.lists()],
  }
);

/**
 * Mutation: Update existing tag
 * Invalidates tags list on success
 * Accepts { id, data } object
 */
export const useUpdateTag = createUpdateMutation(
  ({ id, data }: { id: number; data: UpdateTagRequest }) =>
    apiClient.tags.updateTag(id, data),
  {
    invalidateKeys: [tagsQueryKeys.lists()],
  }
);

/**
 * Mutation: Delete tag
 * Invalidates tags list on success
 * Accepts tag id as number
 */
export const useDeleteTag = createDeleteMutation(
  (id: number) => apiClient.tags.deleteTag(id),
  {
    invalidateKeys: [tagsQueryKeys.lists()],
  }
);