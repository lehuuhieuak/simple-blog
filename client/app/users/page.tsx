'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/useApi';
import { useCrudDialogsWithFilter } from '@/hooks/factory';
import { formatDatetime } from '@/lib/utils';
import {
  CreateUserInput,
  createUserSchema,
  UpdateUserInput,
  updateUserSchema,
} from '@/lib/validations';
import { IUpdateUserRequest, IUser } from '@/types/user.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function UsersPage() {
  const t = useTranslations('pages.users');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);

  // Use factory hook for CRUD dialog state management
  const dialogs = useCrudDialogsWithFilter<IUser>('');

  const limit = 10;
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useUsers(page, limit, dialogs.searchTerm, '');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Create user form
  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  // Update user form
  const updateForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleCreateUser = async (data: CreateUserInput) => {
    await createUser.mutateAsync(data);
    dialogs.closeCreate();
    createForm.reset();
    toast.success(t('userCreatedSuccess'));
    refetch();
  };

  const handleEditUser = (user: IUser) => {
    dialogs.openEdit(user);
    updateForm.reset({
      email: user.email,
      username: user.username,
      password: '',
    });
  };

  const handleUpdateUser = async (data: UpdateUserInput) => {
    if (!dialogs.editingItem) return;

    const updateData: IUpdateUserRequest = {
      email: data.email,
      username: data.username,
    };

    if (data.password && data.password.trim() !== '') {
      updateData.password = data.password;
    }

    await updateUser.mutateAsync({
      id: dialogs.editingItem.id,
      data: updateData,
    });
    dialogs.closeEdit();
    updateForm.reset();
    toast.success(t('userUpdatedSuccess'));
    refetch();
  };

  const handleDeleteUser = async (user: IUser) => {
    if (!confirm(t('deleteUserConfirm', { username: user.username }))) {
      return;
    }

    await deleteUser.mutateAsync(user.id);
    toast.success(t('userDeletedSuccess'));
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {t('errorLoading', { error: error.message })}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Dialog open={dialogs.isCreateOpen} onOpenChange={dialogs.setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('createButton')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createNewUser')}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={createForm.handleSubmit(handleCreateUser)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="create-email">{t('email')}</Label>
                <Input
                  id="create-email"
                  type="email"
                  {...createForm.register('email')}
                />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="create-username">{t('username')}</Label>
                <Input
                  id="create-username"
                  {...createForm.register('username')}
                />
                {createForm.formState.errors.username && (
                  <p className="text-sm text-red-500 mt-1">
                    {createForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="create-password">{t('password')}</Label>
                <Input
                  id="create-password"
                  type="password"
                  {...createForm.register('password')}
                />
                {createForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {createForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    dialogs.closeCreate();
                    createForm.reset();
                  }}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createUser.isPending || createForm.formState.isSubmitting
                  }
                >
                  {createUser.isPending ? t('creatingButton') : tc('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">{t('searchLabel')}</Label>
              <div className="flex space-x-2">
                <Input
                  id="search"
                  placeholder={t('searchPlaceholder')}
                  value={dialogs.searchTerm}
                  onChange={(e) => dialogs.setSearchTerm(e.target.value)}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="email-filter">{t('emailFilter')}</Label>
              <Input
                id="email-filter"
                placeholder={t('emailFilterPlaceholder')}
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  dialogs.clearSearch();
                  setPage(1);
                  refetch();
                }}
              >
                {t('clearFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('usersCount', { count: usersData?.users.length || 0 })}</CardTitle>
        </CardHeader>
        <CardContent>
          {usersData?.users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('noUsersFound')}</div>
          ) : (
            <div className="space-y-4">
              {usersData?.users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{user.username}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Badge variant="secondary">{t('userId', { id: user.id })}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{t('created', { date: formatDatetime(user.created_at) })}</p>
                      <p>{t('updated', { date: formatDatetime(user.updated_at) })}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {usersData && usersData.pagination.total > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                {tc('previous')}
              </Button>
              <span className="text-sm">
                {t('pageOf', { current: page, total: usersData.pagination.total })}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === usersData.pagination.total}
              >
                {tc('next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={dialogs.isEditOpen} onOpenChange={dialogs.setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={updateForm.handleSubmit(handleUpdateUser)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit-email">{t('email')}</Label>
              <Input
                id="edit-email"
                type="email"
                {...updateForm.register('email')}
              />
              {updateForm.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {updateForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-username">{t('username')}</Label>
              <Input id="edit-username" {...updateForm.register('username')} />
              {updateForm.formState.errors.username && (
                <p className="text-sm text-red-500 mt-1">
                  {updateForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-password">{t('newPassword')}</Label>
              <Input
                id="edit-password"
                type="password"
                {...updateForm.register('password')}
                placeholder={t('passwordPlaceholder')}
              />
              {updateForm.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {updateForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  dialogs.closeEdit();
                  updateForm.reset();
                }}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  updateUser.isPending || updateForm.formState.isSubmitting
                }
              >
                {updateUser.isPending ? t('updatingButton') : tc('update')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
