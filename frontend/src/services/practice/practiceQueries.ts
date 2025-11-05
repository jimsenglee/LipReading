import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/constants';

// ============================================================================
// PRACTICE INTERFACES
// ============================================================================

export interface PracticeWordParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  status?: 'active' | 'inactive' | 'all';
  sort_by?: 'id' | 'word' | 'difficulty' | 'sort_order' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface PracticeWord {
  id: number;
  publicId: string;
  word: string;
  category: string;
  categoryId: number;
  phonetics: string | null;
  description: string | null;
  videoPath: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PracticeWordsResponse {
  success: boolean;
  data: PracticeWord[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============================================================================
// PRACTICE QUERIES
// ============================================================================

export const usePracticeWords = (params: PracticeWordParams = {}) => {
  return useQuery({
    queryKey: ['practice-words', params],
    queryFn: async (): Promise<PracticeWordsResponse> => {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category.toString());
      if (params.difficulty && params.difficulty !== 'all') queryParams.append('difficulty', params.difficulty);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await fetch(`${API_BASE_URL}/api/practice-words?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch practice words: ${response.status}`);
      }
      
      return await response.json();
    },
  });
};

export const usePracticeWordById = (wordId: number) => {
  return useQuery({
    queryKey: ['practice-word', wordId],
    queryFn: async (): Promise<{ success: boolean; data?: PracticeWord }> => {
      const response = await fetch(`${API_BASE_URL}/api/practice-words/${wordId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch practice word: ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: !!wordId,
  });
};

