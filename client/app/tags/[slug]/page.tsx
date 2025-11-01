'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PostCard } from '@/components/post-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';
import { usePostsByTag, useTags } from '@/hooks/useApi';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  author_username: string;
  created_at: string;
  published: boolean;
  tags?: Tag[];
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

export default function TagPostsPage() {
  const params = useParams();
  const tagSlug = params.slug as string;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: postsData, isLoading: postsLoading, error: postsError } = usePostsByTag(tagSlug, currentPage, 6);
  const { data: tagsData, isLoading: tagsLoading } = useTags(1, 100);
  
  const tag = tagsData?.tags?.find((t: Tag) => t.slug === tagSlug) || null;
  const loading = postsLoading || tagsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (postsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">Error loading posts: {postsError.message}</p>
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="text-center py-12">
        <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Tag not found</h1>
        <p className="text-muted-foreground mb-4">
          The tag you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Tag Header */}
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <div className="flex items-center justify-center mb-4">
          <Badge
            className="text-lg px-4 py-2"
            style={{ backgroundColor: tag.color, color: 'white' }}
          >
            <TagIcon className="h-5 w-5 mr-2" />
            {tag.name}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          Posts tagged with &quot;{tag.name}&quot;
        </h1>
        {tag.description && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {tag.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          {postsData?.pagination.total || 0} posts found
        </p>
      </section>

      {/* Posts Section */}
      <section>
        {postsData?.posts.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              There are no published posts with this tag yet.
            </p>
            <Link href="/">
              <Button>Browse All Posts</Button>
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
                  Page {currentPage} of {postsData.pagination.pages}
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

      {/* Navigation */}
      <div className="flex items-center justify-center space-x-4">
        <Link href="/tags">
          <Button variant="outline">
            <TagIcon className="h-4 w-4 mr-2" />
            All Tags
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}