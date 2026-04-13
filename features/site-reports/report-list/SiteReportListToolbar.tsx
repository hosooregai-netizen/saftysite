'use client';

import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import type { SiteReportSortMode } from './types';

interface SiteReportListToolbarProps {
  canCreateReport: boolean;
  onCreateReport: () => void;
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
  setReportQuery: (value: string) => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
}

export function SiteReportListToolbar({
  canCreateReport,
  onCreateReport,
  reportQuery,
  reportSortMode,
  setReportQuery,
  setReportSortMode,
}: SiteReportListToolbarProps) {
  return (
    <div className={styles.tableTools}>
      <input
        className={`app-input ${styles.tableSearch}`}
        placeholder="차수, 보고서명, 지도일, 작성자로 검색"
        value={reportQuery}
        onChange={(event) => setReportQuery(event.target.value)}
        aria-label="보고서 검색"
      />
      <select
        className={`app-select ${styles.tableSort}`}
        value={reportSortMode}
        onChange={(event) => setReportSortMode(event.target.value as SiteReportSortMode)}
        aria-label="보고서 정렬"
      >
        <option value="round">차수순</option>
        <option value="name">보고서명순</option>
        <option value="progress">진행률순</option>
      </select>
      <button
        type="button"
        className={`app-button app-button-primary ${styles.tableCreateButton}`}
        onClick={onCreateReport}
        disabled={!canCreateReport}
      >
        보고서 추가
      </button>
    </div>
  );
}
