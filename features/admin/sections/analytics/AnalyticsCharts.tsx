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
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  trendRows: AdminAnalyticsTrendRow[];
}

export function AnalyticsCharts({
  employeeRows,
  siteRevenueRows,
  trendRows,
}: AnalyticsChartsProps) {
  return (
    <div className={styles.layout}>
      <AnalyticsTrendCard rows={trendRows} />
      <AnalyticsEmployeeContributionCard rows={employeeRows} />
      <AnalyticsSiteContributionCard rows={siteRevenueRows} />
    </div>
  );
}
