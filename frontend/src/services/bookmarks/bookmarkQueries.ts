/**
 * bookmark queries for React Query
 */
import { useQuery } from '@tanstack/react-query';
import  apiClient  from '@/lib/api';

export interface Bookmark {
  id: number;
  publicId: string;
  categoryId: number;
  categoryName?: string;
  title: string;
  description?: string;
  videoPath?: string;
  status: string;
  difficulty?: string;
  author?: string;
  thumbnailPath?: string;
  views?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  videoDuration?: number;
  tags?: string;
  // phase 4: add progress tracking fields
  progressPercentage?: number;
  lastWatchedPosition?: number;
  totalWatchTime?: number;
  isCompleted?: boolean;
  completedAt?: string;
  enrolledAt?: string;
  lastAccessedAt?: string;
  // phase 4: add review system fields
  userRating?: number;
  userReview?: string;
  reviewedAt?: string;
}

export interface BookmarkResponse {
  success: boolean;
  data: Bookmark[];
}

export interface BookmarkCheckResponse {
  success: boolean;
  data: {
    isBookmarked: boolean;
  };
}

// phase 4: bookmark queries for React Query
export const useBookmarks = () => {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async (): Promise<BookmarkResponse> => {
      const response = await apiClient.get<{ success: boolean, data: Bookmark[] }>('/bookmarks');
      return {
        success: response.data.success,
        data: response.data.data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBookmarkCheck = (tutorialId: number) => {
  return useQuery({
    queryKey: ['bookmark-check', tutorialId],
    queryFn: async (): Promise<BookmarkCheckResponse> => {
      const response = await apiClient.get<{ success: boolean, data: { isBookmarked: boolean } }>(`/bookmarks/${tutorialId}/check`);
      return {
        success: response.data.success,
        data: response.data.data
      };
    },
    enabled: !!tutorialId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
