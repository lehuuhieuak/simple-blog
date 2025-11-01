# Role-Based Access Control (RBAC) Implementation Guide

## Overview

A comprehensive role-based access control system has been implemented to restrict user access based on their role:
- **Regular Users**: Can view home page, create/edit/delete their own posts, access dashboard
- **Admin Users**: Have full access to all pages including tags and users management

## Architecture

### Backend Implementation

#### Database Schema
```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

#### User Domain Model
```go
type User struct {
    ID        int       `json:"id" db:"id"`
    Email     string    `json:"email" db:"email"`
    Username  string    `json:"username" db:"username"`
    Password  string    `json:"-" db:"password"`
    IsAdmin   bool      `json:"is_admin" db:"is_admin"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
```

#### User Response DTO
The API now returns `is_admin` status in user responses:
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "is_admin": false
}
```

#### Seeding Default Admin User
A default admin user is automatically created on database initialization:
- **Email**: admin@example.com
- **Password**: admin123 (bcrypt hashed)
- **Idempotent**: Won't create duplicate if admin already exists

```bash
# After running database initialization:
POST /api/init-db

# Login with admin credentials
Email: admin@example.com
Password: admin123
```

### Frontend Implementation

#### 1. Permission System (`lib/permissions.ts`)

**Permission Definitions**:
```typescript
const PERMISSIONS = {
  // Public pages - anyone can access
  PUBLIC: ['home', 'login', 'register'],

  // User pages - authenticated users only
  USER: ['dashboard', 'create-post', 'edit-post', 'my-posts'],

  // Admin pages - admin users only
  ADMIN: ['tags', 'users', 'analytics'],
};
```

**Core Functions**:

| Function | Purpose | Returns |
|----------|---------|---------|
| `getUserRole(user)` | Get user's role (admin or user) | `'admin' \| 'user' \| null` |
| `isAdmin(user)` | Check if user is admin | `boolean` |
| `isAuthenticated(user)` | Check if user is logged in | `boolean` |
| `canAccessPage(user, page)` | Check if user can access page | `boolean` |
| `canManagePost(user, authorId)` | Check if user can edit/delete post | `boolean` |
| `canManageTags(user)` | Check if user can manage tags | `boolean` |
| `canManageUsers(user)` | Check if user can manage users | `boolean` |
| `getVisiblePages(user)` | Get accessible pages for user | `string[]` |
| `getUnauthorizedRedirect(user)` | Get redirect path for unauthorized | `string` |

#### 2. Permission Hook (`hooks/usePermissions.ts`)

```typescript
const {
  user,                    // Current user object
  isAuthenticated,         // Is user logged in?
  isAdmin,                 // Is user admin?
  canAccessPage,           // Can access specific page?
  canManagePost,           // Can manage post?
  canManageTags,           // Can manage tags?
  canManageUsers,          // Can manage users?
  getVisiblePages,         // Get visible pages
  getUnauthorizedRedirect  // Get redirect path
} = usePermissions();
```

**Usage Example**:
```typescript
function MyComponent() {
  const { isAdmin, canManagePost } = usePermissions();

  if (isAdmin) {
    return <AdminPanel />;
  }

  if (canManagePost(post.author_id)) {
    return <EditButton />;
  }
}
```

#### 3. Protected Route Component (`components/ProtectedRoute.tsx`)

```typescript
<ProtectedRoute page="tags">
  <TagsManagementPage />
</ProtectedRoute>
```

**Features**:
- Checks user permissions before rendering
- Shows loading state while checking auth
- Redirects unauthorized users to login or home
- Supports optional fallback UI

**Props**:
- `page: string` - Page identifier to check permissions
- `children: ReactNode` - Content to render if authorized
- `fallback?: ReactNode` - Optional fallback UI (default: null)

#### 4. Navbar Updates (`components/navbar.tsx`)

**Admin-Only Features**:
- Tags management link (only visible to admins)
- Users management link (only visible to admins)
- Admin badge next to username
- Shield icons for admin links

```typescript
{isAdmin && (
  <>
    <Link href="/tags">
      <Button>
        <Shield className="h-4 w-4 mr-2" />
        Tags
      </Button>
    </Link>
    <Link href="/users">
      <Button>
        <Shield className="h-4 w-4 mr-2" />
        Users
      </Button>
    </Link>
  </>
)}
```

#### 5. Protected Pages

**Dashboard Page** (`app/dashboard/page.tsx`):
- Wrapped with `<ProtectedRoute page="dashboard">`
- Only accessible by authenticated users
- Redirects to login if not authenticated

**Tags Management** (`app/tags/page.tsx`):
- Wrapped with `<ProtectedRoute page="tags">`
- Only accessible by admin users
- Redirects to home if regular user
- Redirects to login if not authenticated

**Users Management** (`app/users/page.tsx`):
- Wrapped with `<ProtectedRoute page="users">`
- Only accessible by admin users
- Redirects to home if regular user
- Redirects to login if not authenticated

## Access Control Rules

### Public Pages (Anyone)
- ✅ Home page
- ✅ Login page
- ✅ Register page
- ✅ View individual posts (by slug)
- ✅ View posts by tag
- ✅ View tags list (read-only)

### User Pages (Authenticated Users)
- ✅ Dashboard (view own posts)
- ✅ Create new post
- ✅ Edit own posts
- ✅ Delete own posts
- ✅ View own profile

### Admin Pages (Admin Users Only)
- ✅ Tags management
  - Create tags
  - Edit tags
  - Delete tags
  - View all tags with edit controls
- ✅ Users management
  - Create users
  - Edit users
  - Delete users
  - View all users

## Usage Examples

### Example 1: Check Admin Access

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function AdminPanel() {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Dashboard</div>;
}
```

