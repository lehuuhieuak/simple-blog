'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from '@/hooks/api/tags';
import { useCrudDialogsWithFilter } from '@/hooks/factory';
import { tagSchema, type TagInput } from '@/lib/validations';
import { ITag } from '@/types/tag.type';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#8B5A2B', '#059669', '#DC2626'
];

export default function TagsManagePage() {
  const t = useTranslations('pages.tags');
  const tc = useTranslations('common');

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  // Use factory hook for CRUD dialog state management
  const dialogs = useCrudDialogsWithFilter<ITag>('' as any);

  const { user } = useAuth();
  const { data: tagsData, isLoading, error } = useTags(currentPage, limit);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const createForm = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      description: '',
      color: COLORS[0],
    },
  });

  const editForm = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
  });

  // Filter tags based on search term
  const filteredTags = tagsData?.tags?.filter(tag =>
    tag.name.toLowerCase().includes(dialogs.searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(dialogs.searchTerm.toLowerCase())
  ) || [];

  const handleCreateTag = async (data: TagInput) => {
    try {
      await createTagMutation.mutateAsync({
        name: data.name,
        description: data.description || '',
        color: data.color,
      });
      createForm.reset();
      dialogs.closeCreate();
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleEditTag = async (data: TagInput) => {
    if (!dialogs.editingItem) return;

    try {
      await updateTagMutation.mutateAsync({
        id: dialogs.editingItem.id,
        data: {
          name: data.name,
          description: data.description || '',
          color: data.color,
        },
      });
      editForm.reset();
      dialogs.closeEdit();
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await deleteTagMutation.mutateAsync(id);
      dialogs.closeDeleteConfirm();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const openEditDialog = (tag: ITag) => {
    dialogs.openEdit(tag);
    editForm.reset({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loadingTags')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">{t('errorLoading', { error: error.message })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TagIcon className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>

        {user && (
          <Dialog open={dialogs.isCreateOpen} onOpenChange={dialogs.setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createButton')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={createForm.handleSubmit(handleCreateTag)} className="space-y-4">
                <div>
                  <Label htmlFor="create-name">{tc('title')}</Label>
                  <Input
                    id="create-name"
                    {...createForm.register('name')}
                    placeholder={t('tagNamePlaceholder')}
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {createForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-description">{tc('content')}</Label>
                  <Textarea
                    id="create-description"
                    {...createForm.register('description')}
                    placeholder={t('tagDescriptionPlaceholder')}
                    rows={3}
                  />
                  {createForm.formState.errors.description && (
                    <p className="text-sm text-red-600 mt-1">
                      {createForm.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>{t('colorLabel')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          createForm.watch('color') === color
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => createForm.setValue('color', color)}
                      />
                    ))}
                  </div>
                  {createForm.formState.errors.color && (
                    <p className="text-sm text-red-600 mt-1">
                      {createForm.formState.errors.color.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={dialogs.closeCreate}
                  >
                    {tc('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTagMutation.isPending}
                  >
                    {createTagMutation.isPending ? t('creatingButton') : t('createButton')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tc('search')}
          value={dialogs.searchTerm}
          onChange={(e) => dialogs.setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {dialogs.searchTerm && (
          <button
            onClick={dialogs.clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTags.map((tag) => (
          <Card key={tag.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  style={{ backgroundColor: tag.color, color: 'white' }}
                  className="text-sm"
                >
                  {tag.name}
                </Badge>
                {user && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dialogs.openDeleteConfirm(tag.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tag.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {tag.description}
                </p>
              )}
              <Link href={`/tags/${tag.slug}`}>
                <Button variant="outline" size="sm" className="w-full">
                  {t('viewPostsButton')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {dialogs.searchTerm ? t('noTags') : t('noTagsYet')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {dialogs.searchTerm
              ? t('noTags')
              : t('noTagsYet')
            }
          </p>
          {dialogs.searchTerm && (
            <Button variant="outline" onClick={dialogs.clearSearch}>
              {t('searchCleared')}
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {tagsData && tagsData.pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            {tc('previous')}
          </Button>

          <span className="text-sm text-muted-foreground">
            {t('paginationText', { currentPage, total: tagsData.pagination.pages })}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === tagsData.pagination.pages}
          >
            {tc('next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogs.isEditOpen} onOpenChange={dialogs.setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditTag)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{tc('title')}</Label>
              <Input
                id="edit-name"
                {...editForm.register('name')}
                placeholder={t('tagNamePlaceholder')}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-description">{tc('content')}</Label>
              <Textarea
                id="edit-description"
                {...editForm.register('description')}
                placeholder={t('tagDescriptionPlaceholder')}
                rows={3}
              />
              {editForm.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {editForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label>{t('colorLabel')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      editForm.watch('color') === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => editForm.setValue('color', color)}
                  />
                ))}
              </div>
              {editForm.formState.errors.color && (
                <p className="text-sm text-red-600 mt-1">
                  {editForm.formState.errors.color.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={dialogs.closeEdit}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={updateTagMutation.isPending}
              >
                {updateTagMutation.isPending ? t('updatingButton') : t('updateButton')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogs.deleteConfirmId !== null} onOpenChange={() => dialogs.closeDeleteConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {t('deleteConfirmation')}
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={dialogs.closeDeleteConfirm}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => dialogs.deleteConfirmId && handleDeleteTag(dialogs.deleteConfirmId as number)}
              disabled={deleteTagMutation.isPending}
            >
              {deleteTagMutation.isPending ? t('deletingButton') : tc('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
