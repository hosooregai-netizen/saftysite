'use client';

import { WorkerMenuButton } from '@/components/worker/WorkerMenu';
import styles from './WorkerAppHeader.module.css';

interface WorkerAppHeaderProps {
  currentUserName?: string | null;
  onLogout: () => void;
  onOpenMenu: () => void;
}

export default function WorkerAppHeader({
  currentUserName,
  onLogout,
  onOpenMenu,
}: WorkerAppHeaderProps) {
  return (
    <header className={styles.appHeader}>
      <div className={styles.appHeaderBar}>
        <div className={styles.headerLeft}>
          <div className={styles.menuButtonWrap}>
            <WorkerMenuButton onClick={onOpenMenu} />
          </div>
          <span className={styles.brand}>한국 종합 안전</span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.accountBlock}>
            <span className={styles.accountLabel}>로그인 계정</span>
            <strong className={styles.accountName}>{currentUserName || '작업자'}</strong>
          </div>
          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
