'use client';

import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import type {
  AdminAnalyticsEmployeeRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import type { TableSortState } from '@/types/admin';
import { AnalyticsEmployeeTable } from './AnalyticsEmployeeTable';

interface AnalyticsDetailSectionProps {
  basisMonth: string;
  employeePage: number;
  employeeRows: AdminAnalyticsEmployeeRow[];
  employeeSort: TableSortState;
  employeeTotalPages: number;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  setEmployeePage: (next: number | ((current: number) => number)) => void;
  setEmployeeSort: (next: TableSortState) => void;
}

export function AnalyticsDetailSection({
  basisMonth,
  employeePage,
  employeeRows,
  employeeSort,
  employeeTotalPages,
  isInitialLoading,
  isRefreshing,
  loadError,
  setEmployeePage,
  setEmployeeSort,
}: AnalyticsDetailSectionProps) {
  return (
    <section className={`${sharedStyles.sectionCard} ${sharedStyles.listSectionCard}`}>
      <div className={sharedStyles.sectionHeader}>
        <div>
          <h2 className={sharedStyles.sectionTitle}>직원별 월별 매출</h2>
          <div className={sharedStyles.sectionHeaderMeta}>상세표 범위: {basisMonth} 기준</div>
        </div>
      </div>

      <div className={sharedStyles.sectionBody}>
        {loadError ? <div className={sharedStyles.tableEmpty}>{loadError}</div> : null}
        {isRefreshing ? (
          <div className={localStyles.loadingHint}>상세 표를 최신 조건으로 다시 계산하는 중입니다.</div>
        ) : null}
        {isInitialLoading ? (
          <div className={localStyles.detailLoadingState}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={`analytics-detail-skeleton-${index + 1}`} className={localStyles.detailLoadingRow}>
                <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonLabel}`} />
                <span className={`${localStyles.skeletonBlock} ${localStyles.skeletonMeta}`} />
              </div>
            ))}
          </div>
        ) : null}
        {!isInitialLoading ? (
          <>
            <AnalyticsEmployeeTable rows={employeeRows} sort={employeeSort} setSort={setEmployeeSort} />
            <div className={sharedStyles.paginationRow}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setEmployeePage((current) => Math.max(1, current - 1))}
                disabled={employeePage <= 1}
              >
                이전
              </button>
              <span className={sharedStyles.paginationLabel}>
                {employeePage} / {employeeTotalPages} 페이지
              </span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setEmployeePage((current) => Math.min(employeeTotalPages, current + 1))}
                disabled={employeePage >= employeeTotalPages}
              >
                다음
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
