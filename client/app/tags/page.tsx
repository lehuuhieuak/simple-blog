'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from '@/hooks/api/tags';
import { useCrudDialogsWithFilter } from '@/hooks/factory';
import { translateValidationError } from '@/lib/validation-errors';
import { tagSchema, type TagInput } from '@/lib/validations';
import { ITag } from '@/types/tag.type';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

function TagsManagePageContent() {
  const t = useTranslations('pages.tags');
  const tc = useTranslations('common');
  const tValidation = useTranslations('validation');

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  // Use factory hook for CRUD dialog state management
  const dialogs = useCrudDialogsWithFilter<ITag>('');

  const { user } = useAuth();
  const { data: tagsData, isLoading, error } = useTags(currentPage, limit);
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const createForm = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
    },
  });

  const editForm = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
  });

  // Filter tags based on search term
  const filteredTags =
    tagsData?.tags?.filter(
      (tag) =>
        tag.name.toLowerCase().includes(dialogs.searchTerm.toLowerCase()) ||
        tag.description
          ?.toLowerCase()
          .includes(dialogs.searchTerm.toLowerCase()),
    ) || [];

  const handleCreateTag = async (data: TagInput) => {
    try {
      await createTagMutation.mutateAsync({
        name: data.name,
        description: '',
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
          description: '',
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
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('loadingTags')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-destructive/50 bg-destructive/5 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  Error Loading Tags
                </p>
                <p className=" text-muted-foreground mt-1">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-8 p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TagIcon className="h-6 w-6" />
              <h1 className="text-3xl sm:text-4xl font-bold">{t('title')}</h1>
            </div>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>

          {user && (
            <Dialog
              open={dialogs.isCreateOpen}
              onOpenChange={dialogs.setIsCreateOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  {t('createButton')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {t('createTitle')}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateTag)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="create-name">{tc('title')}</Label>
                    <Input
                      id="create-name"
                      {...createForm.register('name')}
                      placeholder={t('tagNamePlaceholder')}
                      className="h-8"
                      autoFocus
                    />
                    {createForm.formState.errors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {translateValidationError(
                          createForm.formState.errors.name.message,
                          tValidation,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={dialogs.closeCreate}
                    >
                      {tc('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createTagMutation.isPending}
                    >
                      {createTagMutation.isPending
                        ? t('creatingButton')
                        : t('createButton')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tc('search')}
            value={dialogs.searchTerm}
            onChange={(e) => dialogs.setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
          {dialogs.searchTerm && (
            <button
              onClick={dialogs.clearSearch}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tags Table */}
        {filteredTags.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {dialogs.searchTerm && (
                <p className="text-xs text-muted-foreground">
                  Showing{' '}
                  <span className="font-semibold text-foreground">
                    {filteredTags.length}
                  </span>{' '}
                  results
                </p>
              )}
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-4 text-left font-semibold">
                      {t('tableHeaderId')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      {t('tableHeaderName')}
                    </th>
                    {user && (
                      <th className="px-6 py-4 text-right font-semibold">
                        {t('tableHeaderActions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag, index) => (
                    <tr
                      key={tag.id}
                      className={
                        index === filteredTags.length - 1 ? '' : 'border-b'
                      }
                    >
                      <td className="px-6 py-4 text-left">{index + 1}</td>
                      <td className="px-6 py-4">{tag.name}</td>
                      {user && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditDialog(tag)}
                              className="p-2 rounded"
                              title="Edit tag"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => dialogs.openDeleteConfirm(tag.id)}
                              className="p-2 rounded"
                              title="Delete tag"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTags.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="h-8 w-8 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              {dialogs.searchTerm ? t('noTags') : t('noTagsYet')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {dialogs.searchTerm
                ? 'No tags match your search. Try adjusting your search terms.'
                : 'Start creating tags to organize your blog posts.'}
            </p>
            {dialogs.searchTerm && (
              <Button variant="outline" onClick={dialogs.clearSearch}>
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {tagsData &&
          tagsData.pagination.pages > 1 &&
          filteredTags.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {tc('previous')}
              </Button>

              <span className="text-xs font-semibold px-3 py-2 rounded">
                {t('paginationText', {
                  currentPage,
                  total: tagsData.pagination.pages,
                })}
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
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {t('editTitle')}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={editForm.handleSubmit(handleEditTag)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">{tc('title')}</Label>
                <Input
                  id="edit-name"
                  {...editForm.register('name')}
                  placeholder={t('tagNamePlaceholder')}
                  className="h-8"
                  autoFocus
                />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {translateValidationError(
                      editForm.formState.errors.name.message,
                      tValidation,
                    )}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={dialogs.closeEdit}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateTagMutation.isPending}
                >
                  {updateTagMutation.isPending
                    ? t('updatingButton')
                    : t('updateButton')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={dialogs.deleteConfirmId !== null}
          onOpenChange={() => dialogs.closeDeleteConfirm()}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {t('deleteTitle')}
              </DialogTitle>
            </DialogHeader>
            <div>
              <p className="text-muted-foreground">{t('deleteConfirmation')}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={dialogs.closeDeleteConfirm}
              >
                {tc('cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  dialogs.deleteConfirmId &&
                  handleDeleteTag(dialogs.deleteConfirmId as number)
                }
                disabled={deleteTagMutation.isPending}
              >
                {deleteTagMutation.isPending
                  ? t('deletingButton')
                  : tc('delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function TagsPage() {
  return (
    <ProtectedRoute page="tags">
      <TagsManagePageContent />
    </ProtectedRoute>
  );
}
