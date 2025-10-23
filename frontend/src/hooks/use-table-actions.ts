import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useConfirmation } from './use-confirmation';

// ============================================================================
// SHARED TABLE ACTIONS HOOK
// ============================================================================

export interface TableActionConfig {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  confirmMessage?: string;
}

export const useTableActions = () => {
  const { toast } = useToast();
  const confirmation = useConfirmation();
  const queryClient = useQueryClient();

  const createDeleteMutation = <T>(
    deleteFn: (id: number) => Promise<T>,
    config: TableActionConfig = {}
  ) => {
    return useMutation({
      mutationFn: deleteFn,
      onSuccess: () => {
        toast({
          title: "Success",
          description: config.successMessage || "Item deleted successfully",
        });
        config.onSuccess?.();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: config.errorMessage || error.message,
          variant: "destructive",
        });
        config.onError?.(error);
      },
    });
  };

  const createBulkDeleteMutation = <T>(
    deleteFn: (ids: number[]) => Promise<T>,
    config: TableActionConfig = {}
  ) => {
    return useMutation({
      mutationFn: deleteFn,
      onSuccess: () => {
        toast({
          title: "Success",
          description: config.successMessage || "Items deleted successfully",
        });
        config.onSuccess?.();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: config.errorMessage || error.message,
          variant: "destructive",
        });
        config.onError?.(error);
      },
    });
  };

  const createUpdateMutation = <T, U>(
    updateFn: (id: number, data: U) => Promise<T>,
    config: TableActionConfig = {}
  ) => {
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: U }) => updateFn(id, data),
      onSuccess: () => {
        toast({
          title: "Success",
          description: config.successMessage || "Item updated successfully",
        });
        config.onSuccess?.();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: config.errorMessage || error.message,
          variant: "destructive",
        });
        config.onError?.(error);
      },
    });
  };

  const handleDelete = async (
    id: number,
    deleteFn: (id: number) => Promise<any>,
    config: TableActionConfig = {}
  ) => {
    const confirmed = await confirmation.confirm({
      title: "Confirm Deletion",
      message: config.confirmMessage || "Are you sure you want to delete this item?",
      type: "danger"
    });

    if (confirmed) {
      try {
        await deleteFn(id);
        toast({
          title: "Success",
          description: config.successMessage || "Item deleted successfully",
        });
        config.onSuccess?.();
      } catch (error) {
        toast({
          title: "Error",
          description: config.errorMessage || (error as Error).message,
          variant: "destructive",
        });
        config.onError?.(error as Error);
      }
    }
  };

  const handleBulkDelete = async (
    ids: number[],
    deleteFn: (ids: number[]) => Promise<any>,
    config: TableActionConfig = {}
  ) => {
    const confirmed = await confirmation.confirm({
      title: "Confirm Bulk Deletion",
      message: config.confirmMessage || `Are you sure you want to delete ${ids.length} items?`,
      type: "danger"
    });

    if (confirmed) {
      try {
        await deleteFn(ids);
        toast({
          title: "Success",
          description: config.successMessage || "Items deleted successfully",
        });
        config.onSuccess?.();
      } catch (error) {
        toast({
          title: "Error",
          description: config.errorMessage || (error as Error).message,
          variant: "destructive",
        });
        config.onError?.(error as Error);
      }
    }
  };

  const invalidateQueries = (queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  return {
    createDeleteMutation,
    createBulkDeleteMutation,
    createUpdateMutation,
    handleDelete,
    handleBulkDelete,
    invalidateQueries,
  };
};
