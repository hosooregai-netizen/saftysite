'use client';

import { formatCurrencyValue } from '@/lib/admin';
import type {
  AdminAnalyticsEmployeeRow,
  AdminAnalyticsSiteRevenueRow,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import styles from './AnalyticsCharts.module.css';

interface HeadquarterContributionRow {
  assigneeSummary: string;
  executedRounds: number;
  headquarterName: string;
  siteCount: number;
  visitRevenue: number;
}

function formatCompactCurrency(value: number) {
  const rounded = Math.round(value);
  if (rounded >= 100_000_000) return `${Math.round(rounded / 100_000_000).toLocaleString('ko-KR')}억`;
  if (rounded >= 10_000) return `${Math.round(rounded / 10_000).toLocaleString('ko-KR')}만`;
  return rounded.toLocaleString('ko-KR');
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
    .sort(
      (left, right) =>
        right.visitRevenue - left.visitRevenue ||
        right.executedRounds - left.executedRounds ||
        left.userName.localeCompare(right.userName, 'ko'),
    )
    .slice(0, 10);

  if (topRows.length === 0) return <div className={styles.emptyState}>표시할 직원 기여도 데이터가 없습니다.</div>;

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>직원별 매출 기여도 Top 10</h3>
          <p className={styles.surfaceMeta}>{year}년 기준 매출, 실회차 수, 평균 회차 단가, 전년 대비</p>
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
  const topRows = Array.from(
    [...rows]
    .filter((row) => !row.isSummaryRow)
    .filter((row) => row.visitRevenue > 0 || row.executedRounds > 0)
    .reduce<Map<string, HeadquarterContributionRow>>((map, row) => {
      const key = row.headquarterName || '미지정 건설사';
      const previous = map.get(key);
      const nextAssigneeNames = new Set<string>();
      if (previous?.assigneeSummary && previous.assigneeSummary !== '담당자 미배정') {
        previous.assigneeSummary.split(', ').forEach((value) => {
          if (value.startsWith('외 ')) return;
          nextAssigneeNames.add(value);
        });
      }
      if (row.assigneeName && row.assigneeName !== '-') {
        row.assigneeName
          .split(', ')
          .map((value) => value.trim())
          .filter(Boolean)
          .forEach((value) => nextAssigneeNames.add(value));
      }
      const assigneeNames = Array.from(nextAssigneeNames);
      map.set(key, {
        assigneeSummary:
          assigneeNames.length === 0
            ? '담당자 미배정'
            : `${assigneeNames.slice(0, 2).join(', ')}${assigneeNames.length > 2 ? ` 외 ${assigneeNames.length - 2}명` : ''}`,
        executedRounds: (previous?.executedRounds ?? 0) + row.executedRounds,
        headquarterName: key,
        siteCount: (previous?.siteCount ?? 0) + 1,
        visitRevenue: (previous?.visitRevenue ?? 0) + row.visitRevenue,
      });
      return map;
    }, new Map<string, HeadquarterContributionRow>()).values(),
  )
    .sort(
      (left, right) =>
        right.visitRevenue - left.visitRevenue ||
        right.executedRounds - left.executedRounds ||
        left.headquarterName.localeCompare(right.headquarterName, 'ko'),
    )
    .slice(0, 10);

  if (topRows.length === 0) return <div className={styles.emptyState}>표시할 건설사 매출 데이터가 없습니다.</div>;

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div className={styles.surfaceHeaderText}>
          <h3 className={styles.surfaceTitle}>상위 매출 사업장 Top 10</h3>
          <p className={styles.surfaceMeta}>{year}년 기준 건설사 합산 매출, 실회차 수, 담당 현장 중심</p>
        </div>
      </div>
      <div className={styles.list}>
        {topRows.map((row) => (
          <article key={row.headquarterName} className={styles.listRow}>
            <div className={styles.listRowHeader}>
              <div className={styles.listRowTitleWrap}>
                <strong className={styles.listRowTitle}>{row.headquarterName}</strong>
                <span className={styles.listRowMeta}>
                  {row.siteCount}개 현장 · {row.executedRounds}회 · {row.assigneeSummary}
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
