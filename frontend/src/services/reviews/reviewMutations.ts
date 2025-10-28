/**
 * review mutations for React Query
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface ReviewSubmissionData {
  rating: number;
  reviewText?: string;
}

export interface ReviewMutationResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// phase 4: review mutations for React Query
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tutorialId, data }: { tutorialId: number; data: ReviewSubmissionData }): Promise<ReviewMutationResponse> => {
      const response = await apiClient.post<{ message: string }>(`/bookmarks/${tutorialId}/review`, data);
      return {
        success: true,
        data: response.data
      };
    },
    onSuccess: (data, { tutorialId }) => {
      // invalidate review queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tutorial-reviews', tutorialId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', tutorialId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      
      toast({
        title: "Success",
        description: data.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit review",
        variant: "destructive",
      });
    },
  });
};
