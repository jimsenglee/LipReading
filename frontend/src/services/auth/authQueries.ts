import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ============================================================================
// AUTHENTICATION QUERIES
// ============================================================================

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
