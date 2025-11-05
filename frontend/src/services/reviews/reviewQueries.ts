/**
 * review queries for React Query
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

export interface Review {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  tutorialId: number;
  tutorialTitle: string;
  rating: number;
  reviewText?: string;
  reviewedAt?: string;
  isVerified?: boolean;
}

export interface UserReview {
  hasReview: boolean;
  rating?: number;
  reviewText?: string;
  reviewedAt?: string | null;
}

export interface ReviewResponse {
  success: boolean;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  pagination?: any;
}

export interface UserReviewResponse {
  success: boolean;
  data: UserReview;
}

// review queries for React Query
export const useTutorialReviews = (tutorialId: number, params?: any) => {
  return useQuery({
    queryKey: ['tutorial-reviews', tutorialId, params],
    queryFn: async (): Promise<ReviewResponse> => {
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
      const url = `/tutorials/${tutorialId}/reviews${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any>(url);
      
      // apiClient returns {data: backendResponse}
      // backend returns: {success: True, data: {reviews, averageRating, totalReviews}, pagination: {...}}
      // so response.data is the backendResponse
      const backendData = response.data.data;
      
      return {
        success: true,
        reviews: backendData?.reviews || [],
        averageRating: backendData?.averageRating || 0,
        totalReviews: backendData?.totalReviews || 0,
        pagination: response.data.pagination
      };
    },
    enabled: !!tutorialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserReview = (tutorialId: number) => {
  return useQuery({
    queryKey: ['user-review', tutorialId],
    queryFn: async (): Promise<UserReviewResponse> => {
      const response = await apiClient.get<UserReview>(`/reviews/tutorials/${tutorialId}/user`);
      return {
        success: true,
        data: response.data
      };
    },
    enabled: !!tutorialId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
