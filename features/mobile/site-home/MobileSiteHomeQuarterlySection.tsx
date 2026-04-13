'use client';

import Link from 'next/link';
import styles from '../components/MobileShell.module.css';

interface MobileSiteHomeQuarterlySectionProps {
  quarterlyListHref: string;
  quarterlyStatusLabel: string;
}

export function MobileSiteHomeQuarterlySection({
  quarterlyListHref,
  quarterlyStatusLabel,
}: MobileSiteHomeQuarterlySectionProps) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>분기보고서</h2>
        </div>
      </div>

      <div
        className={styles.statGrid}
        style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
      >
        <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
          <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>
            {quarterlyStatusLabel}
          </strong>
        </article>
        <Link
          href={quarterlyListHref}
          className={`app-button app-button-primary ${styles.mobileSummaryTallButton} ${styles.mobileSummaryLinkButton}`}
        >
          분기 보고 열기
        </Link>
      </div>
    </section>
  );
}
