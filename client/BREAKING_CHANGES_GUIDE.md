# 🚨 Breaking Changes Migration Guide

## ✅ **LegacyApiClient Removed - Clean Modular Architecture**

The legacy wrapper has been completely removed for a cleaner, more maintainable codebase. Here's how to update your code:

---

## 🔄 **Required Code Changes**

### **1. API Client Usage**

#### ❌ **Old Way (No Longer Works)**
```typescript
import { apiClient } from '@/lib/api';

// These methods no longer exist on the root client
await apiClient.getPosts();
await apiClient.login({ email, password });
await apiClient.createTag(tagData);
```

#### ✅ **New Way (Required)**
```typescript
import { apiClient } from '@/lib/api';

// Use the modular structure
await apiClient.posts.getPosts();
await apiClient.auth.login({ email, password });
await apiClient.tags.createTag(tagData);
```

### **2. Complete Method Migration Map**

| **Old Method** | **New Method** |
|----------------|----------------|
| `apiClient.register(data)` | `apiClient.auth.register(data)` |
| `apiClient.login(data)` | `apiClient.auth.login(data)` |
| `apiClient.logout()` | `apiClient.auth.logout()` |
| `apiClient.getMe()` | `apiClient.auth.getMe()` |
| `apiClient.getPosts(page, limit)` | `apiClient.posts.getPosts(page, limit)` |
| `apiClient.getPostBySlug(slug)` | `apiClient.posts.getPostBySlug(slug)` |
| `apiClient.createPost(data)` | `apiClient.posts.createPost(data)` |
| `apiClient.updatePost(slug, data)` | `apiClient.posts.updatePost(slug, data)` |
| `apiClient.deletePost(slug)` | `apiClient.posts.deletePost(slug)` |
| `apiClient.getMyPosts(page, limit)` | `apiClient.posts.getMyPosts(page, limit)` |
| `apiClient.getPostsByTag(tag, page, limit)` | `apiClient.posts.getPostsByTag(tag, page, limit)` |
| `apiClient.getTags(page, limit)` | `apiClient.tags.getTags(page, limit)` |
| `apiClient.createTag(data)` | `apiClient.tags.createTag(data)` |
| `apiClient.updateTag(id, data)` | `apiClient.tags.updateTag(id, data)` |
| `apiClient.deleteTag(id)` | `apiClient.tags.deleteTag(id)` |
| `apiClient.getAllUsers(params)` | `apiClient.users.getAllUsers(params)` |
| `apiClient.createUser(data)` | `apiClient.users.createUser(data)` |
| `apiClient.updateUser(id, data)` | `apiClient.users.updateUser(id, data)` |
| `apiClient.deleteUser(id)` | `apiClient.users.deleteUser(id)` |
| `apiClient.initDatabase()` | `apiClient.database.initDatabase()` |

### **3. Hook Imports**

#### ✅ **Recommended Import Pattern**
```typescript
// Import from specific modules for better organization
import { usePosts, useCreatePost } from '@/hooks/api/posts';
import { useTags, useCreateTag } from '@/hooks/api/tags';
import { useUser } from '@/hooks/api/auth';
import { useUsers } from '@/hooks/api/users';
```

#### ✅ **Alternative: Import from Main Index**
```typescript
// Import everything from main index (still works)
import { usePosts, useCreatePost, useTags, useUser } from '@/hooks/useApi';
```

### **4. Query Keys**

#### ❌ **Old Query Keys (Removed)**
```typescript
import { queryKeys } from '@/hooks/useApi';
queryKeys.posts; // No longer available
```

#### ✅ **New Query Keys (Domain-Specific)**
```typescript
import { 
  postsQueryKeys, 
  tagsQueryKeys, 
  authQueryKeys, 
  usersQueryKeys 
} from '@/hooks/useApi';

// Use specific query keys
postsQueryKeys.list(1, 10);
authQueryKeys.user;
tagsQueryKeys.all;
```

---

## 🔍 **Files That Need Updates**

### **Search for These Patterns in Your Codebase:**

1. **API Method Calls**
   ```bash
   # Search for old API calls
   grep -r "apiClient\." --include="*.ts" --include="*.tsx" .
   
   # Look for these specific patterns:
   - apiClient.getPosts
   - apiClient.login
   - apiClient.getMe
   - apiClient.createPost
   - apiClient.getTags
   - etc.
   ```

