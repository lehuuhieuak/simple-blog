'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPosts, useDeletePost } from '@/hooks/useApi';
import { Edit, Eye, PenTool, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tPages = useTranslations('pages.dashboard');

  const { data: postsData, isLoading: postsLoading, error } = useMyPosts(1, 50);
  const deletePostMutation = useDeletePost();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
      return;
    }
  }, [user, authLoading, router, locale]);

  const handleDelete = async (slug: string) => {
    if (!confirm(t('postActions.confirmDelete'))) return;

    try {
      await deletePostMutation.mutateAsync(slug);
    } catch (error) {
      console.error('Error deleting post:', error);
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
        <Link href="./create-post">
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
              <Link href="./create-post">
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
                        {post.excerpt}
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
                      {post.updated_at !== post.created_at && (
                        <span className="ml-2">
                          • {t('postMeta.updated', { date: new Date(post.updated_at).toLocaleDateString() })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.published && (
                        <Link href={`./posts/${post.slug}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            {t('postActions.view')}
                          </Button>
                        </Link>
                      )}
                      <Link href={`./edit-post/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          {t('postActions.edit')}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.slug)}
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
          </div>
        )}
      </div>
    </div>
  );
}
