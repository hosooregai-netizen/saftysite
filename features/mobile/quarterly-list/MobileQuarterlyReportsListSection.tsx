'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileQuarterlyReportCard } from './MobileQuarterlyReportCard';
import type { MobileQuarterlyListRow, MobileQuarterlyListSortMode } from './types';

interface MobileQuarterlyReportsListSectionProps {
  canArchiveReports: boolean;
  filteredRows: MobileQuarterlyListRow[];
  isBusy: boolean;
  isLoading: boolean;
  operationalError: string | null;
  query: string;
  rows: MobileQuarterlyListRow[];
  sortMode: MobileQuarterlyListSortMode;
  onChangeQuery: (value: string) => void;
  onChangeSortMode: (value: MobileQuarterlyListSortMode) => void;
  onDeleteRequest: (reportId: string) => void;
  onOpenCreateDialog: () => void;
}

export function MobileQuarterlyReportsListSection({
  canArchiveReports,
  filteredRows,
  isBusy,
  isLoading,
  operationalError,
  query,
  rows,
  sortMode,
  onChangeQuery,
  onChangeSortMode,
  onDeleteRequest,
  onOpenCreateDialog,
}: MobileQuarterlyReportsListSectionProps) {
  return (
    <section className={styles.sectionCard} style={{ padding: '16px 12px' }}>
      <div className={styles.sectionHeader} style={{ paddingBottom: '12px' }}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>분기 보고 목록</h2>
        </div>
        <span className={styles.sectionMeta}>
          {isLoading ? '불러오는 중' : `총 ${rows.length}건 / 검색 ${filteredRows.length}건`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          className="app-input"
          style={{ flex: 1, fontSize: '13px', minWidth: 0 }}
          placeholder="제목, 분기, 기간으로 검색"
          value={query}
          onChange={(event) => onChangeQuery(event.target.value)}
        />
        <select
          className="app-select"
          style={{ flexShrink: 0, fontSize: '13px', padding: '0 8px', width: '108px' }}
          value={sortMode}
          onChange={(event) => onChangeSortMode(event.target.value as MobileQuarterlyListSortMode)}
        >
          <option value="recent">최근순</option>
          <option value="period">기간순</option>
          <option value="name">제목순</option>
        </select>
      </div>

      {operationalError ? (
        <div className={styles.errorNotice}>
          <p style={{ margin: 0 }}>{operationalError}</p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className={styles.cardStack}>
          <p className={styles.inlineNotice}>
            아직 등록된 분기 보고서가 없습니다. 첫 보고서를 만들면 모바일에서 바로 편집할 수
            있습니다.
          </p>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onOpenCreateDialog}
            disabled={isBusy}
          >
            + 분기 보고 만들기
          </button>
        </div>
      ) : filteredRows.length === 0 ? (
        <p className={styles.inlineNotice}>
          검색 조건에 맞는 분기 보고서가 없습니다. 검색어 또는 정렬 기준을 바꿔 보세요.
        </p>
      ) : (
        <div className={styles.cardStack}>
          {filteredRows.map((row) => (
            <MobileQuarterlyReportCard
              key={row.reportId}
              canArchiveReports={canArchiveReports}
              row={row}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onOpenCreateDialog}
          disabled={isBusy}
          style={{ marginTop: '16px', width: '100%' }}
        >
          + 분기 보고 만들기
        </button>
      ) : null}
    </section>
  );
}
