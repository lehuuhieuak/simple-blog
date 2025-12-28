import { apiClient } from '@/lib/api';
import type { ICreatePostRequest, IUpdatePostRequest } from '@/types/post.typs';
import {
  createPaginationQuery,
  createDetailQuery,
  createCreateMutation,
  createUpdateMutation,
  createDeleteMutation,
} from '@/hooks/factory';

/**
 * Query Keys for Posts
 * Uses hierarchical structure for efficient cache management
 */
export const postsQueryKeys = {
  all: ['posts'] as const,
  lists: () => [...postsQueryKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...postsQueryKeys.lists(), page, limit] as const,
  details: () => [...postsQueryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...postsQueryKeys.details(), slug] as const,
  myPosts: () => [...postsQueryKeys.all, 'my'] as const,
  myPostsList: (page: number, limit: number) => [...postsQueryKeys.myPosts(), page, limit] as const,
  byTag: (tagSlug: string) => [...postsQueryKeys.all, 'tag', tagSlug] as const,
  byTagList: (tagSlug: string, page: number, limit: number) => [...postsQueryKeys.byTag(tagSlug), page, limit] as const,
};

/**
 * Query: Get all posts with pagination
 * Factory-generated pagination query hook
 */
export const usePosts = createPaginationQuery(
  (page, limit) => postsQueryKeys.list(page, limit),
  (page, limit) => apiClient.posts.getPosts(page, limit)
);

/**
 * Query: Get single post by slug
 * Factory-generated detail query hook with conditional enable
 */
export const usePost = createDetailQuery(
  (slug) => postsQueryKeys.detail(slug as string),
  (slug) => apiClient.posts.getPostBySlug(slug as string)
);

/**
 * Query: Get current user's posts with pagination
 * Factory-generated pagination query hook
 */
export const useMyPosts = createPaginationQuery(
  (page, limit) => postsQueryKeys.myPostsList(page, limit),
  (page, limit) => apiClient.posts.getMyPosts(page, limit)
);

/**
 * Query: Get posts by tag with pagination
 * Factory-generated pagination query hook with conditional enable
 */
export const usePostsByTag = createPaginationQuery(
  (page, limit) => postsQueryKeys.byTagList('', page, limit),
  (page, limit) => apiClient.posts.getPostsByTag('', page, limit)
  // Note: Modified to accept tagSlug as first param - see usage override below
);

// Override usePostsByTag to handle tagSlug parameter
export function usePostsByTagWithSlug(tagSlug: string, page = 1, limit = 10) {
  return createPaginationQuery(
    (page, limit) => postsQueryKeys.byTagList(tagSlug, page, limit),
    (page, limit) => apiClient.posts.getPostsByTag(tagSlug, page, limit)
  )(page, limit, { enabled: !!tagSlug });
}

/**
 * Mutation: Create new post
 * Invalidates posts list and user's posts on success
 */
export const useCreatePost = createCreateMutation(
  (data: ICreatePostRequest) => apiClient.posts.createPost(data),
  {
    invalidateKeys: [
      postsQueryKeys.lists(),
      postsQueryKeys.myPosts(),
    ],
  }
);

/**
 * Mutation: Update existing post
 * Invalidates post detail, lists, and user's posts on success
 * Accepts { slug, data } object
 */
export const useUpdatePost = createUpdateMutation(
  ({ slug, data }: { slug: string; data: IUpdatePostRequest }) =>
    apiClient.posts.updatePost(slug, data),
  {
    invalidateKeys: [
      postsQueryKeys.lists(),
      postsQueryKeys.myPosts(),
      postsQueryKeys.details(),
    ],
  }
);

/**
 * Mutation: Delete post
 * Invalidates posts lists on success
 * Accepts post slug as string
 */
export const useDeletePost = createDeleteMutation(
  (slug: string) => apiClient.posts.deletePost(slug),
  {
    invalidateKeys: [
      postsQueryKeys.lists(),
      postsQueryKeys.myPosts(),
    ],
  }
);