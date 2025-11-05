/**
 * review mutations for React Query
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface ReviewSubmissionData {
  rating: number;
  reviewText?: string; // frontend naming (camelCase)
}

export interface ReviewMutationResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// review mutations for React Query
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tutorialId, data }: { tutorialId: number; data: ReviewSubmissionData }): Promise<ReviewMutationResponse> => {
      // map frontend camelCase to backend snake_case
      const backendData = {
        rating: data.rating,
        review_text: data.reviewText
      };
      const response = await apiClient.post<{ message: string }>(`/reviews/tutorials/${tutorialId}`, backendData);
      return {
        success: true,
        data: response.data
      };
    },
    onSuccess: (data, { tutorialId }) => {
      // invalidate review queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tutorial-reviews', tutorialId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', tutorialId] });
      
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
