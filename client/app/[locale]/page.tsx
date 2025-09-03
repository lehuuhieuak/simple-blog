'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author_username: string;
  created_at: string;
  published: boolean;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function Home() {
  const [postsData, setPostsData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const t = useTranslations('home');

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const fetchPosts = async (page: number) => {
    try {
      setLoading(true);
      const data = await apiClient.getPosts(page, 6);
      setPostsData(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
        <Link href="./register">
          <Button size="lg" className="mr-4">
            <PenTool className="h-5 w-5 mr-2" />
            {t('hero.startWriting')}
          </Button>
        </Link>
        <Link href="./login">
          <Button variant="outline" size="lg">
            {t('hero.signIn')}
          </Button>
        </Link>
      </section>

      {/* Posts Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">{t('posts.title')}</h2>
        
        {postsData?.posts.length === 0 ? (
          <div className="text-center py-12">
            <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('posts.noPosts.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('posts.noPosts.subtitle')}
            </p>
            <Link href="./register">
              <Button>{t('posts.noPosts.createFirst')}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {t('posts.pagination.page', { 
                    current: currentPage, 
                    total: postsData.pagination.pages 
                  })}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === postsData.pagination.pages}
                >
                  Next
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