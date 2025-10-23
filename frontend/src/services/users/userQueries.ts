import { useQuery } from '@tanstack/react-query';
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
// USER QUERIES
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
        
        const url = `${API_BASE_URL}/api/users?${searchParams.toString()}`;
        console.log('🔍 DEBUG: making request to:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 DEBUG: response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 DEBUG: response not ok:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔍 DEBUG: response data:', data);
        
        return data;
      } catch (error) {
        console.error('🔍 DEBUG: useUsers error:', error);
        throw error;
      }
    },
    enabled: true,
  });
};

export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
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
    enabled: !!userId,
  });
};
