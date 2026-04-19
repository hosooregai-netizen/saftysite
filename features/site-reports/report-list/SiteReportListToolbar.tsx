'use client';

import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import type { SiteReportDispatchFilter, SiteReportSortMode } from './types';

interface SiteReportListToolbarProps {
  canCreateReport: boolean;
  createAvailabilityMessage?: string | null;
  dispatchFilter: SiteReportDispatchFilter;
  isSearching?: boolean;
  onCreateReport: () => void;
  onSubmitReportQuery: () => void;
  reportQuery: string;
  reportSortMode: SiteReportSortMode;
  setDispatchFilter: (value: SiteReportDispatchFilter) => void;
  setReportQuery: (value: string) => void;
  setReportSortMode: (value: SiteReportSortMode) => void;
}

export function SiteReportListToolbar({
  canCreateReport,
  createAvailabilityMessage = null,
  dispatchFilter,
  isSearching = false,
  onCreateReport,
  onSubmitReportQuery,
  reportQuery,
  reportSortMode,
  setDispatchFilter,
  setReportQuery,
  setReportSortMode,
}: SiteReportListToolbarProps) {
  return (
    <div className={styles.tableTools}>
      <SubmitSearchField
        busy={isSearching}
        formClassName={styles.tableSearchShell}
        inputClassName={`app-input ${styles.tableSearchInput}`}
        buttonClassName={styles.tableSearchButton}
        placeholder="차수, 보고서명, 지도일, 작성자로 검색"
        value={reportQuery}
        onChange={setReportQuery}
        onSubmit={onSubmitReportQuery}
        aria-label="기술지도 보고서 검색"
      />
      <select
        className={`app-select ${styles.tableSort}`}
        value={dispatchFilter}
        onChange={(event) => setDispatchFilter(event.target.value as SiteReportDispatchFilter)}
        aria-label="발송여부 필터"
      >
        <option value="all">발송여부 전체</option>
        <option value="pending">미발송</option>
        <option value="completed">발송완료</option>
      </select>
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
      {createAvailabilityMessage ? (
        <p className={styles.createAvailabilityHint}>{createAvailabilityMessage}</p>
      ) : null}
    </div>
  );
}
