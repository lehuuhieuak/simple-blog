# React Query Factory Pattern Guide

This document explains the React Query factory pattern implementation used throughout the blog application for managing server state with TanStack Query v5.

## Overview

The factory pattern reduces boilerplate code for common React Query operations by providing reusable factory functions that create hooks with standard configurations.

### Benefits

- **DRY Principle**: Eliminates duplicate hook code across the application
- **Consistency**: All queries and mutations follow the same patterns
- **Maintainability**: Centralized logic makes changes easier
- **Type Safety**: Full TypeScript support with proper inference
- **Configuration**: Easy to customize behavior per hook

## File Structure

```
hooks/
├── factory/
│   ├── queryFactory.ts         # Query hook factories
│   ├── mutationFactory.ts      # Mutation hook factories
│   ├── crudStateFactory.ts     # Dialog and form state
│   └── index.ts                # Public exports
├── api/
│   ├── posts.ts                # Posts hooks (using factories)
│   ├── tags.ts                 # Tags hooks (using factories)
│   ├── users.ts                # Users hooks (using factories)
│   ├── auth.ts                 # Auth hooks (using factories)
│   └── index.ts
└── useApi.ts                   # Legacy exports (kept for compatibility)
```

## Query Factories

### 1. Pagination Query Factory

**Purpose**: Creates query hooks for list endpoints with pagination support

**Signature**:
```typescript
createPaginationQuery<TData>(
  queryKeyBuilder: (page: number, limit: number) => readonly unknown[],
  queryFn: (page: number, limit: number) => Promise<TData>,
  defaultOptions?: UseQueryOptions
): (page?: number, limit?: number, options?: UseQueryOptions) => UseQueryResult<TData>
```

**Usage Example**:
```typescript
// posts.ts
export const usePosts = createPaginationQuery(
  (page, limit) => postsQueryKeys.list(page, limit),
  (page, limit) => apiClient.posts.getPosts(page, limit)
);

// In component
const { data: postsData, isLoading, error } = usePosts(1, 10);
```

**Features**:
- Automatic pagination key generation
- Flexible per-call options override
- Proper TypeScript typing

### 2. Detail Query Factory

**Purpose**: Creates query hooks for single item endpoints (by ID/slug)

**Signature**:
```typescript
createDetailQuery<TData>(
  queryKeyBuilder: (id: string | number) => readonly unknown[],
  queryFn: (id: string | number) => Promise<TData>,
  defaultOptions?: UseQueryOptions
): (id?: string | number, options?: UseQueryOptions) => UseQueryResult<TData>
```

**Usage Example**:
```typescript
// posts.ts
export const usePost = createDetailQuery(
  (slug) => postsQueryKeys.detail(slug as string),
  (slug) => apiClient.posts.getPostBySlug(slug as string)
);

// In component - automatically enabled only when slug exists
const { data: post, isLoading, error } = usePost(slug);
```

**Features**:
- Automatic `enabled` flag based on ID existence
- Prevents unnecessary requests when ID is undefined
- Useful for conditional data fetching

### 3. Filtered Query Factory

**Purpose**: Creates query hooks for endpoints with complex filter parameters

**Signature**:
```typescript
createFilteredQuery<TData, TParams extends Record<string, any>>(
  queryKeyBuilder: (params: TParams) => readonly unknown[],
  queryFn: (params: TParams) => Promise<TData>,
  defaultOptions?: UseQueryOptions
): (params: TParams, options?: UseQueryOptions) => UseQueryResult<TData>
```

**Usage Example**:
```typescript
// users.ts
export function useUsers(page = 1, limit = 10, search = '', email = '') {
  const params: IGetUsersParams = { page, limit, search, email };

  return createFilteredQuery(
    (params) => usersQueryKeys.list(params),
    (params) => apiClient.users.getAllUsers(params)
  )(params);
}

// In component
const { data: usersData } = useUsers(1, 10, searchTerm, '');
```

**Features**:
- Handles complex parameter objects
- Proper query key generation for cache invalidation
- Ideal for search and filter scenarios

## Mutation Factories

### 1. Create Mutation Factory

**Purpose**: Creates mutations for POST endpoints with cache invalidation

