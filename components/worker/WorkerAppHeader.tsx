'use client';

import type { ReactNode } from 'react';
import { WorkerMenuButton } from '@/components/worker/WorkerMenu';
import styles from './WorkerAppHeader.module.css';

interface WorkerAppHeaderProps {
  currentUserName?: string | null;
  onLogout: () => void;
  onOpenMenu: () => void;
  brand?: string;
  accountLabel?: string;
  logoutLabel?: string;
  actions?: ReactNode;
  /** false: 본문 열(예: HomeScreen contentColumn) 안 — 뷰포트 full-bleed 없음 */
  fullBleed?: boolean;
}

export default function WorkerAppHeader({
  currentUserName,
  onLogout,
  onOpenMenu,
  brand = '한국 종합 안전',
  accountLabel = '로그인 계정',
  logoutLabel = '로그아웃',
  actions,
  fullBleed = true,
}: WorkerAppHeaderProps) {
  return (
    <header
      className={[
        styles.appHeader,
        fullBleed ? styles.appHeaderBleed : styles.appHeaderColumn,
      ].join(' ')}
    >
      <div className={styles.appHeaderBar}>
        <div className={styles.headerLeft}>
          <div className={styles.menuButtonWrap}>
            <WorkerMenuButton onClick={onOpenMenu} />
          </div>
          <span className={styles.brand}>{brand}</span>
        </div>

        <div className={styles.headerRight}>
          {actions ? <div className={styles.headerActions}>{actions}</div> : null}
          <div className={styles.accountBlock}>
            <span className={styles.accountLabel}>{accountLabel}</span>
            <strong className={styles.accountName}>{currentUserName || '작업자'}</strong>
          </div>
          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            {logoutLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
