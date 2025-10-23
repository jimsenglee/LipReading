import { useQuery } from '@tanstack/react-query';
import apiClient, { ApiCategory, ApiTutorial, ApiQuiz } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

// ============================================================================
// CONTENT INTERFACES
// ============================================================================

export interface ContentParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive';
  sort_by?: 'title' | 'category' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ContentResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============================================================================
// CONTENT QUERIES
// ============================================================================

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  });
};

export const useTutorials = (params: ContentParams = {}) => {
  return useQuery({
    queryKey: ['tutorials', params],
    queryFn: async (): Promise<ContentResponse<ApiTutorial>> => {
      console.log('🔍 DEBUG useTutorials: Calling apiClient.getTutorials()');
      const tutorials = await apiClient.getTutorials();
      console.log('🔍 DEBUG useTutorials: Got tutorials from apiClient:', tutorials);
      
      // Transform the array response to match ContentResponse format
      return {
        success: true,
        data: tutorials,
        pagination: {
          current_page: params.page || 1,
          per_page: params.per_page || 10,
          total_count: tutorials.length,
          total_pages: Math.ceil(tutorials.length / (params.per_page || 10)),
          has_next: false,
          has_prev: false
        }
      };
    },
  });
};

export const useQuizzes = (params: ContentParams = {}) => {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: async (): Promise<ContentResponse<ApiQuiz>> => {
      console.log('🔍 DEBUG useQuizzes: Calling apiClient.getQuizzes()');
      const quizzes = await apiClient.getQuizzes();
      console.log('🔍 DEBUG useQuizzes: Got quizzes from apiClient:', quizzes);
      
      // Transform the array response to match ContentResponse format
      return {
        success: true,
        data: quizzes,
        pagination: {
          current_page: params.page || 1,
          per_page: params.per_page || 10,
          total_count: quizzes.length,
          total_pages: Math.ceil(quizzes.length / (params.per_page || 10)),
          has_next: false,
          has_prev: false
        }
      };
    },
  });
};

export const useTutorialById = (id: number) => {
  return useQuery({
    queryKey: ['tutorial', id],
    queryFn: () => apiClient.getTutorialById(id),
    enabled: !!id,
  });
};

export const useQuizById = (id: number) => {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => apiClient.getQuizById(id),
    enabled: !!id,
  });
};
