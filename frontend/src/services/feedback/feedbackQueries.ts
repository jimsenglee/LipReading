/**
 * feedback queries for React Query
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

export interface Feedback {
  id: number;
  publicId: string;
  feedbackType: string;
  description: string;
  attachedFilePath?: string;
  submissionDate?: string;
  status: string;
}

export interface FeedbackResponse {
  success: boolean;
  data: Feedback[];
}

export interface FeedbackStatistics {
  totalFeedback: number;
  generalFeedback: number;
  bugReports: number;
  featureSuggestions: number;
}

export const useFeedback = () => {
  return useQuery({
    queryKey: ['feedback'],
    queryFn: async (): Promise<FeedbackResponse> => {
      const response = await apiClient.get<Feedback[]>('/feedback');
      return {
        success: true,
        data: response.data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFeedbackStatistics = () => {
  return useQuery({
    queryKey: ['feedback-statistics'],
    queryFn: async (): Promise<FeedbackStatistics> => {
      const response = await apiClient.get<FeedbackStatistics>('/feedback/statistics');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

