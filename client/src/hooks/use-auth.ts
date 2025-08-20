import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { storageManager } from '@/lib/storage';
import type { User } from '@shared/schema';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const session = storageManager.getUserSession();
    if (session) {
      setAuthState({
        user: session.user,
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Generate new user mutation
  const generateUserMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const response = await apiRequest('POST', '/api/auth/generate-recovery', { displayName });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const session = {
        user: data.user,
        recoveryCode: data.recoveryCode,
        lastLogin: new Date().toISOString()
      };
      
      storageManager.saveUserSession(session);
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ uniqueId, recoveryCode }: { uniqueId?: string; recoveryCode?: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { uniqueId, recoveryCode });
      return response.json();
    },
    onSuccess: (data) => {
      const session = {
        user: data.user,
        lastLogin: new Date().toISOString()
      };
      
      storageManager.saveUserSession(session);
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
    }
  });

  // Update user visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ userId, isPublic }: { userId: string; isPublic: boolean }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}/visibility`, { isPublic });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
      
      // Update localStorage
      const session = storageManager.getUserSession();
      if (session) {
        storageManager.saveUserSession({
          ...session,
          user: updatedUser
        });
      }
    }
  });

  const generateUser = useCallback((displayName: string) => {
    return generateUserMutation.mutateAsync(displayName);
  }, [generateUserMutation]);

  const login = useCallback((credentials: { uniqueId?: string; recoveryCode?: string }) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const logout = useCallback(() => {
    storageManager.clearUserSession();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }, []);

  const updateVisibility = useCallback((isPublic: boolean) => {
    if (authState.user) {
      return updateVisibilityMutation.mutateAsync({
        userId: authState.user.id,
        isPublic
      });
    }
  }, [authState.user, updateVisibilityMutation]);

  return {
    ...authState,
    generateUser,
    login,
    logout,
    updateVisibility,
    isGenerating: generateUserMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isUpdatingVisibility: updateVisibilityMutation.isPending,
    generateError: generateUserMutation.error,
    loginError: loginMutation.error,
    updateError: updateVisibilityMutation.error
  };
}
