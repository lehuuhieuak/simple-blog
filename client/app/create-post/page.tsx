'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LexicalEditor } from '@/components/lexical-editor';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Eye, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('post.create');
  const tCommon = useTranslations('common');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`);
      const data = await response.json();
      setAvailableTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  if (!authLoading && !user) {
    router.push(`/${locale}/login`);
    return null;
  }

  const handleSubmit = async (published: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError(t('titleRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagIds = selectedTags.map(tag => tag.id);
      await apiClient.createPost({
        title,
        content,
        published,
        tag_ids: tagIds
      });
      router.push('./dashboard');
    } catch (error: any) {
      setError(error.message || tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagId: number) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{tCommon('title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>{tCommon('tags')}</Label>
            <div className="space-y-3">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color, color: 'white' }}
                      className="flex items-center gap-1"
                    >
                      {tag.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:bg-black/20 rounded"
                        onClick={() => removeTag(tag.id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => !selectedTags.find(t => t.id === tag.id))
                  .map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: tag.color, color: tag.color }}
                      onClick={() => addTag(tag)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
              </div>
              {availableTags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('tagsUnavailable')} <a href="./tags" className="text-primary hover:underline">{t('tagsUnavailable')}</a> first.
                </p>
              )}
            </div>
          </div>

          <LexicalEditor
            value={content}
            onChange={setContent}
            placeholder={t('contentPlaceholder')}
          />

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('saveAsDraft')}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                {tCommon('publish')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}