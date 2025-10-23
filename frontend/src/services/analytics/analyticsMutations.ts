import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/constants';

// ============================================================================
// ANALYTICS MUTATIONS
// ============================================================================

export const useSubmitRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ seriesId, rating, review }: { 
      seriesId: number; 
      rating: number; 
      review: string 
    }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seriesId, rating, review }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ type, content, rating }: { 
      type: string; 
      content: string; 
      rating?: number 
    }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, content, rating }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
