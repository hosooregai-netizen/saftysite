'use client';

import Link from 'next/link';
import styles from './MailboxShell.module.css';

export function MailboxOnboardingState({
  actionLabel,
  description,
  helperLabel,
  onAction,
  onSecondaryAction,
  title,
}: {
  actionLabel: string;
  description: string;
  helperLabel: string;
  onAction: () => void;
  onSecondaryAction?: () => void;
  title: string;
}) {
  return (
    <div className={styles.onboardingState}>
      <span className={`${styles.onboardingStatusBadge} ${styles.statusMuted}`}>{helperLabel}</span>
      <strong className={styles.onboardingTitle}>{title}</strong>
      <p className={styles.onboardingDescription}>{description}</p>
      <div className={styles.onboardingActions}>
        <button type="button" className={styles.connectButton} onClick={onAction}>
          {actionLabel}
        </button>
        {onSecondaryAction ? (
          <button type="button" className={styles.connectSecondaryButton} onClick={onSecondaryAction}>
            상태 확인
          </button>
        ) : (
          <Link href="/reports" className={styles.connectSecondaryButton}>
            보고서 목록
          </Link>
        )}
      </div>
    </div>
  );
}

export default MailboxOnboardingState;
