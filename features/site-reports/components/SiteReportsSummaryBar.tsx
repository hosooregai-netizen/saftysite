import styles from './SiteReportsScreen.module.css';

interface SiteReportsSummaryBarProps {
  addressDisplay: string;
  amountDisplay: string;
  periodDisplay: string;
  siteNameDisplay: string;
}

export function SiteReportsSummaryBar({
  addressDisplay,
  amountDisplay,
  periodDisplay,
  siteNameDisplay,
}: SiteReportsSummaryBarProps) {
  return (
    <section className={styles.summaryBar} aria-label="현장 정보">
      <article className={styles.summaryCard}>
        <span className={styles.summaryCardLabel}>현장명</span>
        <strong className={styles.summaryCardValue}>{siteNameDisplay}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryCardLabel}>현장 주소</span>
        <strong className={`${styles.summaryCardValue} ${styles.summaryCardValueWide}`}>
          {addressDisplay}
        </strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryCardLabel}>공사기간</span>
        <strong className={styles.summaryCardValue}>{periodDisplay}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryCardLabel}>공사금액</span>
        <strong className={styles.summaryCardValue}>{amountDisplay}</strong>
      </article>
    </section>
  );
}

