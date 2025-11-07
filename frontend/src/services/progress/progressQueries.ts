/**
 * progress queries for React Query
 * following README.txt architecture patterns
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProgressReportsData {
  kpiCards: {
    totalQuizzes: number;
    averageScore: number;
    bestCategory: string;
    mostImproved: string;
    improvement: number;
  };
  quizTrend: Array<{
    date: string;
    score: number;
    count: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    count: number;
    percentage: number;
    averageScore: number;
  }>;
  recentQuizzes: Array<{
    id: number;
    publicId: string;
    quizId: number;
    quizTitle: string;
    categoryName: string;
    score: number;
    completionDate: string | null;
  }>;
  recentTutorials: Array<{
    id: number;
    publicId: string;
    title: string;
    categoryName: string;
    progressPercentage: number;
    lastAccessedAt: string | null;
    isCompleted: boolean;
  }>;
  summary: {
    totalQuizAttempts: number;
    averageScore: number;
    totalCategories: number;
    thisWeekQuizzes: number;
    improvement: number;
  };
}

export interface ProgressReportsResponse {
  success: boolean;
  data: ProgressReportsData;
}

// ============================================================================
// PROGRESS QUERIES
// ============================================================================

export const useProgressReports = (params?: any) => {
  return useQuery({
    queryKey: ['progress-reports', params],
    queryFn: async (): Promise<ProgressReportsData> => {
      console.log('[DEBUG] Fetching progress reports from API');
      const response = await apiClient.getProgressReports(params);
      console.log('[DEBUG] Progress reports response:', response);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch progress reports');
      }
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: 2,
  });
};

export const useProgressStatistics = () => {
  return useQuery({
    queryKey: ['progress-statistics'],
    queryFn: async () => {
      const response = await apiClient.getProgressStatistics();
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch progress statistics');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
};

