import { getAdminSectionHref } from '@/lib/admin';
import { normalizeSiteLifecycleStatus } from '@/lib/admin/lifecycleStatus';
import type {
  AdminOverviewMetricCard,
  SafetyAdminQuarterlyMaterialSummary,
  SafetyAdminSiteStatusSummary,
  SafetyAdminUnsentReportRow,
} from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';

const MANAGED_SITE_STATUSES = ['active', 'paused', 'planned'] as const;

export function buildSiteStatusSummary(
  data: ControllerDashboardData,
  scopedSites: ControllerDashboardData['sites'] = data.sites,
): SafetyAdminSiteStatusSummary {
  const managedSites = scopedSites.filter((site) =>
    MANAGED_SITE_STATUSES.includes(
      normalizeSiteLifecycleStatus(site) as (typeof MANAGED_SITE_STATUSES)[number],
    ),
  );

  return {
    entries: [
      {
        count: managedSites.filter((site) => normalizeSiteLifecycleStatus(site) === 'active').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'active',
        label: '진행중',
      },
      {
        count: managedSites.filter((site) => normalizeSiteLifecycleStatus(site) === 'paused').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'paused' }),
        key: 'paused',
        label: '중지',
      },
      {
        count: managedSites.filter((site) => normalizeSiteLifecycleStatus(site) === 'planned').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'planned' }),
        key: 'planned',
        label: '미착수',
      },
    ],
    totalSiteCount: managedSites.length,
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
      meta: 'planned / active / paused 기준',
      tone: 'default',
      value: `${siteStatusSummary.totalSiteCount}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '진행중',
      meta: '운영 중인 현장',
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
      href: getAdminSectionHref('headquarters', { siteStatus: 'planned' }),
      label: '미착수',
      meta: '준비 중인 현장',
      tone: 'default',
      value: `${siteStatusByKey.planned ?? 0}건`,
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
