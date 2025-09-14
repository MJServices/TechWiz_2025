import { useMutation, useQuery, useQueryClient } from 'react-query';
import { authAPI, tokenManager } from '../services/api';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Query to get current user
  const {
    data: user,
    isLoading,
    error,
    isError
  } = useQuery(
    'currentUser',
    async () => {
      if (!tokenManager.isAuthenticated()) {
        return null;
      }
      
      try {
        // Verify token first
        await authAPI.verifyToken();
        // Get user profile
        const response = await authAPI.getProfile();
        return response.data.data;
      } catch (error) {
        tokenManager.clearTokens();
        throw error;
      }
    },
    {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );

  const isAuthenticated = !!user && tokenManager.isAuthenticated();

  // Login mutation
  const loginMutation = useMutation(
    ({ email, password }) => authAPI.login({ email, password }),
    {
      onSuccess: (response) => {
        const { user: userData, tokens } = response.data.data;
        tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
        queryClient.setQueryData('currentUser', userData);
        toast.success('Login successful!');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Login failed';
        toast.error(message);
      }
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    (userData) => authAPI.register(userData),
    {
      onSuccess: (response) => {
        toast.success(response.data.message);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Registration failed';
        toast.error(message);
      }
    }
  );

  // Logout mutation
  const logoutMutation = useMutation(
    () => authAPI.logout(),
    {
      onSettled: () => {
        tokenManager.clearTokens();
        queryClient.setQueryData('currentUser', null);
        queryClient.clear();
        toast.success('Logged out successfully');
      }
    }
  );

  // Email verification mutation
  const verifyEmailMutation = useMutation(
    (token) => authAPI.verifyEmail(token),
    {
      onSuccess: (response) => {
        toast.success(response.data.message);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Email verification failed';
        toast.error(message);
      }
    }
  );

  // Resend verification mutation
  const resendVerificationMutation = useMutation(
    (email) => authAPI.resendVerification(email),
    {
      onSuccess: (response) => {
        toast.success(response.data.message);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to resend verification';
        toast.error(message);
      }
    }
  );

  // Password reset request mutation
  const requestPasswordResetMutation = useMutation(
    (email) => authAPI.requestPasswordReset(email),
    {
      onSuccess: (response) => {
        toast.success(response.data.message);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Password reset request failed';
        toast.error(message);
      }
    }
  );

  // Password reset mutation
  const resetPasswordMutation = useMutation(
    ({ token, password }) => authAPI.resetPassword(token, password),
    {
      onSuccess: (response) => {
        toast.success(response.data.message);
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Password reset failed';
        toast.error(message);
      }
    }
  );

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isError,
    error,

    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,

    // Loading states
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isVerifyingEmail: verifyEmailMutation.isLoading,
    isResendingVerification: resendVerificationMutation.isLoading,
    isRequestingPasswordReset: requestPasswordResetMutation.isLoading,
    isResettingPassword: resetPasswordMutation.isLoading,
  };
};