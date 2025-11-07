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

export const useVerifyResetToken = (token: string | null) => {
  return useQuery({
    queryKey: ['verifyResetToken', token],
    queryFn: () => apiClient.verifyResetToken(token!),
    enabled: !!token,
    retry: false,
  });
};

export const useGenerate2FASecret = () => {
  return useQuery({
    queryKey: ['generate2FASecret'],
    queryFn: () => apiClient.generate2FASecret(),
    enabled: false, // manual trigger only
  });
};
