'use client';

import type { SiteReportSortMode } from '@/features/site-reports/hooks/useSiteReportListState';
import type { MobileReportCardModel } from './types';
import { MobileReportCard } from './MobileReportCard';
import styles from '../components/MobileShell.module.css';

interface MobileReportsListSectionProps {
  canArchiveReports: boolean;
  canCreateReport: boolean;
  cards: MobileReportCardModel[];
  isLoading: boolean;
  query: string;
  reportIndexError: string | null;
  reportCount: number;
  sortMode: SiteReportSortMode;
  onChangeQuery: (value: string) => void;
  onChangeSortMode: (value: SiteReportSortMode) => void;
  onDeleteRequest: (reportKey: string) => void;
  onOpenCreateDialog: () => void;
  onReload: () => void;
}

export function MobileReportsListSection({
  canArchiveReports,
  canCreateReport,
  cards,
  isLoading,
  query,
  reportIndexError,
  reportCount,
  sortMode,
  onChangeQuery,
  onChangeSortMode,
  onDeleteRequest,
  onOpenCreateDialog,
  onReload,
}: MobileReportsListSectionProps) {
  return (
    <section className={styles.sectionCard} style={{ padding: '16px 12px' }}>
      <div className={styles.sectionHeader} style={{ paddingBottom: '12px' }}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>현장 보고서 요약</h2>
        </div>
        <span className={styles.sectionMeta}>
          {isLoading ? '목록 동기화 중' : `총 ${reportCount}건 / 검색 ${cards.length}건`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          className="app-input"
          style={{ flex: 1, fontSize: '13px', minWidth: 0 }}
          placeholder="차수, 제목, 지도일, 작성자로 검색"
          value={query}
          onChange={(event) => onChangeQuery(event.target.value)}
        />
        <select
          className="app-select"
          style={{ flexShrink: 0, fontSize: '13px', padding: '0 8px', width: '100px' }}
          value={sortMode}
          onChange={(event) => onChangeSortMode(event.target.value as SiteReportSortMode)}
        >
          <option value="round">차수순</option>
          <option value="name">제목순</option>
          <option value="progress">진행률순</option>
        </select>
      </div>

      {reportIndexError ? (
        <div className={styles.errorNotice}>
          <p>{reportIndexError}</p>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onReload}
            disabled={isLoading}
          >
            다시 불러오기
          </button>
        </div>
      ) : null}

      {isLoading && reportCount === 0 ? (
        <p className={styles.inlineNotice}>보고서 목록을 불러오는 중입니다.</p>
      ) : reportCount === 0 ? (
        <div className={styles.cardStack}>
          <p className={styles.inlineNotice}>
            아직 작성된 보고서가 없습니다. 첫 보고서를 추가해 모바일 작성 흐름을 시작해 주세요.
          </p>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onOpenCreateDialog}
            disabled={!canCreateReport}
          >
            첫 보고서 추가
          </button>
        </div>
      ) : cards.length === 0 ? (
        <p className={styles.inlineNotice}>
          검색 조건에 맞는 보고서가 없습니다. 검색어 또는 정렬을 바꿔 다시 확인해 주세요.
        </p>
      ) : (
        <div className={styles.cardStack}>
          {cards.map((card) => (
            <MobileReportCard
              key={card.item.reportKey}
              canArchiveReports={canArchiveReports}
              card={card}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}

      {reportCount > 0 ? (
        <div style={{ paddingTop: '16px' }}>
          <button
            type="button"
            className="app-button app-button-primary"
            style={{ width: '100%' }}
            onClick={onOpenCreateDialog}
            disabled={!canCreateReport}
          >
            + 보고서 추가
          </button>
        </div>
      ) : null}
    </section>
  );
}
