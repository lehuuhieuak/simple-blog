'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePost } from '@/hooks/api/posts';
import { useTags } from '@/hooks/api/tags';
import { translateValidationError } from '@/lib/validation-errors';
import { postSchema } from '@/lib/validations';
import { IPost } from '@/types/post.typs';
import { ITag } from '@/types/tag.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { SimpleEditor } from './tiptap-templates/simple/simple-editor';

interface EditPostFormProps {
  post: IPost;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const router = useRouter();

  const [selectedTags, setSelectedTags] = useState<ITag[]>([]);
  const t = useTranslations('forms.editPostForm');
  const tValidation = useTranslations('validation');
  const tPages = useTranslations('pages.editPost');

  const updatePostMutation = useUpdatePost();
  const { data: tagsData, isLoading: tagsLoading } = useTags(1, 100);

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
      title: post.title,
      content: post.content || '',
      published: post.published,
    },
    mode: 'onChange',
  });

  const content = watch('content');

  // Initialize selected tags when post and tags data are loaded
  useEffect(() => {
    if (post.tags && tagsData?.tags) {
      const postTagIds = post.tags.map((tag) => tag.id);
      const matchingTags = tagsData.tags.filter((tag) =>
        postTagIds.includes(tag.id),
      );
      setSelectedTags(matchingTags);
    }
  }, [post.tags, tagsData]);

  const availableTags = tagsData?.tags || [];

  const handleSaveAsDraft = async () => {
    await handleSubmit(async (data: FieldValues) => {
      if (!content.trim()) {
        setError('content', {
          message: t('contentRequired'),
        });
        return;
      }

      try {
        const tagIds = selectedTags.map((tag) => tag.id);
        await updatePostMutation.mutateAsync({
          slug: post.slug,
          data: {
            title: data.title,
            content: content.trim(),
            published: false,
            tag_ids: tagIds.length > 0 ? tagIds : undefined,
          },
        });

        router.push('/dashboard');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : t('error', { error: 'Unknown error' });
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
          message: t('contentRequired'),
        });
        return;
      }

      try {
        const tagIds = selectedTags.map((tag) => tag.id);
        await updatePostMutation.mutateAsync({
          slug: post.slug,
          data: {
            title: data.title,
            content: content.trim(),
            published: true,
            tag_ids: tagIds.length > 0 ? tagIds : undefined,
          },
        });

        router.push('/dashboard');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : t('error', { error: 'Unknown error' });
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

  const rootError = errors.root?.message;
  const isSubmitting = updatePostMutation.isPending || isValidating;

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>{t('title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {rootError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {rootError}
            </div>
          )}

          <div className="grid gap-3">
            <Label htmlFor="title">{t('titleLabel')}</Label>
            <Input
              id="title"
              placeholder={t('titlePlaceholder')}
              className="text-lg"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-600">
                {translateValidationError(errors.title.message, tValidation)}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            <Label>{t('tagsLabel')}</Label>
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
              {availableTags.length === 0 && !tagsLoading && (
                <p className="text-sm text-muted-foreground">
                  {t('tagsUnavailable')}{' '}
                  <Link href="/tags" className="text-primary hover:underline">
                    {t('createTagsLink')}
                  </Link>
                  .
                </p>
              )}
              {tagsLoading && (
                <p className="text-sm text-muted-foreground">
                  {t('loadingTags')}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <Label>{t('contentLabel')}</Label>
            {/* <LexicalEditor
              value={content}
              onChange={(newContent) => {
                setValue('content', newContent, { shouldValidate: true });
              }}
              placeholder={t('contentPlaceholder')}
            /> */}
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

          <div className="grid gap-3">
            <Label>{t('statusLabel')}</Label>
            <div className="flex items-center gap-4">
              <Badge variant={post.published ? 'default' : 'secondary'}>
                {post.published ? t('published') : t('draft')}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {post.published
                  ? tPages('currentStatusPublished')
                  : tPages('currentStatusDraft')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {t('cancelButton')}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    {t('savingButton')}
                  </div>
                ) : (
                  <>
                    <Save />
                    {t('saveDraftButton')}
                  </>
                )}
              </Button>
              <Button onClick={handlePublish} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('publishingButton')}
                  </div>
                ) : (
                  <>
                    <Eye />
                    {t('publishButton')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
