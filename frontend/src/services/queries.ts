import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient, { ApiCategory, ApiTutorial, ApiQuiz } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/constants';

// ============================================================================
// USER MANAGEMENT INTERFACES
// ============================================================================

export interface UserData {
  id: number;
  public_id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string | null;
  last_active: string | null;
  profile_image_path: string | null;
  is_active: boolean;
  sessions_count: number;
}

export interface UsersResponse {
  success: boolean;
  data: UserData[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: 'all' | 'admin' | 'user';
  sort_by?: 'name' | 'email' | 'created_at' | 'last_active';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// AUTHENTICATION HOOKS (React Query Pattern)
// ============================================================================

export const useLogin = () => {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      apiClient.login(email, password),
    onSuccess: (data) => {
      const user = {
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as 'user' | 'admin',
        profilePicture: data.user.profile_picture,
        twoFactorEnabled: false,
        preferences: { transcriptionFormat: 'plain' },
        totalSessions: 0,
        practiceTime: "0h",
        avgAccuracy: "0%"
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['user'], user);
      
      // Navigate based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    },
  });
};

export const useRegister = () => {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password, name, profileImage }: { 
      email: string; 
      password: string; 
      name: string; 
      profileImage?: File 
    }) => apiClient.register(email, password, name, profileImage),
    onSuccess: (data) => {
      const user = {
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as 'user' | 'admin',
        profilePicture: data.user.profile_picture,
        twoFactorEnabled: false,
        preferences: { transcriptionFormat: 'plain' },
        totalSessions: 0,
        practiceTime: "0h",
        avgAccuracy: "0%"
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['user'], user);
      
      // Navigate based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: !!localStorage.getItem('token'),
  });
};

export const useLogout = () => {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.resolve();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
};

// ============================================================================
// EDUCATION DATA HOOKS (React Query Pattern)
// ============================================================================

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  });
};

export const useTutorials = (categoryId?: number) => {
  return useQuery<ApiTutorial[]>({
    queryKey: ['tutorials', categoryId ?? null],
    queryFn: () => apiClient.getTutorials(categoryId),
  });
};

export const useQuizzes = (categoryId?: number) => {
  return useQuery<ApiQuiz[]>({
    queryKey: ['quizzes', categoryId ?? null],
    queryFn: () => apiClient.getQuizzes(categoryId),
  });
};

export const useTutorialById = (id: number) => {
  return useQuery({
    queryKey: ['tutorial', id],
    queryFn: () => apiClient.getTutorialById(id),
  });
};

export const useQuizById = (id: number) => {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => apiClient.getQuizById(id),
  });
};

// ============================================================================
// USER MANAGEMENT HOOKS (React Query Pattern)
// ============================================================================

export const useUsers = (params: UsersParams = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async (): Promise<UsersResponse> => {
      try {
        console.log('🔍 DEBUG: useUsers queryFn called with params:', params);
        
        const searchParams = new URLSearchParams();
        
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.per_page) searchParams.append('per_page', params.per_page.toString());
        if (params.search) searchParams.append('search', params.search);
        if (params.role && params.role !== 'all') searchParams.append('role', params.role);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('🔍 DEBUG: no authentication token found');
          throw new Error('No authentication token found');
        }
        
        const url = `/api/users?${searchParams.toString()}`;
        console.log('🔍 DEBUG: making request to:', url);
        console.log('🔍 DEBUG: current window location:', window.location.href);
        console.log('🔍 DEBUG: API_BASE_URL from constants:', API_BASE_URL);
        console.log('🔍 DEBUG: token present:', !!token);
        console.log('🔍 DEBUG: token value (first 20 chars):', token?.substring(0, 20));
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 DEBUG: response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 DEBUG: API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            url: response.url
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('🔍 DEBUG: Non-JSON Response:', {
            contentType: contentType,
            text: text
          });
          throw new Error('Server returned non-JSON response');
        }
        
        const data = await response.json();
        console.log('🔍 DEBUG: Users API Response:', data);
        
        if (!data.success) {
          console.error('🔍 DEBUG: API returned success=false:', data);
          throw new Error(data.error || 'Failed to fetch users');
        }
        
        console.log('🔍 DEBUG: returning users data successfully');
        return data;
      } catch (error) {
        console.error('🔍 DEBUG: useUsers Error:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<{ success: boolean; data: UserData }> => {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
    },
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<UserData> }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ============================================================================
// PROGRESS & FEEDBACK HOOKS (React Query Pattern)
// ============================================================================

export const useSubmitRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ seriesId, rating, review }: { 
      seriesId: number; 
      rating: number; 
      review: string 
    }) => apiClient.submitSeriesRating(seriesId, rating, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ videoId, isHelpful, feedback }: { 
      videoId: number; 
      isHelpful: boolean; 
      feedback?: string 
    }) => apiClient.submitVideoFeedback(videoId, isHelpful, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
};


