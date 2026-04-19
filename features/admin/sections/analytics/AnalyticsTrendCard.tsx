'use client';

import { formatCurrencyValue } from '@/lib/admin';
import type { AdminAnalyticsTrendRow } from '@/features/admin/lib/buildAdminControlCenterModel';
import styles from './AnalyticsCharts.module.css';

const CHART_WIDTH = 820;
const CHART_HEIGHT = 300;
const CHART_PADDING = { bottom: 44, left: 28, right: 28, top: 24 };

export function AnalyticsTrendCard({
  activeMonthKey,
  rows,
  year,
}: {
  activeMonthKey: string;
  rows: AdminAnalyticsTrendRow[];
  year: number;
}) {
  if (rows.length === 0) {
    return <div className={styles.emptyState}>표시할 추이 데이터가 없습니다.</div>;
  }

  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);
  const maxAvgPerVisitAmount = Math.max(...rows.map((row) => row.avgPerVisitAmount), 1);
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const step = innerWidth / rows.length;
  const barWidth = Math.max(14, step * 0.46);
  const latestRow = rows.find((row) => row.monthKey === activeMonthKey) ?? rows[rows.length - 1];
  const linePoints = rows
    .map((row, index) => {
      const x = CHART_PADDING.left + step * index + step / 2;
      const y = CHART_PADDING.top + innerHeight - (row.avgPerVisitAmount / maxAvgPerVisitAmount) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className={`${styles.surface} ${styles.surfaceWide}`}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>{year}년 월별 매출 추이</h3>
          <p className={styles.surfaceMeta}>{year}년 전체 추이 · 선택 기준월 {activeMonthKey || `${year}-01`}</p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}><span className={styles.legendBar} aria-hidden="true" />월별 매출</span>
          <span className={styles.legendItem}><span className={styles.legendLine} aria-hidden="true" />평균 회차 단가</span>
        </div>
      </div>
      <div className={styles.trendSummary}>
        <div className={styles.trendSummaryItem}><span className={styles.trendSummaryLabel}>선택 월 매출</span><strong className={styles.trendSummaryValue}>{formatCurrencyValue(latestRow.revenue)}</strong></div>
        <div className={styles.trendSummaryItem}><span className={styles.trendSummaryLabel}>선택 월 평균 단가</span><strong className={styles.trendSummaryValue}>{formatCurrencyValue(latestRow.avgPerVisitAmount)}</strong></div>
        <div className={styles.trendSummaryItem}><span className={styles.trendSummaryLabel}>선택 월 실행 회차</span><strong className={styles.trendSummaryValue}>{latestRow.executedRounds}회</strong></div>
      </div>
      <div className={styles.chartWrap}>
        <svg className={styles.chartSvg} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${year}년 월별 매출과 평균 회차 단가 추이`}>
          <defs>
            <linearGradient id="analyticsRevenueBar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f4f8f" />
              <stop offset="100%" stopColor="#8eb4dc" />
            </linearGradient>
          </defs>
          {Array.from({ length: 4 }, (_, index) => {
            const y = CHART_PADDING.top + (innerHeight / 3) * index;
            return <line key={`grid-${index}`} x1={CHART_PADDING.left} x2={CHART_WIDTH - CHART_PADDING.right} y1={y} y2={y} className={styles.chartGridLine} />;
          })}
          {rows.map((row, index) => {
            const x = CHART_PADDING.left + step * index + (step - barWidth) / 2;
            const barHeight = (row.revenue / maxRevenue) * innerHeight;
            const y = CHART_PADDING.top + innerHeight - barHeight;
            const isActive = row.monthKey === activeMonthKey;
            return (
              <g key={row.monthKey}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="4"
                  fill="url(#analyticsRevenueBar)"
                  className={isActive ? styles.chartBarActive : undefined}
                />
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 14}
                  textAnchor="middle"
                  className={`${styles.chartAxisLabel} ${isActive ? styles.chartAxisLabelActive : ''}`}
                >
                  {row.label}
                </text>
              </g>
            );
          })}
          <polyline points={linePoints} fill="none" className={styles.chartLinePath} />
          {rows.map((row, index) => {
            const x = CHART_PADDING.left + step * index + step / 2;
            const y = CHART_PADDING.top + innerHeight - (row.avgPerVisitAmount / maxAvgPerVisitAmount) * innerHeight;
            return <circle key={`point-${row.monthKey}`} cx={x} cy={y} r="4.5" className={`${styles.chartLinePoint} ${row.monthKey === activeMonthKey ? styles.chartLinePointActive : ''}`} />;
          })}
        </svg>
      </div>
    </section>
  );
}
