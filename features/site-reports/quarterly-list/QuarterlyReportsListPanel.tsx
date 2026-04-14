'use client';

import Link from 'next/link';
import ActionMenu from '@/components/ui/ActionMenu';
import styles from '../components/SiteReportsScreen.module.css';
import { formatDateTimeLabel, shouldIgnoreRowClick } from './quarterlyListHelpers';
import type {
  QuarterlyListDispatchFilter,
  QuarterlyListRow,
  QuarterlyListSortMode,
} from './types';

interface QuarterlyReportsListPanelProps {
  canArchiveReports: boolean;
  dispatchFilter: QuarterlyListDispatchFilter;
  filteredRows: QuarterlyListRow[];
  isBusy: boolean;
  isLoading: boolean;
  onChangeDispatchFilter: (value: QuarterlyListDispatchFilter) => void;
  onChangeQuery: (value: string) => void;
  onChangeSortMode: (value: QuarterlyListSortMode) => void;
  onDeleteRequest: (reportId: string) => void;
  onOpenCreateDialog: () => void;
  onOpenReport: (href: string) => void;
  operationalError: string | null;
  query: string;
  rows: QuarterlyListRow[];
  sortMode: QuarterlyListSortMode;
}

export function QuarterlyReportsListPanel({
  canArchiveReports,
  dispatchFilter,
  filteredRows,
  isBusy,
  isLoading,
  onChangeDispatchFilter,
  onChangeQuery,
  onChangeSortMode,
  onDeleteRequest,
  onOpenCreateDialog,
  onOpenReport,
  operationalError,
  query,
  rows,
  sortMode,
}: QuarterlyReportsListPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.tableTools}>
        <input
          className={`app-input ${styles.tableSearch}`}
          placeholder="보고서명, 기간 검색"
          value={query}
          onChange={(event) => onChangeQuery(event.target.value)}
          aria-label="분기 종합 보고서 검색"
        />
        <select
          className={`app-select ${styles.tableSort}`}
          value={dispatchFilter}
          onChange={(event) => onChangeDispatchFilter(event.target.value as QuarterlyListDispatchFilter)}
          aria-label="분기 종합 보고서 발송여부 필터"
        >
          <option value="all">발송여부 전체</option>
          <option value="pending">미발송</option>
          <option value="completed">발송완료</option>
        </select>
        <select
          className={`app-select ${styles.tableSort}`}
          value={sortMode}
          onChange={(event) => onChangeSortMode(event.target.value as QuarterlyListSortMode)}
          aria-label="분기 종합 보고서 정렬"
        >
          <option value="number">번호순</option>
          <option value="recent">최근 수정순</option>
          <option value="name">보고서명순</option>
          <option value="period">기간순</option>
        </select>
        <button
          type="button"
          className={`app-button app-button-primary ${styles.tableCreateButton}`}
          onClick={onOpenCreateDialog}
          disabled={isBusy}
        >
          보고서 작성
        </button>
      </div>

      {operationalError ? (
        <div className={styles.tableTools}>
          <span>{operationalError}</span>
        </div>
      ) : null}

      {(isLoading || (!operationalError && rows.length === 0)) && rows.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {isLoading ? '분기 종합 보고서 목록을 불러오는 중입니다.' : '아직 작성된 분기 종합 보고서가 없습니다.'}
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>검색 조건에 맞는 분기 보고서가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.listViewport}>
          <div className={styles.listTrack}>
            <div className={`${styles.listHead} ${styles.quarterlyListHead}`} aria-hidden="true">
              <span>번호</span>
              <span>보고서명</span>
              <span>선택 보고서</span>
              <span>발송여부</span>
              <span className={styles.desktopOnly}>수정일</span>
              <span className={styles.desktopOnly}>기간</span>
              <span>메뉴</span>
            </div>

            <div className={styles.reportList}>
              {filteredRows.map((row) => (
                <article
                  key={row.reportId}
                  className={`${styles.reportRow} ${styles.quarterlyReportRow} ${styles.reportRowClickable}`}
                  tabIndex={0}
                  role="link"
                  onClick={(event) => {
                    if (shouldIgnoreRowClick(event.target)) return;
                    onOpenReport(row.href);
                  }}
                  onKeyDown={(event) => {
                    if (shouldIgnoreRowClick(event.target)) return;
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    onOpenReport(row.href);
                  }}
                >
                  <div className={`${styles.dataCell} ${styles.sequenceCell}`}>
                    <span className={styles.dataValue}>{row.sequenceNumber}</span>
                  </div>

                  <div className={`${styles.primaryCell} ${styles.titleCell}`}>
                    <Link href={row.href} className={styles.reportLink}>
                      {row.reportTitle}
                    </Link>
                  </div>

                  <div className={styles.dataCell}>
                    <span className={styles.dataValue}>{row.selectedCount}건</span>
                  </div>

                  <div className={`${styles.dataCell} ${styles.dispatchStatusCell}`}>
                    <span className={styles.dataValue}>{row.dispatchCompleted ? '발송완료' : '미발송'}</span>
                  </div>

                  <div className={`${styles.dataCell} ${styles.desktopOnly}`}>
                    <span className={styles.dataValue}>{formatDateTimeLabel(row.updatedAt)}</span>
                  </div>

                  <div className={`${styles.dataCell} ${styles.desktopOnly}`}>
                    <span className={styles.dataValue}>
                      {row.quarterLabel} {row.periodLabel}
                    </span>
                  </div>

                  <div
                    className={`${styles.actionCell} ${styles.actionsCell}`}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <ActionMenu
                      label={`${row.reportTitle} 작업 메뉴 열기`}
                      items={[
                        { label: '열기', href: row.href },
                        ...(canArchiveReports
                          ? [{ label: '삭제', tone: 'danger' as const, onSelect: () => onDeleteRequest(row.reportId) }]
                          : []),
                      ]}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