**Signature**:
```typescript
createCreateMutation<TData, TInput, TError>(
  mutationFn: (data: TInput) => Promise<TData>,
  invalidationConfig?: InvalidationConfig,
  callbacks?: MutationCallbacks<TData, TError>,
  options?: UseMutationOptions
): () => UseMutation<TData, TError, TInput>
```

**Usage Example**:
```typescript
// tags.ts
export const useCreateTag = createCreateMutation(
  (data: CreateTagRequest) => apiClient.tags.createTag(data),
  {
    invalidateKeys: [tagsQueryKeys.lists()],
  }
);

// In component
const createMutation = useCreateTag();
await createMutation.mutateAsync({
  name: 'React',
  description: 'React library',
  color: '#3B82F6'
});
```

**Configuration**:
- **mutationFn**: The API call function
- **invalidateKeys**: Query keys to invalidate on success
- **callbacks**: Optional success/error handlers
- **options**: Additional mutation options (retry, etc.)

### 2. Update Mutation Factory

**Purpose**: Creates mutations for PUT/PATCH endpoints

**Signature**: Similar to `createCreateMutation`

**Usage Example**:
```typescript
// tags.ts
export const useUpdateTag = createUpdateMutation(
  ({ id, data }: { id: number; data: UpdateTagRequest }) =>
    apiClient.tags.updateTag(id, data),
  {
    invalidateKeys: [tagsQueryKeys.lists()],
  }
);

// In component
const updateMutation = useUpdateTag();
await updateMutation.mutateAsync({
  id: 1,
  data: { name: 'Updated Tag' }
});
```

### 3. Delete Mutation Factory

**Purpose**: Creates mutations for DELETE endpoints

**Signature**: Similar to `createCreateMutation`

