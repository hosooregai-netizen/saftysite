'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import MailboxPanel from '@/features/mailbox/components/MailboxPanel';
import homeStyles from '@/features/home/components/HomeScreen.module.css';

export function MailboxScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authError,
    currentUser,
    isAuthenticated,
    isReady,
    login,
    logout,
  } = useInspectionSessions();
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));

  useEffect(() => {
    if (isAdminView) {
      router.replace(
        getAdminSectionHref('mailbox', {
          box: searchParams.get('box') || '',
          oauthError: searchParams.get('oauthError') || '',
          oauthNotice: searchParams.get('oauthNotice') || '',
          threadId: searchParams.get('threadId') || '',
        }),
      );
    }
  }, [isAdminView, router, searchParams]);

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={homeStyles.emptyState}>
              <p className={homeStyles.emptyTitle}>메일함을 준비하는 중입니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="메일함 로그인"
        description="로그인하면 현재 사용자에게 연결된 개인 메일 계정의 수신/발신 내역과 알림을 확인할 수 있습니다."
      />
    );
  }

  if (isAdminView) {
    return null;
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${homeStyles.shell}`}>
          <WorkerAppHeader
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              <WorkerMenuPanel />
            </WorkerMenuSidebar>

            <div className={homeStyles.contentColumn}>
              <header className={homeStyles.hero}>
                <div className={homeStyles.heroBody}>
                  <div className={homeStyles.heroMain}>
                    <h1 className={homeStyles.heroTitle}>메일함</h1>
                  </div>
                </div>
              </header>

              <div className={homeStyles.pageGrid}>
                <MailboxPanel mode="worker" />
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      <WorkerMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}

export default MailboxScreen;
