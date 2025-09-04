'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownEditor } from '@/components/markdown-editor';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Eye } from 'lucide-react';
import { useLocale } from 'next-intl';
import { apiClient } from '@/lib/api';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState<string>('');
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Get the slug from params
    params.then(({ slug: paramSlug }) => {
      setSlug(paramSlug);
    });
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
      return;
    }
    
    if (user && slug) {
      fetchPost();
    }
  }, [user, authLoading, slug, router, locale]);

  const fetchPost = async () => {
    if (!slug) return;
    
    try {
      const postData = await apiClient.getPostBySlug(slug);
      setPost(postData);
      setTitle(postData.title);
      setContent(postData.content);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      if (error.message.includes('404') || error.message.includes('not found')) {
        router.push('./dashboard');
      } else {
        setError('Failed to load post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (published: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiClient.updatePost(slug, { title, content, published });
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating the post');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!user || !post) {
    return null;
  }

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your post title..."
              className="text-lg"
            />
          </div>

          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content in Markdown..."
          />

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={saving}
              >
                <Eye className="h-4 w-4 mr-2" />
                {post.published ? 'Update & Publish' : 'Publish'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}