'use client';

import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsSiteRevenueRow,
  AdminAnalyticsTrendRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { AnalyticsEmployeeContributionCard, AnalyticsSiteContributionCard } from './AnalyticsContributionCards';
import { AnalyticsTrendCard } from './AnalyticsTrendCard';
import styles from './AnalyticsCharts.module.css';

interface AnalyticsChartsProps {
  basisMonth: string;
  chartYear: number;
  detailError: string | null;
  employeeRows: AdminAnalyticsEmployeeRow[];
  isDetailInitialLoading: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  trendRows: AdminAnalyticsTrendRow[];
}

export function AnalyticsCharts({
  basisMonth,
  chartYear,
  detailError,
  employeeRows,
  isDetailInitialLoading,
  isInitialLoading,
  isRefreshing,
  siteRevenueRows,
  trendRows,
}: AnalyticsChartsProps) {
  if (isInitialLoading) {
    return (
      <div className={styles.layout}>
        <section className={`${styles.surface} ${styles.surfaceWide} ${styles.surfaceSkeleton}`}>
          <div className={styles.skeletonHeader} />
          <div className={styles.trendSummary}>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={`trend-summary-skeleton-${index + 1}`} className={styles.trendSummaryItem}>
                <span className={styles.skeletonLineShort} />
                <span className={styles.skeletonLineLong} />
              </div>
            ))}
          </div>
          <div className={styles.chartSkeleton} />
        </section>
        <section className={`${styles.surface} ${styles.surfaceSkeleton}`}>
          <div className={styles.skeletonHeader} />
          <div className={styles.listSkeleton}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={`employee-skeleton-${index + 1}`} className={styles.listRow}>
                <span className={styles.skeletonLineLong} />
                <span className={styles.skeletonLineShort} />
              </div>
            ))}
          </div>
        </section>
        <section className={`${styles.surface} ${styles.surfaceSkeleton}`}>
          <div className={styles.skeletonHeader} />
          <div className={styles.listSkeleton}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={`site-skeleton-${index + 1}`} className={styles.listRow}>
                <span className={styles.skeletonLineLong} />
                <span className={styles.skeletonLineShort} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.layout} data-refreshing={isRefreshing ? 'true' : 'false'}>
      <AnalyticsTrendCard activeMonthKey={basisMonth} rows={trendRows} year={chartYear} />
      {isDetailInitialLoading ? (
        <>
          <section className={`${styles.surface} ${styles.surfaceSkeleton}`}>
            <div className={styles.skeletonHeader} />
            <div className={styles.listSkeleton}>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`employee-refresh-skeleton-${index + 1}`} className={styles.listRow}>
                  <span className={styles.skeletonLineLong} />
                  <span className={styles.skeletonLineShort} />
                </div>
              ))}
            </div>
          </section>
          <section className={`${styles.surface} ${styles.surfaceSkeleton}`}>
            <div className={styles.skeletonHeader} />
            <div className={styles.listSkeleton}>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`site-refresh-skeleton-${index + 1}`} className={styles.listRow}>
                  <span className={styles.skeletonLineLong} />
                  <span className={styles.skeletonLineShort} />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : detailError ? (
        <>
          <div className={styles.emptyState}>{detailError}</div>
          <div className={styles.emptyState}>{detailError}</div>
        </>
      ) : (
        <>
          <AnalyticsEmployeeContributionCard basisMonth={basisMonth} rows={employeeRows} />
          <AnalyticsSiteContributionCard basisMonth={basisMonth} rows={siteRevenueRows} />
        </>
      )}
    </div>
  );
}
