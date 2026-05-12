import { getAdminSectionHref } from '@/lib/admin';
import { normalizeSiteLifecycleStatus } from '@/lib/admin/lifecycleStatus';
import type {
  AdminOverviewMetricCard,
  SafetyAdminQuarterlyMaterialSummary,
  SafetyAdminSiteStatusSummary,
  SafetyAdminUnsentReportRow,
} from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';

const MANAGED_SITE_STATUSES = ['active', 'paused'] as const;

export function buildSiteStatusSummary(
  data: ControllerDashboardData,
  scopedSites: ControllerDashboardData['sites'] = data.sites,
  today: Date | string = new Date(),
  endingSoonSiteIds: Set<string> = new Set(),
): SafetyAdminSiteStatusSummary {
  const managedSites = scopedSites.filter((site) =>
    MANAGED_SITE_STATUSES.includes(
      normalizeSiteLifecycleStatus(site, today) as (typeof MANAGED_SITE_STATUSES)[number],
    ),
  );
  const activeCount = managedSites.filter(
    (site) => normalizeSiteLifecycleStatus(site, today) === 'active' && !endingSoonSiteIds.has(site.id),
  ).length;
  const pausedCount = managedSites.filter((site) => normalizeSiteLifecycleStatus(site, today) === 'paused').length;
  const endingSoonCount = endingSoonSiteIds.size;

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
        count: endingSoonCount,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'ending_soon',
        label: '종료예정',
      },
    ],
    totalSiteCount: activeCount + pausedCount + endingSoonCount,
  };
}

export function buildOverviewMetricCards(args: {
  dispatchManagementUnsentReportRows: SafetyAdminUnsentReportRow[];
  metricMeta: string;
  quarterlyMaterialSummary: SafetyAdminQuarterlyMaterialSummary;
  siteStatusSummary: SafetyAdminSiteStatusSummary;
  totalSiteCount: number;
}): AdminOverviewMetricCard[] {
  const {
    dispatchManagementUnsentReportRows,
    metricMeta,
    quarterlyMaterialSummary,
    siteStatusSummary,
  } = args;
  const siteStatusByKey = Object.fromEntries(
    siteStatusSummary.entries.map((entry) => [entry.key, entry.count]),
  ) as Record<string, number>;

  return [
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'all' }),
      label: '관리 중인 현장 수',
      meta: '진행중 / 중지 / 종료예정 기준',
      tone: 'default',
      value: `${siteStatusSummary.totalSiteCount}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '진행중',
      meta: '기간 중인 현장',
      tone: 'default',
      value: `${siteStatusByKey.active ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'paused' }),
      label: '중지',
      meta: '일시 중지 현장',
      tone: 'default',
      value: `${siteStatusByKey.paused ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '종료예정',
      meta: '14일 이내 종료 예정',
      tone: 'default',
      value: `${siteStatusByKey.ending_soon ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '교육/계측 자료 부족 현장',
      meta: metricMeta,
      tone: quarterlyMaterialSummary.missingSiteRows.length > 0 ? 'warning' : 'default',
      value: `${quarterlyMaterialSummary.missingSiteRows.length}개 현장`,
    },
    {
      href: getAdminSectionHref('reports'),
      label: '발송 관리 대상',
      meta: '지연/미발송 보고서 기준',
      tone: dispatchManagementUnsentReportRows.length > 0 ? 'danger' : 'default',
      value: `${dispatchManagementUnsentReportRows.length}건`,
    },
  ];
}
