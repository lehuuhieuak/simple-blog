# API Architecture Documentation

## Overview

This directory contains a modular, scalable API client architecture built with axios and TypeScript. The structure is designed to handle projects with 100+ API endpoints while maintaining clean, maintainable code.

## 📁 Directory Structure

```
lib/api/
├── base.ts          # Base API client with interceptors
├── auth.ts          # Authentication endpoints
├── posts.ts         # Posts CRUD operations
├── tags.ts          # Tags management
├── users.ts         # User management
├── database.ts      # Database utilities
├── index.ts         # Main exports and client composition
└── README.md        # This documentation

hooks/api/
├── auth.ts          # Authentication hooks
├── posts.ts         # Posts-related hooks
├── tags.ts          # Tags-related hooks
├── users.ts         # Users-related hooks
└── index.ts         # Combined exports
```

## 🏗️ Architecture Pattern

### 1. Base API Client (`base.ts`)
- **Purpose**: Shared axios instance with interceptors
- **Features**:
  - Automatic JWT token injection
  - Global error handling with toast notifications
  - Request/response interceptors
  - Common CRUD methods (get, post, put, delete)

### 2. Feature-Specific API Classes
Each domain has its own API class that extends `BaseApiClient`:
- `AuthApi` - Authentication operations
- `PostsApi` - Blog posts management
- `TagsApi` - Tag system
- `UsersApi` - User management
- `DatabaseApi` - Database utilities

### 3. Composed API Client (`index.ts`)
The main `ApiClient` class combines all feature APIs:
```typescript
export class ApiClient {
  public auth: AuthApi;
  public posts: PostsApi;
  public tags: TagsApi;
  public users: UsersApi;
  public database: DatabaseApi;
}
```

### 4. Feature-Specific Hooks
TanStack Query hooks organized by domain:
- Better query key management
- Optimistic updates
- Cache invalidation strategies
- Type safety

## 🚀 Usage Examples

### Basic API Usage
```typescript
import { apiClient } from '@/lib/api';

// Authentication
const response = await apiClient.auth.login({ email, password });

// Posts
const posts = await apiClient.posts.getPosts(1, 10);
const post = await apiClient.posts.getPostBySlug('my-post');

// Tags
const tags = await apiClient.tags.getTags();
```

### Using React Hooks
```typescript
import { usePosts, useCreatePost } from '@/hooks/api';

function PostsList() {
  const { data, isLoading, error } = usePosts(1, 10);
  const createPost = useCreatePost();

  const handleCreate = async (postData) => {
    try {
      await createPost.mutateAsync(postData);
    } catch (error) {
      // Error handled automatically by interceptors
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## 🔧 Adding New APIs

### Step 1: Create API Class
```typescript
// lib/api/notifications.ts
import { BaseApiClient } from './base';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  created_at: string;
}

export class NotificationsApi extends BaseApiClient {
  async getNotifications(): Promise<Notification[]> {
    return this.get('/notifications');
  }

  async markAsRead(id: number): Promise<void> {
    return this.put(`/notifications/${id}/read`);
  }
}
```

### Step 2: Add to Main Client
```typescript
// lib/api/index.ts
import { NotificationsApi } from './notifications';

export class ApiClient {
  public notifications: NotificationsApi;
  
  constructor() {
    this.notifications = new NotificationsApi();
  }
}
```

### Step 3: Create Hooks
```typescript
// hooks/api/notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const notificationsQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationsQueryKeys.all, 'list'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKeys.lists(),
    queryFn: () => apiClient.notifications.getNotifications(),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.lists() });
    },
  });
}
```

## 🎯 Key Benefits

### 1. **Scalability**
- Easy to add new APIs without bloating existing files
- Clear separation of concerns
- Modular structure supports large teams

### 2. **Maintainability**
- Each API domain is self-contained
- Consistent patterns across all APIs
- Easy to find and modify specific functionality

### 3. **Type Safety**
- Full TypeScript support
- Interface definitions for all requests/responses
- Compile-time error checking

### 4. **Error Handling**
- Centralized error management
- Automatic toast notifications
- Custom error classes with status codes

### 5. **Performance**
- Smart query key management
- Efficient cache invalidation
- Optimistic updates for better UX

## 🛠️ Advanced Features

### Query Key Patterns
```typescript
export const postsQueryKeys = {
  all: ['posts'] as const,
  lists: () => [...postsQueryKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...postsQueryKeys.lists(), page, limit] as const,
  details: () => [...postsQueryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...postsQueryKeys.details(), slug] as const,
};
```

### Error Handling Utilities
```typescript
import { handleApiError, isAuthError, isValidationError } from '@/lib/api-error-handler';

try {
  await apiClient.posts.createPost(data);
} catch (error) {
  if (isValidationError(error)) {
    // Handle validation errors
  } else if (isAuthError(error)) {
    // Handle auth errors
  } else {
    console.error(handleApiError(error));
  }
}
```

### Interceptor Configuration
The base client includes comprehensive interceptors:
- **Request**: Auto-inject JWT tokens
- **Response**: Global error handling, toast notifications
- **Error Mapping**: Convert HTTP status codes to user-friendly messages

## 🔄 Migration Guide

### From Legacy API
The old `lib/api.ts` and `hooks/useApi.ts` files have been updated to provide backward compatibility:

```typescript
// Old way (still works)
import { apiClient } from '@/lib/api';
import { usePosts } from '@/hooks/useApi';

// New way (recommended)
import { apiClient } from '@/lib/api';
import { usePosts } from '@/hooks/api/posts';
```

### Gradual Migration
1. Start using new hooks for new features
2. Gradually migrate existing components
3. Remove legacy compatibility layer when ready

## 📝 Best Practices

### 1. **Naming Conventions**
- API classes: `{Domain}Api` (e.g., `PostsApi`)
- Interfaces: `{Action}{Domain}Request/Response`
- Query keys: `{domain}QueryKeys`

### 2. **Error Handling**
- Always use the error handling utilities
- Don't show raw error messages to users
- Log detailed errors for debugging

### 3. **Query Keys**
- Use hierarchical query key structures
- Include all relevant parameters
- Follow the established patterns

### 4. **Type Definitions**
- Define interfaces for all API requests/responses
- Export types for reuse in components
- Use generic types for common patterns

## 🔍 Troubleshooting

### Common Issues

1. **Import Errors**: Use the new import paths from `@/hooks/api/*`
2. **Query Key Mismatches**: Ensure query keys match between hooks
3. **Type Errors**: Check interface definitions in API classes

### Debug Tools
- TanStack Query DevTools for cache inspection
- Browser Network tab for API requests
- Console logs for error tracking

## 🚀 Future Enhancements

- Request/response logging middleware
- API mocking for testing
- Request deduplication
- Offline support with cache
- GraphQL integration
- WebSocket support

---

This modular architecture provides a solid foundation for scaling your API layer while maintaining clean, maintainable code. Each new API domain can be added quickly using the established patterns.