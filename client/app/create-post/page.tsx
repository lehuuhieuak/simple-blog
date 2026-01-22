'use client';

// import { LexicalEditor } from '@/components/lexical-editor';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatePost } from '@/hooks/api/posts';
import { useTags } from '@/hooks/api/tags';
import { translateValidationError } from '@/lib/validation-errors';
import { postSchema } from '@/lib/validations';
import type { ITag } from '@/types/tag.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

function CreatePostPageContent() {
  const router = useRouter();
  const t = useTranslations('post.create');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  // React Query hooks for server state
  const { data: tagsData } = useTags(1, 100);
  const createPostMutation = useCreatePost();

  // Local state for tags (separate from form)
  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);

  // Form setup with react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting: isValidating },
    setError,
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      published: false,
    },
  });

  const content = watch('content');

  const handleSaveAsDraft = async () => {
    await handleSubmit(async (data: FieldValues) => {
      try {
        const tagIds = selectedTags.map((tag) => tag.id);
        await createPostMutation.mutateAsync({
          title: data.title,
          content,
          published: false,
          tag_ids: tagIds,
        });
        router.push('./dashboard');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : tCommon('error');
        setError('root', {
          message: errorMessage,
        });
      }
    })();
  };

  const handlePublish = async () => {
    await handleSubmit(async (data: FieldValues) => {
      if (!content.trim()) {
        setError('content', {
          message: t('contentRequired') || 'Content is required',
        });
        return;
      }
      try {
        const tagIds = selectedTags.map((tag) => tag.id);
        await createPostMutation.mutateAsync({
          title: data.title,
          content,
          published: true,
          tag_ids: tagIds,
        });
        router.push('./dashboard');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : tCommon('error');
        setError('root', {
          message: errorMessage,
        });
      }
    })();
  };

  const addTag = (tag: ITag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagId: number) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const availableTags = tagsData?.tags || [];
  const isSubmitting = createPostMutation.isPending || isValidating;

  const rootError = errors.root?.message;

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {rootError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {rootError}
            </div>
          )}

          <div className="grid w-full max-w-full items-center gap-3">
            <Label htmlFor="title">{tCommon('title')}</Label>
            <Input
              id="title"
              placeholder={t('titlePlaceholder')}
              // className="text-lg"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-600">
                {translateValidationError(errors.title.message, tValidation)}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            <Label>{tCommon('tags')}</Label>
            <div className="space-y-3">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag.id} className="flex items-center gap-1">
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
                  .filter((tag) => !selectedTags.find((t) => t.id === tag.id))
                  .map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => addTag(tag)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Label>{tCommon('content')}</Label>
            <SimpleEditor
              content={content}
              handleUpdate={(newContent: string) => {
                setValue('content', newContent, { shouldValidate: true });
              }}
            />
            {errors.content && (
              <p className="text-xs text-red-600">
                {translateValidationError(errors.content.message, tValidation)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
              >
                <Save />
                {t('saveAsDraft')}
              </Button>
              <Button onClick={handlePublish} disabled={isSubmitting}>
                <Eye />
                {tCommon('publish')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <ProtectedRoute page="create-post">
      <CreatePostPageContent />
    </ProtectedRoute>
  );
}
