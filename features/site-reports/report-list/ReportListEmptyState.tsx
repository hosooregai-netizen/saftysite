'use client';

import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';

export type ReportListEmptyMode = 'empty' | 'error' | 'filtered-empty' | 'loading';

interface ReportListEmptyStateProps {
  canCreateReport: boolean;
  mode: ReportListEmptyMode;
  onCreateReport: () => void;
}

export function ReportListEmptyState({
  canCreateReport,
  mode,
  onCreateReport,
}: ReportListEmptyStateProps) {
  if (mode === 'loading') {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>보고서 목록을 불러오는 중입니다.</p>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>보고서 목록을 아직 불러오지 못했습니다.</p>
        <p className={styles.emptySearchHint}>다시 불러오기를 눌러 목록을 새로 받아오세요.</p>
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>아직 작성한 보고서가 없습니다.</p>
        {canCreateReport ? (
          <button type="button" onClick={onCreateReport} className="app-button app-button-primary">
            첫 보고서 작성
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>검색 조건에 맞는 보고서가 없습니다.</p>
      <p className={styles.emptySearchHint}>검색어나 정렬을 바꿔 다시 시도해 보세요.</p>
    </div>
  );
}
