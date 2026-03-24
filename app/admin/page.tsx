'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import ControllerDashboard from '@/components/controller/ControllerDashboard';
import { isAdminUserRole } from '@/components/controller/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';

export default function AdminPage() {
  const {
    hasAuthToken,
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

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="현장 안전 점검 시스템"
        description="API 서버로 로그인하면 배정된 현장과 보고서 목록을 바로 이어서 불러옵니다."
      />
    );
  }

  if (!currentUser || !isAdminView) {
    return null;
  }

  return <ControllerDashboard currentUser={currentUser} onLogout={logout} />;
}
