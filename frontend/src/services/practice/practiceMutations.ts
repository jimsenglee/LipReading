import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/constants';
import { PracticeWord } from './practiceQueries';

// ============================================================================
// PRACTICE MUTATIONS
// ============================================================================

export interface CreatePracticeWordData {
  word: string;
  category_id: number;
  phonetics?: string;
  description?: string;
  video_path: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'active' | 'inactive';
  sort_order?: number;
}

export interface UpdatePracticeWordData {
  word?: string;
  category_id?: number;
  phonetics?: string;
  description?: string;
  video_path?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'active' | 'inactive';
  sort_order?: number;
}

export const useCreatePracticeWord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (wordData: CreatePracticeWordData) => {
      const response = await fetch(`${API_BASE_URL}/api/practice-words`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wordData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create practice word');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-words'] });
    },
  });
};

export const useUpdatePracticeWord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ wordId, wordData }: { wordId: number; wordData: UpdatePracticeWordData }) => {
      const response = await fetch(`${API_BASE_URL}/api/practice-words/${wordId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wordData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update practice word');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-words'] });
    },
  });
};

export const useDeletePracticeWord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (wordId: number) => {
      const response = await fetch(`${API_BASE_URL}/api/practice-words/${wordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete practice word');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-words'] });
    },
  });
};

