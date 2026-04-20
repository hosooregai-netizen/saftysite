'use client';

import LoginPanel from '@/components/auth/LoginPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import MailboxPanel from '@/features/mailbox/components/MailboxPanel';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildMobileRootTabs } from '../site-list/mobileSiteListTabs';
import styles from './MobileShell.module.css';

export function MobileMailboxScreen() {
  const {
    authError,
    currentUser,
    isAuthenticated,
    isReady,
    login,
    logout,
  } = useInspectionSessions();

  if (!isReady) {
    return (
      <MobileShell
        currentUserName={currentUser?.name}
        onLogout={logout}
        title="메일함"
        webHref="/mailbox"
        tabBar={<MobileTabBar tabs={buildMobileRootTabs('mailbox')} />}
      >
        <section className={styles.stateCard}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>메일함을 준비하는 중입니다.</h2>
          </div>
        </section>
      </MobileShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 메일함 로그인"
        description="연결된 개인 메일 계정은 현재 로그인한 사용자에게 귀속되며, 로그인 후 받은편지함과 보낸편지함을 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <MobileShell
      currentUserName={currentUser?.name}
      onLogout={logout}
      title="메일함"
      webHref="/mailbox"
      tabBar={<MobileTabBar tabs={buildMobileRootTabs('mailbox')} />}
    >
      <MailboxPanel mode="worker" />
    </MobileShell>
  );
}

export default MobileMailboxScreen;
