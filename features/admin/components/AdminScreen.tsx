'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import { AdminDashboardShell } from '@/features/admin/components/AdminDashboardShell';
import { AdminDashboardScreen } from '@/features/admin/components/AdminDashboardScreen';
import { useAdminScreenState } from '@/features/admin/hooks/useAdminScreenState';
import shellStyles from '@/features/admin/components/AdminDashboardShell.module.css';

function AdminLoadingScreen() {
  return (
    <AdminDashboardShell
      activeSection="overview"
      activeSectionLabel="관리 대시보드"
      banners={null}
      currentUserName="불러오는 중"
      onLogout={() => undefined}
      onSelectSection={() => undefined}
    >
      <section className={shellStyles.sectionCard}>
        <div className={shellStyles.sectionBody}>
          <h2 className={shellStyles.sectionTitle}>관리자 화면을 준비하고 있습니다.</h2>
          <p>로그인 상태와 운영 데이터를 확인하는 중입니다.</p>
        </div>
      </section>
    </AdminDashboardShell>
  );
}

export function AdminScreen() {
  const {
    authError,
    currentUser,
    hasAuthToken,
    isAdminView,
    isHydrating,
    isReady,
    login,
    logout,
    shouldShowLogin,
  } =
    useAdminScreenState();

  if (!isReady || isHydrating || (hasAuthToken && !currentUser)) {
    return <AdminLoadingScreen />;
  }

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
