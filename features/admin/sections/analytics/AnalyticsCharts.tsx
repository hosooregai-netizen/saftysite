'use client';

import type {
  AdminAnalyticsTrendRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { AnalyticsTrendCard } from './AnalyticsTrendCard';
import styles from './AnalyticsCharts.module.css';

interface AnalyticsChartsProps {
  basisMonth: string;
  chartYear: number;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  trendRows: AdminAnalyticsTrendRow[];
}

export function AnalyticsCharts({
  basisMonth,
  chartYear,
  isInitialLoading,
  isRefreshing,
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
      </div>
    );
  }

  return (
    <div className={styles.layout} data-refreshing={isRefreshing ? 'true' : 'false'}>
      <AnalyticsTrendCard activeMonthKey={basisMonth} rows={trendRows} year={chartYear} />
    </div>
  );
}
