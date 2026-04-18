import type { SafetyAdminOverviewResponse } from '@/types/admin';

type OverviewPolicyOverlay = Pick<SafetyAdminOverviewResponse, 'siteStatusSummary'>;

function roundDurationMs(startedAt: number) {
  return Math.round((performance.now() - startedAt) * 10) / 10;
}

function trimLogContext(context: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

function logOverviewPolicyOverlayStage(
  stage: string,
  startedAt: number,
  context: Record<string, unknown>,
) {
  console.info('admin-overview-policy-overlay-stage', {
    stage,
    duration_ms: roundDurationMs(startedAt),
    ...trimLogContext(context),
  });
}

function summarizeOverlay(overlay: OverviewPolicyOverlay) {
  return {
    site_status_entries: overlay.siteStatusSummary.entries.length,
    total_sites: overlay.siteStatusSummary.totalSiteCount,
  };
}

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
  const fetchStartedAt = performance.now();
  logOverviewPolicyOverlayStage('fetch_overlay_sources', fetchStartedAt, {
    source: 'upstream.site_status_summary',
    strategy: 'site_status_only',
    ...summarizeOverlay({
      siteStatusSummary: base.siteStatusSummary,
    }),
  });

  const buildStartedAt = performance.now();
  const siteStatusSummary = cloneSiteStatusSummary(base.siteStatusSummary);
  logOverviewPolicyOverlayStage('build_admin_overview_model', buildStartedAt, {
    ...summarizeOverlay({
      siteStatusSummary,
    }),
    strategy: 'site_status_only',
  });

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