**Key Differences**:
- `retry: 0` by default (don't retry deletes)
- Usually just takes an ID parameter

**Usage Example**:
```typescript
// tags.ts
export const useDeleteTag = createDeleteMutation(
  (id: number) => apiClient.tags.deleteTag(id),
  {
    invalidateKeys: [tagsQueryKeys.lists()],
  }
);

// In component
const deleteMutation = useDeleteTag();
await deleteMutation.mutateAsync(tagId);
```

### 4. Cache Update Mutation Factory

**Purpose**: Updates cache directly instead of invalidating

**Signature**:
```typescript
createMutationWithCache<TData, TInput, TCacheData, TError>(
  mutationFn: (data: TInput) => Promise<TData>,
  cacheConfig: {
    queryKey: readonly unknown[];
    updateFn: (data: TData, previousData?: TCacheData) => TCacheData;
  },
  callbacks?: MutationCallbacks<TData, TError>,
  options?: UseMutationOptions
): () => UseMutation<TData, TError, TInput>
```

**Usage Example**:
```typescript
// auth.ts
export const useLogin = createMutationWithCache(
  (data: LoginRequest) => apiClient.auth.login(data),
  {
    queryKey: authQueryKeys.user,
    updateFn: (data: { user: IUser }) => data.user,
  }
);

// In component
const loginMutation = useLogin();
await loginMutation.mutateAsync({ email, password });
// Cache automatically updated with new user data
```

**Use When**:
- You need immediate UI updates
- Data is already available in the response
- Want to avoid extra refetch

### 5. Cache Clear Mutation Factory

**Purpose**: Clears cache on specific operations (logout, reset)

**Signature**:
```typescript
createCacheClearMutation<TData, TInput, TError>(
  mutationFn: (data: TInput) => Promise<TData>,
  clearStrategy: 'all' | (readonly unknown[])[],
  callbacks?: MutationCallbacks<TData, TError>,
  options?: UseMutationOptions
): () => UseMutation<TData, TError, TInput>
```

**Usage Example**:
```typescript
// auth.ts
export const useLogout = createCacheClearMutation(
  () => apiClient.auth.logout(),
  'all'  // Clear entire cache
);

// In component
const logoutMutation = useLogout();
await logoutMutation.mutateAsync();
// All cached data is cleared
```

## CRUD State Factory

### Dialog State Management

**Purpose**: Manages dialog and form visibility for CRUD operations

**Signature**:
```typescript
function useCrudDialogs<T>(): CrudDialogState<T>

interface CrudDialogState<T> {
  isCreateOpen: boolean;
  isEditOpen: boolean;
  editingItem: T | null;

  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (item: T) => void;
  closeEdit: () => void;

  setIsCreateOpen: (open: boolean) => void;
  setIsEditOpen: (open: boolean) => void;
  setEditingItem: (item: T | null) => void;
}
```

**Usage Example**:
```typescript
// tags/page.tsx
const dialogs = useCrudDialogs<ITag>();

// In JSX
<Dialog open={dialogs.isCreateOpen} onOpenChange={dialogs.setIsCreateOpen}>
  {/* Create form */}
</Dialog>

<Dialog open={dialogs.isEditOpen} onOpenChange={dialogs.setIsEditOpen}>
  {/* Edit form - access dialogs.editingItem */}
</Dialog>

// In handlers
const handleEditTag = (tag: ITag) => {
  dialogs.openEdit(tag);
  form.reset({ ...tag });
};
```

### Extended Dialog State with Filters

**Purpose**: Dialog state + search/filter + delete confirmation

**Signature**:
```typescript
function useCrudDialogsWithFilter<T extends { id?: number | string }>(
  initialSearchTerm?: string
): CrudDialogFilterState<T>

interface CrudDialogFilterState<T> extends CrudDialogState<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;

  deleteConfirmId: number | string | null;
  setDeleteConfirmId: (id: number | string | null) => void;
  openDeleteConfirm: (id: number | string) => void;
  closeDeleteConfirm: () => void;
}
```

**Usage Example**:
```typescript
// users/page.tsx
const dialogs = useCrudDialogsWithFilter<IUser>('');

// Search integration
const { data: usersData } = useUsers(page, limit, dialogs.searchTerm);

// Filter UI
<Input
  value={dialogs.searchTerm}
  onChange={(e) => dialogs.setSearchTerm(e.target.value)}
/>
<Button onClick={dialogs.clearSearch}>Clear</Button>

// Delete confirmation
<Dialog
  open={dialogs.deleteConfirmId !== null}
  onOpenChange={() => dialogs.closeDeleteConfirm()}
>
  <Button onClick={() => handleDelete(dialogs.deleteConfirmId as number)}>
    Delete
  </Button>
</Dialog>
```

## Query Key Pattern

All queries use a hierarchical query key pattern for efficient cache management:

```typescript
// Example: postsQueryKeys
export const postsQueryKeys = {
  all: ['posts'] as const,                                    // All posts
  lists: () => [...postsQueryKeys.all, 'list'] as const,      // All lists
  list: (page, limit) => [...postsQueryKeys.lists(), page, limit] as const,  // Specific page
  details: () => [...postsQueryKeys.all, 'detail'] as const,  // All details
  detail: (slug) => [...postsQueryKeys.details(), slug] as const,  // Specific post
};

// Usage
queryClient.invalidateQueries({ queryKey: postsQueryKeys.lists() });
// ^ Invalidates ALL paginated lists
```

**Benefits**:
- Can invalidate at any level (all, category, specific)
- Prevents cache misses on related data
- Easy to debug with predictable key structure

## Cache Invalidation Strategy

### Standard Pattern

After mutations, invalidate related query keys:

```typescript
// Create POST
createMutation → invalidate → lists()

// Update POST
updateMutation → invalidate → lists(), details(), myPosts()

// Delete POST
deleteMutation → invalidate → lists(), myPosts()
```

### When to Use Direct Cache Update

Instead of invalidation, use `createMutationWithCache` for:
- **Auth mutations**: Login/register immediately update user
- **Fast feedback**: Avoid refetch waiting time
- **Optimistic updates**: Update cache before server response

```typescript
// Good use case
useLogin → setQueryData(user, newUser) → Immediate UI update

// Bad use case
usePosts → setQueryData(list, newList) → Might miss pagination
```

## Best Practices

### 1. Query Key Management

✅ **DO**:
```typescript
const { all, lists, list } = queryKeys;
queryClient.invalidateQueries({ queryKey: lists() });
```

❌ **DON'T**:
```typescript
queryClient.invalidateQueries({ queryKey: ['posts'] });
// Too broad, might invalidate wrong queries
```

### 2. Error Handling

✅ **DO**:
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('Success!');
} catch (error) {
  toast.error(error.message);
}
```

❌ **DON'T**:
```typescript
await mutation.mutateAsync(data);
// No error feedback to user
```

### 3. Loading States

✅ **DO**:
```typescript
<Button disabled={mutation.isPending}>
  {mutation.isPending ? 'Saving...' : 'Save'}
