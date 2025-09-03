'use client';

import { useState } from 'react';
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

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const locale = useLocale();

  if (!authLoading && !user) {
    router.push(`/${locale}/login`);
    return null;
  }

  const handleSubmit = async (published: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.createPost({ title, content, published });
      router.push('./dashboard');
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating the post');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
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
              disabled={loading}
            >
              Cancel
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}