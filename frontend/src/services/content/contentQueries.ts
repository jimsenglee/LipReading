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
  sort_by?: 'id' | 'title' | 'category' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ContentResponse<T> {
  success: boolean;
  data?: T[];
  tutorials?: T[];
  quizzes?: T[];
  categories?: T[];
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

export const useCategories = (params: ContentParams = {}) => {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: async (): Promise<ContentResponse<ApiCategory>> => {
      // Use server-side pagination and filtering
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await fetch(`${API_BASE_URL}/api/categories?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const result = await response.json();
      
      // Return the result directly as it now has the correct format
      return result;
    },
  });
};

export const useTutorials = (params: ContentParams = {}) => {
  return useQuery({
    queryKey: ['tutorials', params],
    queryFn: async (): Promise<ContentResponse<ApiTutorial>> => {
      // Use server-side pagination and filtering
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== 'all') queryParams.append('category_id', params.category);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await fetch(`${API_BASE_URL}/api/tutorials?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tutorials: ${response.status}`);
      }
      
      return await response.json();
    },
  });
};

export const useQuizzes = (params: ContentParams = {}) => {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: async (): Promise<ContentResponse<ApiQuiz>> => {
      // Use server-side pagination and filtering
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== 'all') queryParams.append('category_id', params.category);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await fetch(`${API_BASE_URL}/api/quizzes?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const result = await response.json();
      return result;
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

export const useTutorialSeriesById = (seriesId: number) => {
  return useQuery({
    queryKey: ['tutorial-series', seriesId],
    queryFn: async (): Promise<ApiTutorial> => {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/series/${seriesId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tutorial series: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    enabled: !!seriesId,
  });
};

// user-side quiz queries
export const useQuizForTaking = (quizId: number) => {
  return useQuery({
    queryKey: ['quiz-taking', quizId],
    queryFn: () => apiClient.getQuizForTaking(quizId),
    enabled: !!quizId,
  });
};

export const useQuizSeriesById = (quizId: number) => {
  return useQuery({
    queryKey: ['quiz-series', quizId],
    queryFn: () => apiClient.getQuizById(quizId),
    enabled: !!quizId,
  });
};
