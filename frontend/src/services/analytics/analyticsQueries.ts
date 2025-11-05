import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/constants';

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users: number;
  user_growth: number;
}

export interface ContentAnalytics {
  total_tutorials: number;
  total_quizzes: number;
  total_categories: number;
  content_engagement: number;
}

export interface SystemAnalytics {
  server_uptime: number;
  response_time: number;
  error_rate: number;
  storage_usage: number;
}

export interface ContentInteractionAnalytics {
  totalTutorials: number;
  totalViews: number;
  totalBookmarks: number;
  avgCompletionRate: number;
}

export interface TutorialPopularity {
  id: number;
  publicId: string;
  title: string;
  category: string;
  views: number;
  bookmarks: number;
}

export interface TutorialInteractionDetails {
  tutorialId: string;
  title: string;
  category: string;
  views: number;
  bookmarks: number;
  completionRate: number;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  newItems: number;
  inProgress: number;
  resolved: number;
}

export interface FeedbackDistribution {
  name?: string;
  value?: number;
  color?: string;
  type?: string;
  count?: number;
}

export interface FeedbackDistributions {
  byStatus: FeedbackDistribution[];
  byType: FeedbackDistribution[];
}

export interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  email: string;
  type: string;
  category: string;
  title: string;
  description: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  attachments?: string[];
  adminNotes?: string;
}

export interface FeedbackListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  feedback_type?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface TutorialInteractionParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface QuizAnalytics {
  totalQuizzes: number;
  totalViews: number;
  totalAttempts: number;
  avgScore: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
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
// ANALYTICS QUERIES
// ============================================================================

export const useUserAnalytics = (params: AnalyticsParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'users', params],
    queryFn: async (): Promise<UserAnalytics> => {
      const searchParams = new URLSearchParams();
      
      if (params.start_date) searchParams.append('start_date', params.start_date);
      if (params.end_date) searchParams.append('end_date', params.end_date);
      if (params.period) searchParams.append('period', params.period);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `/api/analytics/users?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });
};

export const useContentAnalytics = (params: AnalyticsParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'content', params],
    queryFn: async (): Promise<ContentAnalytics> => {
      const searchParams = new URLSearchParams();
      
      if (params.start_date) searchParams.append('start_date', params.start_date);
      if (params.end_date) searchParams.append('end_date', params.end_date);
      if (params.period) searchParams.append('period', params.period);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `/api/analytics/content?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });
};

export const useSystemAnalytics = (params: AnalyticsParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'system', params],
    queryFn: async (): Promise<SystemAnalytics> => {
      const searchParams = new URLSearchParams();
      
      if (params.start_date) searchParams.append('start_date', params.start_date);
      if (params.end_date) searchParams.append('end_date', params.end_date);
      if (params.period) searchParams.append('period', params.period);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `/api/analytics/system?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });
};

// content interaction analytics queries
export const useContentInteractionAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'content-interaction'],
    queryFn: async (): Promise<ContentInteractionAnalytics> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTutorialPopularity = () => {
  return useQuery({
    queryKey: ['analytics', 'tutorial-popularity'],
    queryFn: async (): Promise<TutorialPopularity[]> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/content/popularity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTutorialInteractions = (params: TutorialInteractionParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'tutorial-interactions', params],
    queryFn: async (): Promise<ApiResponse<TutorialInteractionDetails[]>> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/content/interactions?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
        pagination: result.pagination
      } as ApiResponse<TutorialInteractionDetails[]>;
    },
  });
};

// feedback analytics queries
export const useFeedbackAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'feedback'],
    queryFn: async (): Promise<FeedbackAnalytics> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFeedbackDistributions = () => {
  return useQuery({
    queryKey: ['analytics', 'feedback-distributions'],
    queryFn: async (): Promise<FeedbackDistributions> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/feedback/distributions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFeedbackList = (params: FeedbackListParams = {}) => {
  return useQuery({
    queryKey: ['analytics', 'feedback-list', params],
    queryFn: async (): Promise<ApiResponse<FeedbackItem[]>> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.feedback_type) queryParams.append('feedback_type', params.feedback_type);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/feedback/list?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
        pagination: result.pagination
      } as ApiResponse<FeedbackItem[]>;
    },
  });
};

// quiz analytics queries
export const useQuizAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'quiz'],
    queryFn: async (): Promise<QuizAnalytics> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/quiz`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
