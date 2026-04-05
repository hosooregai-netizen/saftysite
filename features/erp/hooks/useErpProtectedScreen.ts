'use client';

import { useMemo } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { readSafetyAuthToken } from '@/lib/safetyApi';

export function useErpProtectedScreen() {
  const { authError, currentUser, hasAuthToken, isReady, login, logout } = useInspectionSessions();
  const token = readSafetyAuthToken();

  return useMemo(
    () => ({
      authError,
      currentUser,
      hasAuthToken,
      isAuthenticated: Boolean(token && currentUser),
      isReady,
      login,
      logout,
      shouldShowLogin: isReady && !hasAuthToken && !currentUser,
      token,
    }),
    [authError, currentUser, hasAuthToken, isReady, login, logout, token]
  );
}
