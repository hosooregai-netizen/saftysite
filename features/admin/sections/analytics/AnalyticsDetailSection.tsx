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
  employeeRows: AdminAnalyticsEmployeeRow[];
  employeeSort: TableSortState;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  setDetailView: (value: 'employee' | 'site') => void;
  setEmployeeSort: (next: TableSortState) => void;
  setSiteRevenueSort: (next: TableSortState) => void;
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  siteRevenueSort: TableSortState;
}

export function AnalyticsDetailSection({
  detailView,
  employeeRows,
  employeeSort,
  isInitialLoading,
  isRefreshing,
  setDetailView,
  setEmployeeSort,
  setSiteRevenueSort,
  siteRevenueRows,
  siteRevenueSort,
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
          <AnalyticsEmployeeTable rows={employeeRows} sort={employeeSort} setSort={setEmployeeSort} />
        ) : null}
        {!isInitialLoading && detailView === 'site' ? (
          <AnalyticsSiteRevenueTable rows={siteRevenueRows} sort={siteRevenueSort} setSort={setSiteRevenueSort} />
        ) : null}
      </div>
    </section>
  );
}
