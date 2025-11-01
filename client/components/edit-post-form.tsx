'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LexicalEditor } from '@/components/lexical-editor';
import { useUpdatePost } from '@/hooks/api/posts';
import { useTags } from '@/hooks/api/tags';
import { Save, Eye, X, ArrowLeft } from 'lucide-react';
import { IPost } from '@/types/post.typs';

interface EditPostFormProps {
  post: IPost;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content || '');
  const [published, setPublished] = useState(post.published);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const updatePostMutation = useUpdatePost();
  const { data: tagsData, isLoading: tagsLoading } = useTags(1, 100);

  // Initialize selected tags when post and tags data are loaded
  useEffect(() => {
    if (post.tags && tagsData?.tags) {
      const postTagIds = post.tags.map(tag => tag.id);
      const matchingTags = tagsData.tags.filter(tag => postTagIds.includes(tag.id));
      setSelectedTags(matchingTags);
    }
  }, [post.tags, tagsData]);

  const availableTags = tagsData?.tags || [];

  const handleSubmit = async (publishStatus: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setError('');

    try {
      const tagIds = selectedTags.map(tag => tag.id);
      await updatePostMutation.mutateAsync({
        slug: post.slug,
        data: {
          title: title.trim(),
          content: content.trim(),
          published: publishStatus,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
        }
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating the post');
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

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <CardTitle>Edit Post</CardTitle>
          </div>
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

          <div className="space-y-2">
            <Label>Tags</Label>
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
              {availableTags.length === 0 && !tagsLoading && (
                <p className="text-sm text-muted-foreground">
                  No tags available. <a href="/tags" className="text-primary hover:underline">Create some tags</a> first.
                </p>
              )}
              {tagsLoading && (
                <p className="text-sm text-muted-foreground">Loading tags...</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <LexicalEditor
              value={content}
              onChange={setContent}
              placeholder="Write your post content..."
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-4">
              <Badge variant={published ? "default" : "secondary"}>
                {published ? "Published" : "Draft"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Current status: {published ? "This post is published and visible to everyone" : "This post is saved as a draft"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={updatePostMutation.isPending}
            >
              Cancel
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Publishing...
                  </div>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>

          {updatePostMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">
                Error: {updatePostMutation.error.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}