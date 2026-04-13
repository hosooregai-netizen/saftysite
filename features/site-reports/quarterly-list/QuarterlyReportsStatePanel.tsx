'use client';

import styles from '../components/SiteReportsScreen.module.css';

interface QuarterlyReportsStatePanelProps {
  message: string;
}

export function QuarterlyReportsStatePanel({
  message,
}: QuarterlyReportsStatePanelProps) {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className={styles.panel}>
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>{message}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
