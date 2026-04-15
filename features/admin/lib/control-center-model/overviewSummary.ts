import { getAdminSectionHref } from '@/lib/admin';
import type {
  AdminOverviewMetricCard,
  SafetyAdminQuarterlyMaterialSummary,
  SafetyAdminSiteStatusSummary,
  SafetyAdminUnsentReportRow,
} from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';

export function buildSiteStatusSummary(data: ControllerDashboardData): SafetyAdminSiteStatusSummary {
  return {
    entries: [
      {
        count: data.sites.filter((site) => site.status === 'active').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
        key: 'active',
        label: '진행중',
      },
      {
        count: data.sites.filter((site) => site.status === 'planned').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'planned' }),
        key: 'planned',
        label: '미착수',
      },
      {
        count: data.sites.filter((site) => site.status === 'closed').length,
        href: getAdminSectionHref('headquarters', { siteStatus: 'closed' }),
        key: 'closed',
        label: '종료',
      },
    ],
    totalSiteCount: data.sites.length,
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
    totalSiteCount,
  } = args;

  return [
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'all' }),
      label: '전체 현장 수',
      meta: '관리 대상 전체 현장',
      tone: 'default',
      value: `${totalSiteCount}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'active' }),
      label: '진행중',
      meta: '운영중 현장',
      tone: 'default',
      value: `${siteStatusSummary.entries[0]?.count ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'planned' }),
      label: '미착수',
      meta: '준비중 현장',
      tone: 'default',
      value: `${siteStatusSummary.entries[1]?.count ?? 0}건`,
    },
    {
      href: getAdminSectionHref('headquarters', { siteStatus: 'closed' }),
      label: '종료',
      meta: '종료된 현장',
      tone: 'default',
      value: `${siteStatusSummary.entries[2]?.count ?? 0}건`,
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
      meta: '지도 실시일 기준',
      tone: dispatchManagementUnsentReportRows.length > 0 ? 'danger' : 'default',
      value: `${dispatchManagementUnsentReportRows.length}건`,
    },
  ];
}
