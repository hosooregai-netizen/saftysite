import type { SafetyAdminOverviewResponse } from '@/types/admin';

type OverviewPolicyOverlay = Pick<SafetyAdminOverviewResponse, 'siteStatusSummary'>;

function cloneSiteStatusSummary(
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
): SafetyAdminOverviewResponse['siteStatusSummary'] {
  return {
    entries: siteStatusSummary.entries.map((entry) => ({ ...entry })),
    totalSiteCount: siteStatusSummary.totalSiteCount,
  };
}

function formatCountLike(previousValue: string, count: number) {
  const suffix = previousValue.trim().replace(/^[\d,.\s]+/, '');
  return `${count.toLocaleString('ko-KR')}${suffix || '건'}`;
}

function getSiteStatusCounts(siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary']) {
  return [
    siteStatusSummary.totalSiteCount,
    siteStatusSummary.entries[0]?.count ?? 0,
    siteStatusSummary.entries[1]?.count ?? 0,
    siteStatusSummary.entries[2]?.count ?? 0,
  ];
}

function mergeMetricCards(
  baseCards: SafetyAdminOverviewResponse['metricCards'],
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
): SafetyAdminOverviewResponse['metricCards'] {
  if (baseCards.length === 0) return baseCards;

  const siteStatusCounts = getSiteStatusCounts(siteStatusSummary);
  return baseCards.map((card, index) =>
    index < siteStatusCounts.length
      ? {
          ...card,
          tone: 'default' as const,
          value: formatCountLike(card.value, siteStatusCounts[index] ?? 0),
        }
      : { ...card },
  );
}

function mergeSummaryRows(
  baseRows: SafetyAdminOverviewResponse['summaryRows'],
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
) {
  if (baseRows.length === 0) return baseRows;

  const siteStatusCounts = getSiteStatusCounts(siteStatusSummary);
  return baseRows.map((row, index) =>
    index < siteStatusCounts.length
      ? {
          ...row,
          value: formatCountLike(row.value, siteStatusCounts[index] ?? 0),
        }
      : { ...row },
  );
}

export function buildAdminOverviewPolicyOverlay(
  base: SafetyAdminOverviewResponse,
): OverviewPolicyOverlay {
  const siteStatusSummary = cloneSiteStatusSummary(base.siteStatusSummary);

  return {
    siteStatusSummary,
  };
}

export function mergeAdminOverviewPolicyOverlay(
  base: SafetyAdminOverviewResponse,
  overlay: OverviewPolicyOverlay,
): SafetyAdminOverviewResponse {
  return {
    ...base,
    metricCards: mergeMetricCards(base.metricCards, overlay.siteStatusSummary),
    siteStatusSummary: overlay.siteStatusSummary,
    summaryRows: mergeSummaryRows(base.summaryRows, overlay.siteStatusSummary),
  };
}
