'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
  canAccessPage,
  canManagePost,
  canManageTags,
  canManageUsers,
  getUnauthorizedRedirect,
  getVisiblePages,
  isAdmin,
  isAuthenticated,
} from '@/lib/permissions';

/**
 * Hook for checking user permissions
 *
 * Usage:
 * const { user, isAdmin: isUserAdmin, canAccessPage } = usePermissions();
 */
export function usePermissions() {
  const { user } = useAuth();

  return {
    user,
    isAuthenticated: isAuthenticated(user),
    isAdmin: isAdmin(user),
    canAccessPage: (page: string) => canAccessPage(user, page),
    canManagePost: (authorId?: number) => canManagePost(user, authorId),
    canManageTags: () => canManageTags(user),
    canManageUsers: () => canManageUsers(user),
    getVisiblePages: () => getVisiblePages(user),
    getUnauthorizedRedirect: () => getUnauthorizedRedirect(user),
  };
}

/**
 * Hook for checking if user is admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return isAdmin(user);
}
