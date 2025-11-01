'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCreatePost, useTags } from '@/hooks/useApi';
import { X, Save, Eye } from 'lucide-react';

interface CreatePostFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePostForm({ onSuccess, onCancel }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  const router = useRouter();
  const createPostMutation = useCreatePost();
  const { data: tagsData, isLoading: tagsLoading } = useTags(1, 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        published,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });

      // Reset form
      setTitle('');
      setContent('');
      setPublished(false);
      setSelectedTagIds([]);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectedTags = tagsData?.tags?.filter(tag => selectedTagIds.includes(tag.id)) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Post</h1>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            required
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content in Markdown..."
            className="min-h-[400px]"
            required
          />
          <p className="text-sm text-muted-foreground">
            You can use Markdown syntax for formatting.
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          {tagsLoading ? (
            <p className="text-sm text-muted-foreground">Loading tags...</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {tagsData?.tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : { borderColor: tag.color }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color }}
                        className="text-white"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag.id)}
                          className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Publish Status */}
        <div className="space-y-2">
          <Label htmlFor="published">Status</Label>
          <Select value={published ? "published" : "draft"} onValueChange={(value) => setPublished(value === "published")}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Save as Draft</SelectItem>
              <SelectItem value="published">Publish</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={createPostMutation.isPending || !title.trim() || !content.trim()}
            className="min-w-[120px]"
          >
            {createPostMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {published ? <Eye className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {published ? 'Publish' : 'Save Draft'}
              </div>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {createPostMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">
              Error: {createPostMutation.error.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}