### Example 2: Check Post Ownership

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function PostActions({ post }) {
  const { canManagePost } = usePermissions();

  // Can edit if you're the author or admin
  const canEdit = canManagePost(post.author_id);

  return (
    <>
      {canEdit && <EditButton post={post} />}
      {canEdit && <DeleteButton post={post} />}
    </>
  );
}
```

### Example 3: Protect Route

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminPanel } from './AdminPanel';

export default function AdminPage() {
  return (
    <ProtectedRoute page="admin">
      <AdminPanel />
    </ProtectedRoute>
  );
}
```

### Example 4: Conditional Navigation

```typescript
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

function Navigation() {
  const { isAdmin } = usePermissions();

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/create-post">Write</Link>

      {isAdmin && (
        <>
          <Link href="/tags">Manage Tags</Link>
          <Link href="/users">Manage Users</Link>
        </>
      )}
    </nav>
  );
}
```

## Default Admin Credentials

For testing and initial setup:

```
Email: admin@example.com
Password: admin123
```

**Important**: Change these credentials in production!

## Redirect Behavior

### Unauthorized Access
- **Unauthenticated Users** → Redirected to `/login`
- **Regular Users Accessing Admin Pages** → Redirected to `/` (home)
- **Authenticated Users Accessing Public Pages** → Allowed (no redirect)

### Protected Route Loading
- Shows loading spinner while checking auth status
- Prevents flash of unauthorized content
- Handles race conditions with auth initialization

## Security Considerations

### Client-Side Checks (UI Only)
The permission system provides user experience optimizations:
- Hide admin links from regular users
- Show loading states
- Redirect unauthorized users

**⚠️ Important**: These are not security boundaries!

### Server-Side Validation (Required)
Backend API must also validate permissions:
- Check `user.is_admin` in handlers
- Verify post ownership before allowing edit/delete
- Return 403 Forbidden for unauthorized requests

Example backend validation (Go):
```go
// Check admin permission
if !user.IsAdmin {
    c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
    return
}

// Check post ownership
if post.AuthorID != user.ID && !user.IsAdmin {
    c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
    return
}
```

## Testing Permissions

### Test as Regular User
1. Create account (or use existing non-admin user)
2. Login
3. Verify:
   - ✅ Can see dashboard
   - ✅ Can create/edit/delete own posts
   - ✅ Cannot see tags/users management
   - ✅ Cannot edit other users' posts

### Test as Admin
1. Login with admin@example.com / admin123
2. Verify:
   - ✅ Can see dashboard
   - ✅ Can create/edit/delete posts
   - ✅ Can access tags management
   - ✅ Can access users management
   - ✅ Admin badge visible in navbar

### Test Access Control
1. Try accessing `/tags` as regular user
2. Verify redirect to `/`
3. Try accessing `/users` as regular user
4. Verify redirect to `/`
5. Try accessing `/dashboard` without auth
6. Verify redirect to `/login`

## Migration Guide

### For Existing Users
No action needed. New `is_admin` column defaults to `false`.

### For Upgrading to Admin
Update user in database:
```sql
UPDATE users SET is_admin = true WHERE username = 'desired_admin';
```

Or use the admin interface once implemented.

### After Database Migration
Run the database initialization:
```bash
POST /api/init-db
```

This will:
1. Create `is_admin` column if missing
2. Seed default admin user if none exists
3. Not affect existing data

## Future Enhancements

### Possible Improvements
1. **Role-Based Routes**: Server-side route protection
2. **JWT Roles**: Include role in JWT token
3. **Role Management UI**: Admin panel to manage roles
4. **Audit Logging**: Track admin actions
5. **Fine-Grained Permissions**: Content-level permissions
6. **Permission Inheritance**: Role hierarchies
7. **Token Refresh**: Include role refresh logic
8. **SSO Integration**: OAuth/SAML support

## Troubleshooting

### Issue: Admin buttons not showing
**Solution**: Refresh page, check browser storage, verify user's `is_admin` in API response

### Issue: Redirecting to login unexpectedly
**Solution**: Check token expiration, verify auth context initialization, check network tab

### Issue: Permission checks inconsistent
**Solution**: Ensure backend also validates, clear cache, check user's role in DB

## Files Modified/Created

### Backend
- `api/internal/domain/user.go` - Added `IsAdmin` field
- `api/database/init.go` - Added column to schema
- `api/database/seed.go` - Added admin seeding function

### Frontend
- `client/lib/permissions.ts` - Permission utilities (new)
- `client/hooks/usePermissions.ts` - Permission hook (new)
- `client/components/ProtectedRoute.tsx` - Route protection (new)
- `client/components/navbar.tsx` - Updated with role checks
- `client/app/dashboard/page.tsx` - Added ProtectedRoute
- `client/app/tags/page.tsx` - Added ProtectedRoute
- `client/app/users/page.tsx` - Added ProtectedRoute

## Summary

The RBAC implementation provides a clean, type-safe way to control access based on user roles. Regular users get a focused experience with personal content management, while admins have full control over all content and users.

**Key Features**:
- ✅ Simple, reusable permission utilities
- ✅ Type-safe TypeScript implementation
- ✅ Route protection with ProtectedRoute component
- ✅ Visual feedback (admin badges, conditional links)
- ✅ Automatic redirects for unauthorized access
- ✅ Loading states for auth checking
- ✅ Default admin user for initial setup

**Commit**: `05df493` - feat: implement role-based access control (RBAC) with admin permissions
