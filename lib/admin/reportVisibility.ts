import type { ControllerReportRow } from '@/types/admin';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import {
  isVisibleHeadquarter,
  isVisibleReport,
  isVisibleSite,
} from '@/lib/admin/lifecycleStatus';

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildVisibleAdminSiteIdSet(
  sites: SafetySite[],
  headquarters: SafetyHeadquarter[],
) {
  const activeHeadquarterIds = new Set(
    headquarters
      .filter((headquarter) => isVisibleHeadquarter(headquarter))
      .map((headquarter) => normalizeText(headquarter.id))
      .filter(Boolean),
  );

  return new Set(
    sites
      .filter((site) => {
        if (!isVisibleSite(site)) {
          return false;
        }

        const headquarterId = normalizeText(site.headquarter_id);
        if (headquarterId && !activeHeadquarterIds.has(headquarterId)) {
          return false;
        }

        return true;
      })
      .map((site) => normalizeText(site.id))
      .filter(Boolean),
  );
}

export function filterVisibleAdminReportListItems(
  reports: SafetyReportListItem[],
  sites: SafetySite[],
  headquarters: SafetyHeadquarter[],
) {
  const visibleSiteIds = buildVisibleAdminSiteIdSet(sites, headquarters);
  return reports.filter(
    (report) =>
      isVisibleReport(report) &&
      visibleSiteIds.has(normalizeText(report.site_id)),
  );
}

export function filterVisibleAdminReportRows(
  rows: ControllerReportRow[],
  sites: SafetySite[],
  headquarters: SafetyHeadquarter[],
) {
  const visibleSiteIds = buildVisibleAdminSiteIdSet(sites, headquarters);
  return rows.filter(
    (row) =>
      isVisibleReport(row) &&
      visibleSiteIds.has(normalizeText(row.siteId)),
  );
}
