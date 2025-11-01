// Export all hooks from individual modules
export * from './auth';
export * from './posts';
export * from './tags';
export * from './users';

// Export query keys for external usage
export { authQueryKeys } from './auth';
export { postsQueryKeys } from './posts';
export { tagsQueryKeys } from './tags';
export { usersQueryKeys } from './users';

// Legacy compatibility - re-export some common hooks for backward compatibility
export { usePosts, usePost, useCreatePost, useUpdatePost, useDeletePost } from './posts';
export { useTags, useCreateTag, useUpdateTag, useDeleteTag } from './tags';
export { useUser } from './auth';