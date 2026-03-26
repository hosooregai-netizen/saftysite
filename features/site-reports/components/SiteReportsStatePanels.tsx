import Link from 'next/link';
import styles from './SiteReportsScreen.module.css';

export function SiteReportsLoadingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>보고서 목록을 불러오는 중입니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function SiteReportsMissingState() {
  return (
    <main className="app-page">
      <div className="app-container">
        <section className="app-shell">
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>해당 현장을 찾을 수 없습니다.</p>
            <Link href="/" className="app-button app-button-secondary">
              현장 목록으로
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

