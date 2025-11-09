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
import { useCrudDialogsWithFilter } from '@/hooks/factory';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/useApi';
import { formatDatetime } from '@/lib/utils';
import { translateValidationError } from '@/lib/validation-errors';
import {
  CreateUserInput,
  createUserSchema,
  UpdateUserInput,
  updateUserSchema,
} from '@/lib/validations';
import { IUpdateUserRequest, IUser } from '@/types/user.type';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

function UsersPageContent() {
  const t = useTranslations('pages.users');
  const tc = useTranslations('common');
  const tValidation = useTranslations('validation');

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
    dialogs.openDeleteConfirm(user.id);
    dialogs.editingItem = user;
  };

  const confirmDeleteUser = async () => {
    if (!dialogs.editingItem) return;
    await deleteUser.mutateAsync(dialogs.editingItem.id);
    toast.success(t('userDeletedSuccess'));
    dialogs.closeDeleteConfirm();
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
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
                  Error Loading Users
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </p>
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
              <UsersIcon className="h-6 w-6" />
              <h1 className="text-3xl sm:text-4xl font-bold">{t('title')}</h1>
            </div>
            <p className="text-muted-foreground">{t('title')}</p>
          </div>

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
                  {t('createNewUser')}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={createForm.handleSubmit(handleCreateUser)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="create-email">{t('email')}</Label>
                  <Input
                    id="create-email"
                    type="email"
                    {...createForm.register('email')}
                    placeholder="example@email.com"
                    className="h-8"
                  />
                  {createForm.formState.errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {translateValidationError(
                        createForm.formState.errors.email.message,
                        tValidation,
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-username">{t('username')}</Label>
                  <Input
                    id="create-username"
                    {...createForm.register('username')}
                    placeholder="username"
                    className="h-8"
                  />
                  {createForm.formState.errors.username && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {translateValidationError(
                        createForm.formState.errors.username.message,
                        tValidation,
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">{t('password')}</Label>
                  <Input
                    id="create-password"
                    type="password"
                    {...createForm.register('password')}
                    placeholder="••••••••"
                    className="h-8"
                  />
                  {createForm.formState.errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {translateValidationError(
                        createForm.formState.errors.password.message,
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
                    onClick={() => {
                      dialogs.closeCreate();
                      createForm.reset();
                    }}
                  >
                    {tc('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
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

        {/* Users Table */}
        {usersData && usersData.users.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {dialogs.searchTerm && (
                <p className="text-xs text-muted-foreground">
                  Showing{' '}
                  <span className="font-semibold text-foreground">
                    {usersData.users.length}
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
                      {t('email')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      {t('username')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      {t('tableHeaderCreated')}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      {t('tableHeaderActions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={
                        index === usersData.users.length - 1 ? '' : 'border-b'
                      }
                    >
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4 font-semibold">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDatetime(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {usersData && usersData.users.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-8 w-8 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              {dialogs.searchTerm ? t('noUsersFound') : 'No users yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {dialogs.searchTerm
                ? 'No users match your search. Try adjusting your search terms.'
                : 'Start creating users to manage your application.'}
            </p>
            {dialogs.searchTerm && (
              <Button variant="outline" onClick={dialogs.clearSearch}>
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {usersData &&
          usersData.pagination.total > 1 &&
          usersData.users.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {tc('previous')}
              </Button>

              <span className="text-xs font-semibold px-3 py-2 rounded">
                {t('pageOf', {
                  current: page,
                  total: usersData.pagination.total,
                })}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === usersData.pagination.total}
              >
                {tc('next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

        {/* Edit User Dialog */}
        <Dialog open={dialogs.isEditOpen} onOpenChange={dialogs.setIsEditOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {t('editUser')}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateUser)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...updateForm.register('email')}
                  className="h-8"
                />
                {updateForm.formState.errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {translateValidationError(
                      updateForm.formState.errors.email.message,
                      tValidation,
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">{t('username')}</Label>
                <Input
                  id="edit-username"
                  {...updateForm.register('username')}
                  className="h-8"
                />
                {updateForm.formState.errors.username && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {translateValidationError(
                      updateForm.formState.errors.username.message,
                      tValidation,
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">{t('newPassword')}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  {...updateForm.register('password')}
                  placeholder={t('passwordPlaceholder')}
                  className="h-8"
                />
                {updateForm.formState.errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {translateValidationError(
                      updateForm.formState.errors.password.message,
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
                  onClick={() => {
                    dialogs.closeEdit();
                    updateForm.reset();
                  }}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={dialogs.deleteConfirmId !== null}
          onOpenChange={() => dialogs.closeDeleteConfirm()}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Delete User
              </DialogTitle>
            </DialogHeader>
            <div>
              <p className="text-muted-foreground">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
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
                onClick={confirmDeleteUser}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deleting...' : tc('delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute page="users">
      <UsersPageContent />
    </ProtectedRoute>
  );
}
