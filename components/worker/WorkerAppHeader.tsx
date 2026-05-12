'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import InstituteWordmark from '@/components/branding/InstituteWordmark';
import { WorkerMenuButton } from '@/components/worker/WorkerMenu';
import { SERVICE_NAME } from '@/lib/branding';
import styles from './WorkerAppHeader.module.css';

interface WorkerAppHeaderProps {
  currentUserName?: string | null;
  onLogout: () => void;
  onOpenMenu: () => void;
  brand?: string;
  brandNode?: ReactNode;
  brandHref?: string;
  accountLabel?: string;
  logoutLabel?: string;
  actions?: ReactNode;
}

export default function WorkerAppHeader({
  currentUserName,
  onLogout,
  onOpenMenu,
  brand = SERVICE_NAME,
  brandNode,
  brandHref = '/',
  accountLabel = '로그인 계정',
  logoutLabel = '로그아웃',
  actions,
}: WorkerAppHeaderProps) {
  return (
    <header className={styles.appHeader}>
      <div className={styles.appHeaderBar}>
        <div className={styles.headerLeft}>
          <div className={styles.menuButtonWrap}>
            <WorkerMenuButton onClick={onOpenMenu} />
          </div>
          <Link href={brandHref} className={styles.brandLink} aria-label={`${brand} 홈으로 이동`}>
            <span className={styles.brandVisual}>
              {brandNode ?? <InstituteWordmark compact tone="light" />}
            </span>
          </Link>
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
