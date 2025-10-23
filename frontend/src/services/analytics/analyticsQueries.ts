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
