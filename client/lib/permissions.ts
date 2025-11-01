/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Defines permissions for different user roles and provides
 * utility functions for permission checking
 */

export type UserRole = 'admin' | 'user';

export interface IUser {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
}

/**
 * Determine user role based on is_admin flag
 */
export function getUserRole(user: IUser | null): UserRole | null {
  if (!user) return null;
  return user.is_admin ? 'admin' : 'user';
}

/**
 * Check if user is admin
 */
export function isAdmin(user: IUser | null): boolean {
  return user?.is_admin ?? false;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: IUser | null): boolean {
  return user !== null;
}

/**
 * Permission definitions for different pages
 */
export const PERMISSIONS = {
  // Public pages - accessible without authentication
  PUBLIC: ['home', 'login', 'register'],

  // Pages accessible by any authenticated user
  USER: ['dashboard', 'create-post', 'edit-post', 'my-posts'],

  // Pages accessible only by admins
  ADMIN: ['tags', 'users', 'analytics'],
} as const;

/**
 * Check if user can access a specific page
 */
export function canAccessPage(user: IUser | null, page: string): boolean {
  // Public pages accessible to everyone
  if (PERMISSIONS.PUBLIC.includes(page)) {
    return true;
  }

  // Not authenticated? Can't access protected pages
  if (!user) {
    return false;
  }

  // Authenticated users can access user pages
  if (PERMISSIONS.USER.includes(page)) {
    return true;
  }

  // Only admins can access admin pages
  if (PERMISSIONS.ADMIN.includes(page)) {
    return isAdmin(user);
  }

  // Unknown page - deny by default
  return false;
}

/**
 * Check if user can create/edit/delete posts
 * - Regular users: Only their own posts
 * - Admins: Any post
 */
export function canManagePost(user: IUser | null, authorId?: number): boolean {
  if (!user) return false;

  // Admin can manage any post
  if (isAdmin(user)) return true;

  // Regular user can only manage their own posts
  return authorId === user.id;
}

/**
 * Check if user can create/edit/delete tags
 * - Only admins
 */
export function canManageTags(user: IUser | null): boolean {
  return isAdmin(user);
}

/**
 * Check if user can create/edit/delete users
 * - Only admins
 */
export function canManageUsers(user: IUser | null): boolean {
  return isAdmin(user);
}

/**
 * Get pages that should be visible in navigation based on user role
 */
export function getVisiblePages(user: IUser | null): string[] {
  const pages = [...PERMISSIONS.PUBLIC];

  if (user) {
    pages.push(...PERMISSIONS.USER);

    if (isAdmin(user)) {
      pages.push(...PERMISSIONS.ADMIN);
    }
  }

  return pages;
}

/**
 * Redirect path for unauthorized access
 * - Authenticated users get redirected to home
 * - Unauthenticated users get redirected to login
 */
export function getUnauthorizedRedirect(user: IUser | null): string {
  if (!user) {
    return '/login';
  }
  return '/';
}
