'use client';

import Link from 'next/link';
import {
  buildDonutSlices,
  fullDonutRing,
} from '@/components/session/workspace/chartDonutUtils';
import type { AdminOverviewChartEntry } from '@/features/admin/lib/buildAdminControlCenterModel';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';

const EMPTY_DONUT_RING = fullDonutRing(0, 0, 22, 40);
const DEADLINE_SIGNAL_COLOR_BY_KEY: Record<string, string> = {
  d_plus_0_3: '#dbe7f6',
  d_plus_4_6: '#dfbb73',
  d_plus_7_plus: '#d96f6f',
};

function DonutOverviewCard({
  entries,
  title,
  totalLabel,
  totalValue,
}: {
  entries: AdminOverviewChartEntry[];
  title: string;
  totalLabel: string;
  totalValue: number;
}) {
  const populatedEntries = entries.filter((entry) => entry.count > 0);
  const slices =
    totalValue > 0
      ? buildDonutSlices(
          populatedEntries.map((entry) => ({ count: entry.count, label: entry.key })),
          totalValue,
        )
      : [];
  const colorByKey = new Map(slices.map((slice) => [slice.label, slice.color]));

  return (
    <article className={styles.kpiVisualCard}>
      <div className={styles.kpiVisualHeader}>
        <h2 className={styles.kpiVisualTitle}>{title}</h2>
      </div>
      <div className={styles.kpiDonutLayout}>
        <div className={styles.kpiDonutFigure}>
          <svg className={styles.kpiDonutSvg} viewBox="-50 -50 100 100" role="img" aria-label={`${title}: 총 ${totalValue}`}>
            <title>{`${title}: 총 ${totalValue}`}</title>
            <path d={EMPTY_DONUT_RING} fill="#e8edf3" />
            {slices.map((slice) => <path key={slice.label} d={slice.path} fill={slice.color} stroke="none" />)}
          </svg>
          <div className={styles.kpiDonutCenter} aria-hidden="true">
            <strong>{totalValue}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>
        <ul className={styles.kpiLegend}>
          {entries.map((entry) => (
            <li key={entry.key} className={styles.kpiLegendItem}>
              <span
                className={styles.kpiLegendSwatch}
                style={{ backgroundColor: totalValue > 0 && entry.count > 0 ? colorByKey.get(entry.key) ?? '#4f8ae8' : '#d7e0e8' }}
                aria-hidden="true"
              />
              <Link href={entry.href} className={styles.tableInlineLink}>{entry.label}</Link>
              <span className={styles.kpiLegendValue}>{entry.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function DeadlineSignalOverviewCard({
  entries,
  title,
  totalValue,
}: {
  entries: AdminOverviewChartEntry[];
  title: string;
  totalValue: number;
}) {
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    color: DEADLINE_SIGNAL_COLOR_BY_KEY[entry.key] ?? '#4f8ae8',
    width: totalValue > 0 ? `${(entry.count / totalValue) * 100}%` : '0%',
  }));

  return (
    <article className={styles.kpiVisualCard}>
      <div className={styles.kpiVisualHeader}>
        <h2 className={styles.kpiVisualTitle}>{title}</h2>
        <span className={styles.kpiSignalTotal}>{`${totalValue}건`}</span>
      </div>
      <div className={styles.kpiSignalSummary}>
        <div className={styles.kpiSignalTrack} role="img" aria-label={`${title}: 총 ${totalValue}건`}>
          {normalizedEntries.map((entry) =>
            entry.count > 0 ? (
              <span
                key={entry.key}
                className={styles.kpiSignalSegment}
                style={{ backgroundColor: entry.color, width: entry.width }}
                aria-hidden="true"
              />
            ) : null,
          )}
        </div>
        <ul className={styles.kpiSignalLegend}>
          {normalizedEntries.map((entry) => (
            <li key={entry.key} className={styles.kpiSignalLegendItem}>
              <span className={styles.kpiLegendSwatch} style={{ backgroundColor: entry.count > 0 ? entry.color : '#d7e0e8' }} aria-hidden="true" />
              <Link href={entry.href} className={`${styles.tableInlineLink} ${styles.kpiSignalLegendLabel}`}>
                {entry.label}
              </Link>
              <span className={styles.kpiSignalLegendValue}>{`${entry.count}건`}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

interface OverviewVisualCardsProps {
  deadlineSignalSummary: {
    entries: AdminOverviewChartEntry[];
    totalReportCount: number;
  };
  quarterlyMaterialSummary: {
    entries: AdminOverviewChartEntry[];
    quarterLabel: string;
    totalSiteCount: number;
  };
  siteStatusSummary: {
    entries: AdminOverviewChartEntry[];
    totalSiteCount: number;
  };
}

export function OverviewVisualCards({
  deadlineSignalSummary,
  quarterlyMaterialSummary,
  siteStatusSummary,
}: OverviewVisualCardsProps) {
  return (
    <div className={styles.kpiVisualGrid}>
      <DonutOverviewCard title="현장 상태" entries={siteStatusSummary.entries} totalLabel="전체 현장" totalValue={siteStatusSummary.totalSiteCount} />
      <DonutOverviewCard title="교육/계측 자료 충족 상태" entries={quarterlyMaterialSummary.entries} totalLabel={quarterlyMaterialSummary.quarterLabel} totalValue={quarterlyMaterialSummary.totalSiteCount} />
      <DeadlineSignalOverviewCard title="미발송 경과 현황" entries={deadlineSignalSummary.entries} totalValue={deadlineSignalSummary.totalReportCount} />
    </div>
  );
}
