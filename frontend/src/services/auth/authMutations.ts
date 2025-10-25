import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// AUTHENTICATION MUTATIONS
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

export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => {
      return apiClient.logout();
    },
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (error) => {
      logout();
      navigate('/login');
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, email, profileImage }: { 
      name?: string; 
      email?: string; 
      profileImage?: File 
    }) => apiClient.updateProfile(name, email, profileImage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { 
      currentPassword: string; 
      newPassword: string 
    }) => apiClient.changePassword(currentPassword, newPassword),
  });
};
