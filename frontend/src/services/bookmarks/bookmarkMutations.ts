/**
 * bookmark mutations for React Query
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import  apiClient  from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface BookmarkMutationResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// phase 4: bookmark mutations for React Query
export const useAddBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tutorialId: number): Promise<BookmarkMutationResponse> => {
      const response = await apiClient.post<{ message: string }>(`/bookmarks/${tutorialId}`);
      return {
        success: true,
        data: response.data
      };
    },
    onSuccess: (data, tutorialId) => {
      // invalidate bookmark queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-check', tutorialId] });
      
      toast({
        title: "Success",
        description: data.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add bookmark",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tutorialId: number): Promise<BookmarkMutationResponse> => {
      const response = await apiClient.delete<{ message: string }>(`/bookmarks/${tutorialId}`);
      return {
        success: true,
        data: response.data
      };
    },
    onSuccess: (data, tutorialId) => {
      // invalidate bookmark queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-check', tutorialId] });
      
      toast({
        title: "Success",
        description: data.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to remove bookmark",
        variant: "destructive",
      });
    },
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tutorialId, isBookmarked }: { tutorialId: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        const response = await apiClient.delete<{ message: string }>(`/bookmarks/${tutorialId}`);
        return {
          success: true,
          data: response.data
        };
      } else {
        const response = await apiClient.post<{ message: string }>(`/bookmarks/${tutorialId}`);
        return {
          success: true,
          data: response.data
        };
      }
    },
    onSuccess: (data, { tutorialId }) => {
      // invalidate bookmark queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-check', tutorialId] });
      
      toast({
        title: "Success",
        description: data.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to toggle bookmark",
        variant: "destructive",
      });
    },
  });
};