</Button>
```

❌ **DON'T**:
```typescript
<Button disabled={loading}>Save</Button>
// Different state management, harder to track
```

### 4. Form Reset Timing

✅ **DO**:
```typescript
await mutation.mutateAsync(data);
form.reset();  // Reset after success
dialogs.closeCreate();
```

❌ **DON'T**:
```typescript
form.reset();
await mutation.mutateAsync(data);  // User sees empty form before request
```

## Migration Guide

### Before (Manual Hooks)

```typescript
export function usePosts(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['posts', 'list', page, limit],
    queryFn: () => apiClient.posts.getPosts(page, limit),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.posts.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

### After (Using Factories)

```typescript
export const usePosts = createPaginationQuery(
  (page, limit) => postsQueryKeys.list(page, limit),
  (page, limit) => apiClient.posts.getPosts(page, limit)
);

export const useCreatePost = createCreateMutation(
  (data) => apiClient.posts.createPost(data),
  { invalidateKeys: [postsQueryKeys.lists()] }
);
```

## Common Patterns

### Search with Pagination

```typescript
const dialogs = useCrudDialogsWithFilter<ITag>();

const { data: tagsData } = useTags(page, limit);

const filtered = tagsData?.tags?.filter(tag =>
  tag.name.toLowerCase().includes(dialogs.searchTerm.toLowerCase())
);
```

### Conditional Queries

```typescript
const { data: post } = usePost(slug);  // Disabled if !slug

const { data: postsByTag } = usePostsByTag(tagSlug, page, limit);
// Disabled if !tagSlug
```

### Dependent Mutations

```typescript
await createMutation.mutateAsync(data);  // Wait for create
refetch();  // Then refetch list
// Or use queryClient.invalidateQueries
```

## Performance Considerations

### Stale Time

Factories use default stale time. Override per-hook:

```typescript
const { data } = usePosts(page, limit, {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,    // 10 minutes (formerly cacheTime)
});
```

### Prefetching

```typescript
queryClient.prefetchQuery({
  queryKey: postsQueryKeys.list(page + 1, limit),
  queryFn: () => apiClient.posts.getPosts(page + 1, limit),
});
```

### Background Refetching

```typescript
const { data, refetch } = usePosts(page, limit, {
  refetchInterval: 30 * 1000,  // Refetch every 30 seconds
});
```

## Troubleshooting

### Data Not Updating After Mutation

**Issue**: Mutation succeeds but UI doesn't update

**Solution**:
1. Check `invalidateKeys` includes correct query keys
2. Verify query key builder matches between query and mutation
3. Use `refetchType: 'active'` to immediately refetch

```typescript
{ invalidateKeys: [listKey], refetchPages: true }
```

### Infinite Loading States

**Issue**: `isLoading` stays true

**Solution**:
1. Check enabled flag is set correctly
2. Verify queryFn doesn't have infinite loops
3. Check network tab for actual requests

### Type Errors with Factory

**Issue**: TypeScript errors on hook usage

**Solution**:
1. Ensure proper generic types: `createPaginationQuery<TData>`
2. Query builder must match query function signature
3. Callback types must match mutation types

## Summary

The factory pattern provides:

| Feature | Benefit |
|---------|---------|
| **Pagination Factory** | DRY pagination queries with proper caching |
| **Detail Factory** | Conditional detail queries with `enabled` flag |
| **Filter Factory** | Complex parameter queries for search/filters |
| **CRUD Mutations** | Consistent mutation patterns with auto-invalidation |
| **Cache Mutations** | Direct cache updates for auth and optimistic UX |
| **Dialog State** | Centralized form/dialog management |

Use these factories consistently across the application for maintainable, predictable server state management.
