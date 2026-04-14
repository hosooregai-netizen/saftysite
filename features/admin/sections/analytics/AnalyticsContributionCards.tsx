'use client';

import { formatCurrencyValue } from '@/lib/admin';
import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsSiteRevenueRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import styles from './AnalyticsCharts.module.css';

function formatCompactCurrency(value: number) {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(value >= 1_000_000_000 ? 0 : 1)}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(value >= 1_000_000 ? 0 : 1)}만`;
  return value.toLocaleString('ko-KR');
}

function formatDelta(value: number | null) {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function AnalyticsEmployeeContributionCard({
  rows,
  year,
}: {
  rows: AdminAnalyticsEmployeeRow[];
  year: number;
}) {
  const topRows = [...rows]
    .filter((row) => row.visitRevenue > 0 || row.executedRounds > 0)
    .sort((left, right) => right.visitRevenue - left.visitRevenue || right.executedRounds - left.executedRounds || left.userName.localeCompare(right.userName, 'ko'))
    .slice(0, 10);

  if (topRows.length === 0) return <div className={styles.emptyState}>표시할 직원 기여도 데이터가 없습니다.</div>;

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>직원별 매출 기여도 Top 10</h3>
          <p className={styles.surfaceMeta}>{year}년 기준 매출, 회차 수, 평균 단가, 전기 대비</p>
        </div>
      </div>
      <div className={styles.list}>
        {topRows.map((row) => (
          <article key={row.userId} className={styles.listRow}>
            <div className={styles.listRowHeader}>
              <div className={styles.listRowTitleWrap}>
                <strong className={styles.listRowTitle}>{row.userName}</strong>
                <span className={styles.listRowMeta}>
                  {row.executedRounds}회 · 회당 {formatCompactCurrency(row.avgPerVisitAmount)}원 · {formatDelta(row.revenueChangeRate)}
                </span>
              </div>
              <strong className={styles.listRowValue}>{formatCurrencyValue(row.visitRevenue)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AnalyticsSiteContributionCard({
  rows,
  year,
}: {
  rows: AdminAnalyticsSiteRevenueRow[];
  year: number;
}) {
  const topRows = [...rows]
    .filter((row) => row.visitRevenue > 0 || row.executedRounds > 0)
    .sort((left, right) => right.visitRevenue - left.visitRevenue || right.executedRounds - left.executedRounds || left.siteName.localeCompare(right.siteName, 'ko'))
    .slice(0, 10);

  if (topRows.length === 0) return <div className={styles.emptyState}>표시할 현장 매출 데이터가 없습니다.</div>;

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>현장별 매출 상위 Top 10</h3>
          <p className={styles.surfaceMeta}>{year}년 기준 사업장, 회차 수, 계약유형 중심</p>
        </div>
      </div>
      <div className={styles.list}>
        {topRows.map((row) => (
          <article key={row.siteId} className={styles.listRow}>
            <div className={styles.listRowHeader}>
              <div className={styles.listRowTitleWrap}>
                <strong className={styles.listRowTitle}>{row.siteName}</strong>
                <span className={styles.listRowMeta}>
                  {row.headquarterName} · {row.executedRounds}회 · {row.contractTypeLabel}
                </span>
              </div>
              <strong className={styles.listRowValue}>{formatCurrencyValue(row.visitRevenue)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
