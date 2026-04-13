'use client';

import Link from 'next/link';
import styles from '@/features/mobile/components/MobileShell.module.css';

interface MobileQuarterlyReportStatePanelProps {
  actionHref?: string;
  actionLabel?: string;
  detail?: string | null;
  message: string;
}

export function MobileQuarterlyReportStatePanel({
  actionHref,
  actionLabel,
  detail,
  message,
}: MobileQuarterlyReportStatePanelProps) {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <h1 className={styles.sectionTitle}>{message}</h1>
            {detail ? <p className={styles.inlineNotice}>{detail}</p> : null}
            {actionHref && actionLabel ? (
              <Link href={actionHref} className="app-button app-button-secondary">
                {actionLabel}
              </Link>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
