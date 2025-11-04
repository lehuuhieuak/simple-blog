'use client';

import { useState } from 'react';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePosts } from '@/hooks/useApi';

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const t = useTranslations('home');
  
  const { data: postsData, isLoading: loading, error } = usePosts(currentPage, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('posts.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">{t('posts.error', { error: error.message })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
        <div className="flex justify-center">
          <Link href="./create-post">
            <Button size="lg" className="mr-4">
              <PenTool className="h-5 w-5 mr-2" />
              {t('hero.startWriting')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Posts Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">{t('posts.title')}</h2>

        {postsData?.posts.length === 0 ? (
          <div className="text-center py-12">
            <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('posts.noPosts.title')}
            </h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {postsData?.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {postsData && postsData.pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.previous')}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {t('posts.pagination.page', {
                    current: currentPage,
                    total: postsData.pagination.pages,
                  })}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === postsData.pagination.pages}
                >
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
