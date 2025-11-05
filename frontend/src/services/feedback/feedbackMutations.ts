/**
 * feedback mutations for React Query
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface FeedbackSubmissionData {
  feedbackType: string;
  description: string;
  attachedFilePath?: string;
}

export interface FeedbackMutationResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export const useSubmitGeneralFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FeedbackSubmissionData): Promise<FeedbackMutationResponse> => {
      // Transform camelCase to snake_case for backend
      const backendData = {
        feedback_type: data.feedbackType,
        description: data.description,
        ...(data.attachedFilePath && { attached_file_path: data.attachedFilePath })
      };
      
      const response = await apiClient.post<{ message: string }>('/feedback', backendData);
      return {
        success: true,
        data: response.data
      };
    },
    onSuccess: (data) => {
      // invalidate feedback queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-statistics'] });
      
      toast({
        variant: "success",
        title: "Feedback Submitted",
        description: data.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });
};

