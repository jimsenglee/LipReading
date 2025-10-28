/**
 * review queries for React Query
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

export interface Review {
  userId: number;
  userName: string;
  userEmail: string;
  rating: number;
  reviewText?: string;
  reviewedAt?: string;
}

export interface UserReview {
  rating?: number;
  reviewText?: string;
  reviewedAt?: string;
}

export interface ReviewResponse {
  success: boolean;
  data: Review[];
  averageRating: number;
  totalReviews: number;
}

export interface UserReviewResponse {
  success: boolean;
  data: UserReview;
}

// phase 4: review queries for React Query
export const useTutorialReviews = (tutorialId: number) => {
  return useQuery({
    queryKey: ['tutorial-reviews', tutorialId],
    queryFn: async (): Promise<ReviewResponse> => {
      const response = await apiClient.get<Review[]>(`/tutorials/${tutorialId}/reviews`);
      const reviews = response.data;
      
      // calculate average rating and total reviews
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      
      return {
        success: true,
        data: reviews,
        averageRating: Math.round(averageRating * 10) / 10, // round to 1 decimal place
        totalReviews
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
      try {
        const response = await apiClient.get<UserReview>(`/bookmarks/${tutorialId}/review`);
        return {
          success: true,
          data: response.data
        };
      } catch (error: any) {
        // if user hasn't bookmarked the tutorial, return empty review data
        if (error.response?.status === 404) {
          return {
            success: true,
            data: {
              rating: undefined,
              reviewText: undefined,
              reviewedAt: undefined
            }
          };
        }
        throw error;
      }
    },
    enabled: !!tutorialId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // don't retry on 404 errors (user hasn't bookmarked)
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });
};
