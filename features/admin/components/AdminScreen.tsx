'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import { AdminDashboardScreen } from '@/features/admin/components/AdminDashboardScreen';
import { useAdminScreenState } from '@/features/admin/hooks/useAdminScreenState';

export function AdminScreen() {
  const { authError, currentUser, isAdminView, login, logout, shouldShowLogin } =
    useAdminScreenState();

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="현장 안전 점검 시스템"
        description="API 서버로 로그인하면 사업장, 현장 메인, 보고서 업무를 이어서 확인할 수 있습니다."
      />
    );
  }

  if (!currentUser || !isAdminView) {
    return null;
  }

  return <AdminDashboardScreen currentUser={currentUser} onLogout={logout} />;
}

