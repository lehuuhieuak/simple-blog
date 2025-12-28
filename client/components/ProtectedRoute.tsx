'use client';

import { useAuth } from '@/contexts/AuthContext';
import { canAccessPage, getUnauthorizedRedirect, type IUser } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  page: string;
  fallback?: React.ReactNode;
}

/**
 * Component to protect routes based on user permissions
 *
 * Usage:
 * <ProtectedRoute page="tags">
 *   <TagsPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  page,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // Check if user can access this page
    if (!canAccessPage(user as IUser | null, page)) {
      // Redirect to appropriate location
      const redirectPath = getUnauthorizedRedirect(user as IUser | null);
      router.push(redirectPath);
    }
  }, [user, loading, page, router]);

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check permission again before rendering
  if (!canAccessPage(user as IUser | null, page)) {
    return fallback || null;
  }

  return <>{children}</>;
}
