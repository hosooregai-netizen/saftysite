'use client';

import sharedStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import localStyles from '@/features/admin/sections/analytics/AnalyticsSection.module.css';
import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsSiteRevenueRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import type { TableSortState } from '@/types/admin';
import { AnalyticsEmployeeTable } from './AnalyticsEmployeeTable';
import { AnalyticsSiteRevenueTable } from './AnalyticsSiteRevenueTable';

interface AnalyticsDetailSectionProps {
  detailView: 'employee' | 'site';
  employeePage: number;
  employeeRows: AdminAnalyticsEmployeeRow[];
  employeeSort: TableSortState;
  employeeTotalPages: number;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  setDetailView: (value: 'employee' | 'site') => void;
  setEmployeePage: (next: number | ((current: number) => number)) => void;
  setEmployeeSort: (next: TableSortState) => void;
  setSiteRevenuePage: (next: number | ((current: number) => number)) => void;
  setSiteRevenueSort: (next: TableSortState) => void;
  siteRevenuePage: number;
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  siteRevenueSort: TableSortState;
  siteRevenueTotalPages: number;
}

export function AnalyticsDetailSection({
  detailView,
  employeePage,
  employeeRows,
  employeeSort,
  employeeTotalPages,
  isInitialLoading,
  isRefreshing,
  loadError,
  setDetailView,
  setEmployeePage,
  setEmployeeSort,
  setSiteRevenuePage,
  setSiteRevenueSort,
  siteRevenuePage,
  siteRevenueRows,
  siteRevenueSort,
  siteRevenueTotalPages,
}: AnalyticsDetailSectionProps) {
  return (
    <section className={`${sharedStyles.sectionCard} ${sharedStyles.listSectionCard}`}>
      <div className={sharedStyles.sectionHeader}>
        <div>
          <h2 className={sharedStyles.sectionTitle}>상세 표</h2>
        </div>
        <div className={localStyles.detailTabs}>
          <button
            type="button"
            className={`${localStyles.detailTabButton} ${detailView === 'employee' ? localStyles.detailTabButtonActive : ''}`}
            onClick={() => setDetailView('employee')}
          >
            직원별
          </button>
          <button
            type="button"
            className={`${localStyles.detailTabButton} ${detailView === 'site' ? localStyles.detailTabButtonActive : ''}`}
            onClick={() => setDetailView('site')}
          >
            현장별
          </button>
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
        {!isInitialLoading && detailView === 'employee' ? (
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
        {!isInitialLoading && detailView === 'site' ? (
          <>
            <AnalyticsSiteRevenueTable rows={siteRevenueRows} sort={siteRevenueSort} setSort={setSiteRevenueSort} />
            <div className={sharedStyles.paginationRow}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setSiteRevenuePage((current) => Math.max(1, current - 1))}
                disabled={siteRevenuePage <= 1}
              >
                이전
              </button>
              <span className={sharedStyles.paginationLabel}>
                {siteRevenuePage} / {siteRevenueTotalPages} 페이지
              </span>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setSiteRevenuePage((current) => Math.min(siteRevenueTotalPages, current + 1))}
                disabled={siteRevenuePage >= siteRevenueTotalPages}
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
