import { getAdminSectionHref } from '@/lib/admin';
import { normalizeSiteLifecycleStatus } from '@/lib/admin/lifecycleStatus';
import type { SafetyAdminOverviewResponse } from '@/types/admin';
import type { SafetySite } from '@/types/backend';

type OverviewPolicyOverlay = Pick<
  SafetyAdminOverviewResponse,
  'endingSoonRows' | 'endingSoonSummary' | 'siteStatusSummary'
>;

interface OverviewPolicyOverlayOptions {
  sites?: SafetySite[];
  today?: Date;
}

interface EndingSoonCandidate {
  daysUntilEnd: number;
  endDate: string;
  endDateSource: SafetyAdminOverviewResponse['endingSoonRows'][number]['endDateSource'];
  site: SafetySite;
}

const ENDING_SOON_DAYS = 14;

function cloneSiteStatusSummary(
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
): SafetyAdminOverviewResponse['siteStatusSummary'] {
  return {
    entries: siteStatusSummary.entries.map((entry) => ({ ...entry })),
    totalSiteCount: siteStatusSummary.totalSiteCount,
  };
}

function cloneEndingSoonRows(
  rows: SafetyAdminOverviewResponse['endingSoonRows'],
): SafetyAdminOverviewResponse['endingSoonRows'] {
  return rows.map((row) => ({ ...row }));
}

function cloneEndingSoonSummary(
  summary: SafetyAdminOverviewResponse['endingSoonSummary'],
): SafetyAdminOverviewResponse['endingSoonSummary'] {
  return {
    entries: summary.entries.map((entry) => ({ ...entry })),
    totalSiteCount: summary.totalSiteCount,
  };
}

