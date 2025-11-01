# TanStack Query Integration Guide

This document outlines the integration of TanStack Query (React Query) into the blog project, providing efficient data fetching, caching, and state management.

## What's Been Implemented

### 1. Core Setup

- **QueryProvider** (`contexts/QueryProvider.tsx`): Configured with sensible defaults
  - 5-minute stale time
  - 10-minute garbage collection time
  - Smart retry logic (no retry on 401/403 errors)
  - React Query DevTools enabled in development

- **Layout Integration** (`app/layout.tsx`): QueryProvider wraps the entire application

### 2. Custom Hooks (`hooks/useApi.ts`)

#### Posts Hooks
- `usePosts(page, limit)` - Fetch paginated posts
- `usePost(slug)` - Fetch single post by slug
- `useMyPosts(page, limit)` - Fetch current user's posts
- `useCreatePost()` - Create new post with cache invalidation
- `useUpdatePost()` - Update existing post with cache invalidation  
- `useDeletePost()` - Delete post with cache invalidation

#### Tags Hooks
- `useTags(page, limit)` - Fetch paginated tags
- `usePostsByTag(tagSlug, page, limit)` - Fetch posts by tag
- `useCreateTag()` - Create new tag with cache invalidation
- `useUpdateTag()` - Update existing tag with cache invalidation
- `useDeleteTag()` - Delete tag with cache invalidation

#### Auth Hooks
- `useUser()` - Fetch current user (with retry disabled for auth failures)

### 3. Updated Components

#### Home Page (`app/page.tsx`)
- Replaced manual state management with `usePosts` hook
- Automatic loading states and error handling
- Reactive pagination

#### Dashboard (`app/dashboard/page.tsx`)
- Uses `useMyPosts` for fetching user's posts
- Uses `useDeletePost` for optimistic updates
- Proper error handling and loading states

#### Tags Page (`app/tags/page.tsx`)
- Uses `usePostsByTag` and `useTags` hooks
- Concurrent data fetching for better performance
- Proper error boundaries

#### AuthContext (`contexts/AuthContext.tsx`)
- Integrated with query cache for user data synchronization
- Cache invalidation on logout
- Proper cache updates on login/register

### 4. New Components

#### PostDetail (`components/post-detail.tsx`)
- Client-side post fetching with TanStack Query
- Loading states and error handling
- Can be used in both client and server components

#### CreatePostForm (`components/create-post-form.tsx`)
- Demonstrates mutation usage with `useCreatePost`
- Tag selection with `useTags`
- Optimistic updates and error handling
- Form state management

## Key Features

### 1. Automatic Cache Management
- Queries are automatically cached and reused
- Background refetching keeps data fresh
- Intelligent cache invalidation on mutations

### 2. Optimistic Updates
- Mutations immediately update the UI
- Automatic rollback on failure
- Seamless user experience

### 3. Error Handling
- Consistent error states across components
- Retry logic for transient failures
- User-friendly error messages

### 4. Loading States
- Unified loading indicators
- Skeleton screens where appropriate
- Non-blocking background updates

### 5. Performance Optimizations
- Concurrent queries where possible
- Stale-while-revalidate pattern
- Efficient re-renders with proper dependencies

## Query Keys Structure

```typescript
export const queryKeys = {
  posts: ['posts'] as const,
  post: (slug: string) => ['posts', slug] as const,
  myPosts: ['posts', 'my'] as const,
  tags: ['tags'] as const,
  tagPosts: (tagSlug: string) => ['tags', tagSlug, 'posts'] as const,
  user: ['user'] as const,
};
```

## Usage Examples

### Basic Query
```typescript
const { data, isLoading, error } = usePosts(1, 10);
```

### Mutation with Cache Invalidation
```typescript
const createPost = useCreatePost();

const handleSubmit = async (postData) => {
  try {
    await createPost.mutateAsync(postData);
    // Cache automatically invalidated
  } catch (error) {
    // Handle error
  }
};
```

### Dependent Queries
```typescript
const { data: user } = useUser();
const { data: posts } = useMyPosts(1, 10, {
  enabled: !!user, // Only fetch if user exists
});
```

## Migration Guide

### Converting Existing Components

1. **Replace manual fetch calls** with appropriate hooks
2. **Remove useState for loading/error** states
3. **Update effect dependencies** (usually can remove useEffect entirely)
4. **Add error boundaries** for better UX

### Example Migration

**Before:**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false));
}, []);
```

**After:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});
```

## Best Practices

1. **Use proper query keys** - Make them hierarchical and descriptive
2. **Handle loading states** - Always provide feedback to users
3. **Implement error boundaries** - Graceful error handling
4. **Optimize mutations** - Use optimistic updates where appropriate
5. **Cache invalidation** - Be strategic about when to invalidate

## Performance Benefits

- **Reduced API calls** through intelligent caching
- **Faster navigation** with background prefetching
- **Better UX** with optimistic updates
- **Automatic retries** for failed requests
- **Efficient re-renders** with proper query dependencies

## Development Tools

The React Query DevTools are enabled in development mode, providing:
- Query cache inspection
- Mutation tracking
- Performance metrics
- Cache invalidation debugging

Access via the floating button in the bottom-left corner of your browser.