2. **Query Key Imports**
   ```bash
   # Search for old query key usage
   grep -r "queryKeys\." --include="*.ts" --include="*.tsx" .
   ```

### **Common Files to Check:**
- `app/` - Page components
- `components/` - React components
- `contexts/` - Context providers (already updated)
- Any custom hooks using the API

---

## 🛠️ **Migration Steps**

### **Step 1: Find All API Calls**
```bash
# Find all files using the old API
grep -r "apiClient\." --include="*.ts" --include="*.tsx" . | grep -v node_modules
```

### **Step 2: Update API Calls**
For each file found, update the API calls using the mapping table above.

**Example Migration:**
```typescript
// Before
const handleLogin = async () => {
  const result = await apiClient.login({ email, password });
  const posts = await apiClient.getPosts(1, 10);
};

// After  
const handleLogin = async () => {
  const result = await apiClient.auth.login({ email, password });
  const posts = await apiClient.posts.getPosts(1, 10);
};
```

### **Step 3: Update Hook Imports**
```typescript
// Before
import { usePosts, queryKeys } from '@/hooks/useApi';

// After
import { usePosts } from '@/hooks/api/posts';
import { postsQueryKeys } from '@/hooks/useApi';
```

### **Step 4: Test Each Updated File**
- Ensure TypeScript compilation passes
- Test functionality in the browser
- Check that error handling still works

---

## 🎯 **Benefits of This Change**

### **1. Better Organization**
```typescript
// Clear, domain-driven structure
apiClient.auth.login()     // Authentication operations
apiClient.posts.getPosts() // Posts operations  
apiClient.tags.getTags()   // Tags operations
apiClient.users.getUsers() // Users operations
```

### **2. Better TypeScript Support**
```typescript
// Full type safety and intellisense
apiClient.posts. // Shows only posts-related methods
apiClient.auth.  // Shows only auth-related methods
```

### **3. Easier Testing**
```typescript
// Test individual modules
import { PostsApi } from '@/lib/api/posts';
const postsApi = new PostsApi();
// Test only posts functionality
```

### **4. Better Scalability**
- Adding new API domains is straightforward
- No method name conflicts between domains
- Clear separation of concerns

---

## 🚀 **Quick Migration Script**

Here's a simple find-and-replace script to help with migration:

```bash
#!/bin/bash
# migration-script.sh

# Common API method replacements
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/apiClient\.getPosts/apiClient.posts.getPosts/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/apiClient\.login(/apiClient.auth.login(/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/apiClient\.logout(/apiClient.auth.logout(/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/apiClient\.getMe(/apiClient.auth.getMe(/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/apiClient\.createPost/apiClient.posts.createPost/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/apiClient\.getTags/apiClient.tags.getTags/g'

echo "Migration script completed. Please review changes and test thoroughly."
```

---

## ⚠️ **Important Notes**

1. **No Backward Compatibility**: The old API methods are completely removed
2. **TypeScript Errors**: You'll get compile-time errors for any missed migrations
3. **Runtime Errors**: Unmigrated code will fail at runtime with "method not found" errors
4. **Test Thoroughly**: Ensure all functionality works after migration

---

## 🔍 **Troubleshooting**

### **Common Errors:**

#### ❌ **"Property 'getPosts' does not exist"**
```typescript
// Error: apiClient.getPosts is not a function
await apiClient.getPosts(); 

// Fix: Use modular structure
await apiClient.posts.getPosts();
```

#### ❌ **"Cannot find name 'queryKeys'"**
```typescript
// Error: queryKeys is not exported
import { queryKeys } from '@/hooks/useApi';

// Fix: Use specific query keys
import { postsQueryKeys } from '@/hooks/useApi';
```

#### ❌ **"Property 'login' does not exist"**
```typescript
// Error: apiClient.login is not a function
await apiClient.login({ email, password });

// Fix: Use auth module
await apiClient.auth.login({ email, password });
```

---

## ✅ **Verification Checklist**

After migration, verify:

- [ ] All TypeScript compilation errors resolved
- [ ] Authentication flow works (login/logout/register)
- [ ] Posts CRUD operations work
- [ ] Tags management works
- [ ] User management works (if applicable)
- [ ] Error handling still functions correctly
- [ ] TanStack Query cache invalidation works
- [ ] No console errors in browser

---

**The migration removes technical debt and provides a cleaner, more maintainable API structure. While it requires updates to existing code, the result is much better organized and scalable for future development!** 🚀