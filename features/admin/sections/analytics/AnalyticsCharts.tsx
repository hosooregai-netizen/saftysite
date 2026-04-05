'use client';

import { formatAnalyticsStatValue } from '@/features/admin/lib/buildAdminControlCenterModel';
import styles from './AnalyticsCharts.module.css';
import type {
  AdminAnalyticsContractTypeRow,
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsSiteRevenueRow,
  AdminAnalyticsStats,
} from '@/types/admin';

interface AnalyticsChartsProps {
  contractTypeRows: AdminAnalyticsContractTypeRow[];
  employeeRows: AdminAnalyticsEmployeeRow[];
  siteRevenueRows: AdminAnalyticsSiteRevenueRow[];
  stats: AdminAnalyticsStats;
}

const CONTRACT_COLORS = ['#1b3048', '#4d7098', '#f7b019', '#84a59d', '#d38b5d', '#8b95c9'];

function formatCompactCurrency(value: number) {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(value >= 1_000_000_000 ? 0 : 1)}억`;
  }
  if (value >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`;
  }
  return value.toLocaleString('ko-KR');
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value * 100));
}

function HorizontalBarChart({
  rows,
  title,
  valueLabel,
}: {
  rows: Array<{ label: string; meta: string; value: number }>;
  title: string;
  valueLabel: string;
}) {
  if (rows.length === 0) {
    return <div className={styles.emptyState}>표시할 차트 데이터가 없습니다.</div>;
  }

  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <span className={styles.cardMeta}>상위 {rows.length}개 기준</span>
      </div>
      <div className={styles.barList}>
        {rows.map((row) => {
          const width = `${Math.max(8, (row.value / maxValue) * 100)}%`;
          return (
            <div key={`${title}-${row.label}`} className={styles.barRow}>
              <div className={styles.barHeader}>
                <div className={styles.barLabelWrap}>
                  <span className={styles.barLabel}>{row.label}</span>
                  <span className={styles.barSubLabel}>{row.meta}</span>
                </div>
                <span className={styles.barValue}>
                  {formatCompactCurrency(row.value)}
                  {valueLabel}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContractTypeDistribution({
  rows,
}: {
  rows: AdminAnalyticsContractTypeRow[];
}) {
  if (rows.length === 0) {
    return <div className={styles.emptyState}>표시할 계약유형 데이터가 없습니다.</div>;
  }

  const total = rows.reduce((sum, row) => sum + row.totalContractAmount, 0);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>계약유형별 계약금액</h3>
        <span className={styles.cardMeta}>총 {rows.length}개 유형</span>
      </div>
      <div className={styles.contractSegments} aria-hidden="true">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={styles.contractSegment}
            style={{
              backgroundColor: CONTRACT_COLORS[index % CONTRACT_COLORS.length],
              width: `${total > 0 ? Math.max(6, (row.totalContractAmount / total) * 100) : 0}%`,
            }}
          />
        ))}
      </div>
      <div className={styles.contractLegend}>
        {rows.map((row, index) => {
          const percent = total > 0 ? (row.totalContractAmount / total) * 100 : 0;
          return (
            <div key={row.label} className={styles.contractLegendRow}>
              <span
                className={styles.contractSwatch}
                style={{ backgroundColor: CONTRACT_COLORS[index % CONTRACT_COLORS.length] }}
              />
              <div className={styles.contractLegendText}>
                <span className={styles.barLabel}>{row.label}</span>
                <span className={styles.barSubLabel}>
                  {row.siteCount}개 현장 · 평균 회차 단가 {formatCompactCurrency(row.avgPerVisitAmount)}원
                </span>
              </div>
              <span className={styles.barValue}>
                {percent.toFixed(1)}% · {formatCompactCurrency(row.totalContractAmount)}원
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCards({ stats }: { stats: AdminAnalyticsStats }) {
  const metrics = [
    {
      label: '완료율',
      meta: `${stats.countedSiteCount.toLocaleString('ko-KR')}개 현장 기준`,
      percent: clampPercent(stats.completionRate),
      value: formatAnalyticsStatValue('percent', stats.completionRate),
    },
    {
      label: '지연율',
      meta: `지연 현황 반영`,
      percent: clampPercent(stats.delayRate),
      value: formatAnalyticsStatValue('percent', stats.delayRate),
    },
    {
      label: '평균 회차 단가',
      meta: `집계 제외 ${stats.excludedSiteCount.toLocaleString('ko-KR')}개 현장`,
      percent: stats.countedSiteCount + stats.excludedSiteCount > 0
        ? (stats.countedSiteCount / (stats.countedSiteCount + stats.excludedSiteCount)) * 100
        : 0,
      value: formatAnalyticsStatValue('currency', stats.averagePerVisitAmount),
    },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>운영 지표 시각화</h3>
        <span className={styles.cardMeta}>현재 필터 기준</span>
      </div>
      <div className={styles.metricGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <div className={styles.metricTrack}>
              <div className={styles.metricFill} style={{ width: `${Math.max(6, metric.percent)}%` }} />
            </div>
            <span className={styles.metricMeta}>{metric.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsCharts({
  contractTypeRows,
  employeeRows,
  siteRevenueRows,
  stats,
}: AnalyticsChartsProps) {
  const employeeChartRows = employeeRows.slice(0, 8).map((row) => ({
    label: row.userName,
    meta: `실행 ${row.executedRounds}회 · 배정 ${row.assignedSiteCount}개 현장`,
    value: row.visitRevenue,
  }));
  const siteChartRows = siteRevenueRows.slice(0, 8).map((row) => ({
    label: row.siteName,
    meta: `${row.headquarterName} · ${row.executedRounds}회`,
    value: row.visitRevenue,
  }));

  return (
    <div className={styles.grid}>
      <HorizontalBarChart rows={employeeChartRows} title="직원별 회차 매출" valueLabel="원" />
      <HorizontalBarChart rows={siteChartRows} title="현장별 매출" valueLabel="원" />
      <ContractTypeDistribution rows={contractTypeRows} />
      <MetricCards stats={stats} />
    </div>
  );
}
