'use client';

import {
  type AdminAnalyticsEmployeeRow,
  type AdminAnalyticsSiteRevenueRow,
  type AdminAnalyticsTrendRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { formatCurrencyValue } from '@/lib/admin';
import styles from './AnalyticsCharts.module.css';

interface AnalyticsChartsProps {
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  trendRows: AdminAnalyticsTrendRow[];
}

const CHART_WIDTH = 820;
const CHART_HEIGHT = 300;
const CHART_PADDING = { bottom: 44, left: 28, right: 28, top: 24 };

function formatCompactCurrency(value: number) {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(value >= 1_000_000_000 ? 0 : 1)}억`;
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(value >= 1_000_000 ? 0 : 1)}만`;
  }
  return value.toLocaleString('ko-KR');
}

function formatDelta(value: number | null) {
  if (value == null || Number.isNaN(value)) return '비교 없음';
  if (Math.abs(value) < 0.0005) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function TrendCard({ rows }: { rows: AdminAnalyticsTrendRow[] }) {
  if (rows.length === 0) {
    return <div className={styles.emptyState}>표시할 추이 데이터가 없습니다.</div>;
  }

  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);
  const maxAvgPerVisitAmount = Math.max(...rows.map((row) => row.avgPerVisitAmount), 1);
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const step = innerWidth / rows.length;
  const barWidth = Math.max(14, step * 0.46);
  const latestRow = rows[rows.length - 1];

  const linePoints = rows
    .map((row, index) => {
      const x = CHART_PADDING.left + step * index + step / 2;
      const y =
        CHART_PADDING.top + innerHeight - (row.avgPerVisitAmount / maxAvgPerVisitAmount) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className={`${styles.surface} ${styles.surfaceWide}`}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>월별 매출 추이</h3>
          <p className={styles.surfaceMeta}>최근 12개월 기준</p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendBar} aria-hidden="true" />
            월별 매출
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} aria-hidden="true" />
            평균 회차 단가
          </span>
        </div>
      </div>

      <div className={styles.trendSummary}>
        <div className={styles.trendSummaryItem}>
          <span className={styles.trendSummaryLabel}>최근 월 매출</span>
          <strong className={styles.trendSummaryValue}>{formatCurrencyValue(latestRow.revenue)}</strong>
        </div>
        <div className={styles.trendSummaryItem}>
          <span className={styles.trendSummaryLabel}>최근 월 평균 단가</span>
          <strong className={styles.trendSummaryValue}>
            {formatCurrencyValue(latestRow.avgPerVisitAmount)}
          </strong>
        </div>
        <div className={styles.trendSummaryItem}>
          <span className={styles.trendSummaryLabel}>최근 월 실행 회차</span>
          <strong className={styles.trendSummaryValue}>{latestRow.executedRounds}회</strong>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label="최근 12개월 월별 매출과 평균 회차 단가 추이"
        >
          <defs>
            <linearGradient id="analyticsRevenueBar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f4f8f" />
              <stop offset="100%" stopColor="#8eb4dc" />
            </linearGradient>
          </defs>

          {Array.from({ length: 4 }, (_, index) => {
            const y = CHART_PADDING.top + (innerHeight / 3) * index;
            return (
              <line
                key={`grid-${index}`}
                x1={CHART_PADDING.left}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y1={y}
                y2={y}
                className={styles.chartGridLine}
              />
            );
          })}

          {rows.map((row, index) => {
            const x = CHART_PADDING.left + step * index + (step - barWidth) / 2;
            const barHeight = (row.revenue / maxRevenue) * innerHeight;
            const y = CHART_PADDING.top + innerHeight - barHeight;
            return (
              <g key={row.monthKey}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="4"
                  fill="url(#analyticsRevenueBar)"
                />
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 14}
                  textAnchor="middle"
                  className={styles.chartAxisLabel}
                >
                  {row.label}
                </text>
              </g>
            );
          })}

          <polyline points={linePoints} fill="none" className={styles.chartLinePath} />
          {rows.map((row, index) => {
            const x = CHART_PADDING.left + step * index + step / 2;
            const y =
              CHART_PADDING.top + innerHeight - (row.avgPerVisitAmount / maxAvgPerVisitAmount) * innerHeight;
            return <circle key={`point-${row.monthKey}`} cx={x} cy={y} r="4.5" className={styles.chartLinePoint} />;
          })}
        </svg>
      </div>
    </section>
  );
}

function EmployeeContributionCard({ rows }: { rows: AdminAnalyticsEmployeeRow[] }) {
  const topRows = [...rows]
    .filter((row) => row.visitRevenue > 0 || row.executedRounds > 0)
    .sort(
      (left, right) =>
        right.visitRevenue - left.visitRevenue ||
        right.executedRounds - left.executedRounds ||
        left.userName.localeCompare(right.userName, 'ko'),
    )
    .slice(0, 10);

  if (topRows.length === 0) {
    return <div className={styles.emptyState}>표시할 직원 기여도 데이터가 없습니다.</div>;
  }

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>직원별 매출 기여도 Top 10</h3>
          <p className={styles.surfaceMeta}>매출, 회차 수, 평균 단가, 전기 대비</p>
        </div>
      </div>

      <div className={styles.list}>
        {topRows.map((row) => (
          <article key={row.userId} className={styles.listRow}>
            <div className={styles.listRowHeader}>
              <div className={styles.listRowTitleWrap}>
                <strong className={styles.listRowTitle}>{row.userName}</strong>
                <span className={styles.listRowMeta}>
                  {row.executedRounds}회 · 회당 {formatCompactCurrency(row.avgPerVisitAmount)}원 ·{' '}
                  {formatDelta(row.revenueChangeRate)}
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

function SiteContributionCard({ rows }: { rows: AdminAnalyticsSiteRevenueRow[] }) {
  const topRows = [...rows]
    .filter((row) => row.visitRevenue > 0 || row.executedRounds > 0)
    .sort(
      (left, right) =>
        right.visitRevenue - left.visitRevenue ||
        right.executedRounds - left.executedRounds ||
        left.siteName.localeCompare(right.siteName, 'ko'),
    )
    .slice(0, 10);

  if (topRows.length === 0) {
    return <div className={styles.emptyState}>표시할 현장 매출 데이터가 없습니다.</div>;
  }

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>현장별 매출 상위 Top 10</h3>
          <p className={styles.surfaceMeta}>사업장, 회차 수, 계약유형 중심</p>
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

export function AnalyticsCharts({
  employeeRows,
  siteRevenueRows,
  trendRows,
}: AnalyticsChartsProps) {
  return (
    <div className={styles.layout}>
      <TrendCard rows={trendRows} />
      <EmployeeContributionCard rows={employeeRows} />
      <SiteContributionCard rows={siteRevenueRows} />
    </div>
  );
}
