'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPosts, useDeletePost } from '@/hooks/useApi';
import { useCrudDialogsWithFilter } from '@/hooks/factory';
import { Edit, Eye, PenTool, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { IPost } from '@/types/post.typs';

function DashboardPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tPages = useTranslations('pages.dashboard');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);
  const limit = 10;

  // Factory hook for dialog state management
  const dialogs = useCrudDialogsWithFilter<IPost>('');

  const { data: postsData, isLoading: postsLoading, error } = useMyPosts(page, limit);
  const deletePostMutation = useDeletePost();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router, locale]);

  const handleDeletePost = async () => {
    if (!dialogs.deleteConfirmId) return;

    try {
      await deletePostMutation.mutateAsync(dialogs.deleteConfirmId as string);
      toast.success(t('postActions.confirmDelete') + ' removed');
      dialogs.closeDeleteConfirm();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const posts = postsData?.posts || [];

  if (authLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{tPages('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">Error loading posts: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', { username: user.username })}
          </p>
        </div>
        <Link href="/create-post">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('newPost')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{tPages('stats.totalPosts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('stats.published')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((post) => post.published).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('stats.drafts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((post) => !post.published).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">{t('yourPosts')}</h2>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noPosts.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('noPosts.subtitle')}
              </p>
              <Link href="/create-post">
                <Button>
                  <PenTool className="h-4 w-4 mr-2" />
                  {t('noPosts.writeFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.content ? post.content.substring(0, 100) : 'No content'}
                      </CardDescription>
                    </div>
                    <Badge variant={post.published ? 'default' : 'secondary'}>
                      {post.published ? t('stats.published') : t('stats.drafts')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('postMeta.created', { date: new Date(post.created_at).toLocaleDateString() })}
                      {post.updated_at && post.updated_at !== post.created_at && (
                        <span className="ml-2">
                          • {t('postMeta.updated', { date: new Date(post.updated_at).toLocaleDateString() })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.published && (
                        <Link href={`/posts/${post.slug}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            {t('postActions.view')}
                          </Button>
                        </Link>
                      )}
                      <Link href={`/edit-post/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          {t('postActions.edit')}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dialogs.openDeleteConfirm(post.slug)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('postActions.delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {postsData && postsData.pagination.total > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {tc('previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {postsData.pagination.total}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === postsData.pagination.total}
                >
                  {tc('next')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogs.deleteConfirmId !== null} onOpenChange={() => dialogs.closeDeleteConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={dialogs.closeDeleteConfirm}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? 'Deleting...' : tc('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute page="dashboard">
      <DashboardPageContent />
    </ProtectedRoute>
  );
}
