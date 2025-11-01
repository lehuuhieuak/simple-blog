import { useState, useCallback } from 'react';

/**
 * Dialog and CRUD form state management
 * Eliminates repetitive dialog state logic in pages
 */
export interface CrudDialogState<T> {
  // Dialog visibility
  isCreateOpen: boolean;
  isEditOpen: boolean;

  // Editing state
  editingItem: T | null;

  // Dialog control helpers
  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (item: T) => void;
  closeEdit: () => void;

  // State setters for direct access
  setIsCreateOpen: (open: boolean) => void;
  setIsEditOpen: (open: boolean) => void;
  setEditingItem: (item: T | null) => void;
}

/**
 * Factory hook for managing CRUD dialog and form states
 * Reduces boilerplate in pages that handle create/edit operations
 *
 * @example
 * ```typescript
 * const dialogs = useCrudDialogs<IUser>();
 *
 * return (
 *   <>
 *     <Dialog open={dialogs.isCreateOpen} onOpenChange={dialogs.setIsCreateOpen}>
 *       //Create form
 *     </Dialog>
 *     <Dialog open={dialogs.isEditOpen} onOpenChange={dialogs.setIsEditOpen}>
 *       //Edit form - use dialogs.editingItem 
 *     </Dialog>
 *   </>
 * );
 * ```
 */
export function useCrudDialogs<T>(): CrudDialogState<T> {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setIsEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setIsEditOpen(false);
    setEditingItem(null);
  }, []);

  return {
    isCreateOpen,
    isEditOpen,
    editingItem,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    setIsCreateOpen,
    setIsEditOpen,
    setEditingItem,
  };
}

/**
 * Extended CRUD dialog state with search/filter capabilities
 * Useful for admin pages with search and pagination
 */
export interface CrudDialogFilterState<T> extends CrudDialogState<T> {
  // Search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;

  // Delete confirmation
  deleteConfirmId: number | string | null;
  setDeleteConfirmId: (id: number | string | null) => void;
  openDeleteConfirm: (id: number | string) => void;
  closeDeleteConfirm: () => void;
}

/**
 * Hook for managing CRUD dialogs with search and delete confirmation
 * Ideal for admin pages (users, tags) with filtering and deletion
 */
export function useCrudDialogsWithFilter<T extends { id?: number | string }>(
  initialSearchTerm = ''
): CrudDialogFilterState<T> {
  const dialogs = useCrudDialogs<T>();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const openDeleteConfirm = useCallback((id: number | string) => {
    setDeleteConfirmId(id);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  return {
    ...dialogs,
    searchTerm,
    setSearchTerm,
    clearSearch,
    deleteConfirmId,
    setDeleteConfirmId,
    openDeleteConfirm,
    closeDeleteConfirm,
  };
}