function formatCountLike(previousValue: string, count: number) {
  const suffix = previousValue.trim().replace(/^[\d,.\s]+/, '');
  return `${count.toLocaleString('ko-KR')}${suffix || '건'}`;
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;
  const parsed = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  parsed.setHours(0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDate(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDaysUntil(today: Date, endDate: string) {
  const parsedEndDate = parseDateValue(endDate);
  if (!parsedEndDate) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((startOfDate(parsedEndDate).getTime() - startOfDate(today).getTime()) / msPerDay);
}

function resolveSiteEndingDate(site: SafetySite): Pick<EndingSoonCandidate, 'endDate' | 'endDateSource'> | null {
  const contractEndDate = typeof site.contract_end_date === 'string' ? site.contract_end_date.trim() : '';
  if (contractEndDate) {
    return { endDate: contractEndDate, endDateSource: 'contract_end_date' };
  }
  const projectEndDate = typeof site.project_end_date === 'string' ? site.project_end_date.trim() : '';
  if (projectEndDate) {
    return { endDate: projectEndDate, endDateSource: 'project_end_date' };
  }
  return null;
}

function buildEndingSoonCandidates(sites: SafetySite[], today: Date): EndingSoonCandidate[] {
  return sites
    .flatMap((site) => {
      if (normalizeSiteLifecycleStatus(site, today) !== 'active') return [];
      const endingDate = resolveSiteEndingDate(site);
      if (!endingDate) return [];
      const daysUntilEnd = getDaysUntil(today, endingDate.endDate);
      if (daysUntilEnd == null || daysUntilEnd < 0 || daysUntilEnd > ENDING_SOON_DAYS) return [];
      return [{ ...endingDate, daysUntilEnd, site }];
    })
    .sort((left, right) => left.daysUntilEnd - right.daysUntilEnd || left.site.site_name.localeCompare(right.site.site_name, 'ko'));
}

function buildEndingSoonRows(
  sites: SafetySite[],
  today: Date,
): SafetyAdminOverviewResponse['endingSoonRows'] {
  return buildEndingSoonCandidates(sites, today).map((candidate) => ({
    deadlineLabel: candidate.daysUntilEnd === 0 ? '오늘' : `D-${candidate.daysUntilEnd}`,
    daysUntilEnd: candidate.daysUntilEnd,
    endDate: formatDateValue(parseDateValue(candidate.endDate) ?? today),
    endDateSource: candidate.endDateSource,
    headquarterName: candidate.site.headquarter_detail?.name || candidate.site.headquarter?.name || '-',
    href: getAdminSectionHref('headquarters', {
      headquarterId: candidate.site.headquarter_id,
      siteId: candidate.site.id,
    }),
    siteId: candidate.site.id,
    siteName: candidate.site.site_name,
  }));
}

function buildEndingSoonSummary(
  endingSoonRows: SafetyAdminOverviewResponse['endingSoonRows'],
): SafetyAdminOverviewResponse['endingSoonSummary'] {
  return {
    entries: [
      {
        count: endingSoonRows.filter((row) => row.daysUntilEnd <= 7).length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'd_0_7',
        label: 'D-0~7',
      },
      {
        count: endingSoonRows.filter((row) => row.daysUntilEnd >= 8 && row.daysUntilEnd <= 14).length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'd_8_14',
        label: 'D-8~14',
      },
    ],
    totalSiteCount: endingSoonRows.length,
  };
}

function buildSiteStatusSummaryFromSites(
  sites: SafetySite[],
  endingSoonRows: SafetyAdminOverviewResponse['endingSoonRows'],
  today: Date,
): SafetyAdminOverviewResponse['siteStatusSummary'] {
  const endingSoonSiteIds = new Set(endingSoonRows.map((row) => row.siteId));
  const activeCount = sites.filter(
    (site) => normalizeSiteLifecycleStatus(site, today) === 'active' && !endingSoonSiteIds.has(site.id),
  ).length;
  const pausedCount = sites.filter((site) => normalizeSiteLifecycleStatus(site, today) === 'paused').length;

  return {
    entries: [
      {
        count: activeCount,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'active',
        label: '진행중',
      },
      {
        count: pausedCount,
        href: getAdminSectionHref('headquarters', { siteStatus: 'paused' }),
        key: 'paused',
        label: '중지',
      },
      {
        count: endingSoonRows.length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'ending_soon',
        label: '종료예정',
      },
    ],
    totalSiteCount: activeCount + pausedCount + endingSoonRows.length,
  };
}

function getSiteStatusMetricTemplate(
  index: number,
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
) {
  if (index === 0) {
    return {
      href: getAdminSectionHref('headquarters', { siteStatus: 'all' }),
      label: '관리 중인 현장 수',
      meta: '진행중 / 중지 / 종료예정 기준',
      value: siteStatusSummary.totalSiteCount,
    };
  }

  const entry = siteStatusSummary.entries[index - 1];
  if (!entry) return null;
  return {
    href: entry.href,
    label: entry.label,
    meta:
      entry.key === 'active'
        ? '기간 중인 현장'
        : entry.key === 'paused'
          ? '일시 중지 현장'
          : '14일 이내 종료 예정',
    value: entry.count,
  };
}

function mergeMetricCards(
  baseCards: SafetyAdminOverviewResponse['metricCards'],
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
): SafetyAdminOverviewResponse['metricCards'] {
  if (baseCards.length === 0) return baseCards;

  return baseCards.map((card, index) => {
    if (index >= 4) return { ...card };
    const template = getSiteStatusMetricTemplate(index, siteStatusSummary);
    return template
      ? {
          ...card,
          href: template.href,
          label: template.label,
          meta: template.meta,
          tone: 'default' as const,
          value: formatCountLike(card.value, template.value),
        }
      : { ...card };
  });
}

function mergeSummaryRows(
  baseRows: SafetyAdminOverviewResponse['summaryRows'],
  siteStatusSummary: SafetyAdminOverviewResponse['siteStatusSummary'],
) {
  if (baseRows.length === 0) return baseRows;

  return baseRows.map((row, index) => {
    if (index >= 4) return { ...row };
    const template = getSiteStatusMetricTemplate(index, siteStatusSummary);
    return template
      ? {
          ...row,
          label: template.label,
          meta: template.meta,
          value: formatCountLike(row.value, template.value),
        }
      : { ...row };
  });
}

export function buildAdminOverviewPolicyOverlay(
  base: SafetyAdminOverviewResponse,
  options: OverviewPolicyOverlayOptions = {},
): OverviewPolicyOverlay {
  const today = options.today ?? new Date();
  const endingSoonRows = options.sites
    ? buildEndingSoonRows(options.sites, today)
    : cloneEndingSoonRows(base.endingSoonRows);
  const endingSoonSummary = options.sites
    ? buildEndingSoonSummary(endingSoonRows)
    : cloneEndingSoonSummary(base.endingSoonSummary);
  const siteStatusSummary = options.sites
    ? buildSiteStatusSummaryFromSites(options.sites, endingSoonRows, today)
    : cloneSiteStatusSummary(base.siteStatusSummary);

  return {
    endingSoonRows,
    endingSoonSummary,
    siteStatusSummary,
  };
}

export function mergeAdminOverviewPolicyOverlay(
  base: SafetyAdminOverviewResponse,
  overlay: OverviewPolicyOverlay,
): SafetyAdminOverviewResponse {
  return {
    ...base,
    endingSoonRows: overlay.endingSoonRows,
    endingSoonSummary: overlay.endingSoonSummary,
    metricCards: mergeMetricCards(base.metricCards, overlay.siteStatusSummary),
    siteStatusSummary: overlay.siteStatusSummary,
    summaryRows: mergeSummaryRows(base.summaryRows, overlay.siteStatusSummary),
  };
}
