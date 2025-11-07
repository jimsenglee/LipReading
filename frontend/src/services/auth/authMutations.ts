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
    mutationFn: ({ email, password, remember_me }: { email: string; password: string; remember_me?: boolean }) => 
      apiClient.login(email, password, remember_me),
    onSuccess: (data: any) => {
      // if 2FA is required, don't navigate - let the component handle it
      if (data.requires_2fa) {
        return data; // return the response so component can access temp_token
      }
      
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
      
      return data;
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
      // check if remember me was checked
      const rememberMe = localStorage.getItem('rememberMe');
      if (rememberMe !== 'true') {
        // if remember me was NOT checked, clear all credentials on logout
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
        console.log('[DEBUG] Logout: Cleared all credentials (Remember Me was unchecked)');
      } else {
        // if remember me was checked, KEEP credentials in localStorage
        // they will be restored when user returns to login page
        console.log('[DEBUG] Logout: Keeping credentials in localStorage (Remember Me was checked)');
        console.log('[DEBUG] Logout: Email will be restored on next login page visit');
      }
      logout();
      navigate('/login');
    },
    onError: (error) => {
      // same logic for error case
      const rememberMe = localStorage.getItem('rememberMe');
      if (rememberMe !== 'true') {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
        console.log('[DEBUG] Logout Error: Cleared credentials (Remember Me was unchecked)');
      } else {
        console.log('[DEBUG] Logout Error: Keeping credentials (Remember Me was checked)');
      }
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

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => 
      apiClient.requestPasswordReset(email),
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => 
      apiClient.resetPassword(token, password),
    onSuccess: () => {
      // redirect to login after successful password reset
      navigate('/login');
    },
  });
};

export const useEnable2FA = () => {
  return useMutation({
    mutationFn: ({ secret, verificationCode }: { secret: string; verificationCode: string }) => 
      apiClient.enable2FA(secret, verificationCode),
  });
};

export const useDisable2FA = () => {
  return useMutation({
    mutationFn: ({ password }: { password: string }) => 
      apiClient.disable2FA(password),
  });
};

export const useVerify2FA = () => {
  return useMutation({
    mutationFn: ({ tempToken, code }: { tempToken: string; code: string }) => 
      apiClient.verify2FA(tempToken, code),
  });
};

export const useSend2FACode = () => {
  return useMutation({
    mutationFn: () => apiClient.send2FACode(),
  });
};
