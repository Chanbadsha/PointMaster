'use client';

import { useAuth } from '../providers/auth-provider.js';

export function useSession() {
  const { user, loading, fetchSession } = useAuth();

  return {
    user,
    loading,
    isAuthenticated: !!user,
    refreshSession: fetchSession,
  };
}
