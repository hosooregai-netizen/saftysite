'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { isAdminUserRole } from '@/lib/admin/adminRoles';

interface AdminScreenState {
  authError: string | null;
  currentUser: ReturnType<typeof useInspectionSessions>['currentUser'];
  hasAuthToken: boolean;
  isAdminView: boolean;
  isHydrating: boolean;
  isReady: boolean;
  login: ReturnType<typeof useInspectionSessions>['login'];
  logout: ReturnType<typeof useInspectionSessions>['logout'];
  shouldShowLogin: boolean;
}

export function useAdminScreenState(): AdminScreenState {
  const {
    hasAuthToken,
    isHydrating,
    isReady,
    currentUser,
    authError,
    login,
    logout,
  } = useInspectionSessions();
  const router = useRouter();
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const shouldShowLogin = isReady && !hasAuthToken && !currentUser;

  useEffect(() => {
    if (currentUser && !isAdminView) {
      router.replace('/');
    }
  }, [currentUser, isAdminView, router]);

  return {
    authError,
    currentUser,
    hasAuthToken,
    isAdminView,
    isHydrating,
    isReady,
    login,
    logout,
    shouldShowLogin,
  };
}
