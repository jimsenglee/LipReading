/**
 * admin review queries and mutations for React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

export interface AdminReview {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  rating: number;
  reviewText?: string;
  reviewedAt?: string;
  adminResponse?: string;
  adminRespondedAt?: string;
  reviewedByAdminId?: number;
}

export interface AdminReviewResponse {
  success: boolean;
  reviews: AdminReview[];
  averageRating: number;
  totalReviews: number;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

// fetch admin reviews for a tutorial or quiz
export const useAdminContentReviews = (
  contentId: number,
  contentType: 'tutorial' | 'quiz',
  params?: any
) => {
  return useQuery({
    queryKey: ['admin-reviews', contentType, contentId, params],
    queryFn: async (): Promise<AdminReviewResponse> => {
      // build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            queryParams.append(key, params[key].toString());
          }
        });
      }
      const queryString = queryParams.toString();
      const endpoint = contentType === 'tutorial' 
        ? `/admin/reviews/tutorials/${contentId}`
        : `/admin/reviews/quizzes/${contentId}`;
      const url = `${API_BASE_URL}/api${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      // use fetch directly like other queries for consistency
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }
      
      // backend returns: {success: true, data: {reviews, averageRating, totalReviews}, pagination: {...}}
      const result = await response.json();
      
      // parse the backend response structure
      const backendData = result.data || {};
      const backendPagination = result.pagination;
      
      return {
        success: result.success || true,
        reviews: backendData.reviews || [],
        averageRating: backendData.averageRating || 0,
        totalReviews: backendData.totalReviews || 0,
        pagination: backendPagination
      };
    },
    enabled: !!contentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// submit admin response to a review
export const useSubmitAdminReviewResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId, adminResponse }: { reviewId: number; adminResponse: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}/response`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_response: adminResponse }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // invalidate admin review queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      // also invalidate public review queries
      queryClient.invalidateQueries({ queryKey: ['tutorial-reviews'] });
    },
  });
};
