import type { ControllerReportRow } from '@/types/admin';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildVisibleAdminSiteIdSet(
  sites: SafetySite[],
  headquarters: SafetyHeadquarter[],
) {
  const activeHeadquarterIds = new Set(
    headquarters
      .filter((headquarter) => headquarter.is_active)
      .map((headquarter) => normalizeText(headquarter.id))
      .filter(Boolean),
  );

  return new Set(
    sites
      .filter((site) => {
        if (normalizeText(site.status) === 'closed') {
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
  return reports.filter((report) => visibleSiteIds.has(normalizeText(report.site_id)));
}

export function filterVisibleAdminReportRows(
  rows: ControllerReportRow[],
  sites: SafetySite[],
  headquarters: SafetyHeadquarter[],
) {
  const visibleSiteIds = buildVisibleAdminSiteIdSet(sites, headquarters);
  return rows.filter((row) => visibleSiteIds.has(normalizeText(row.siteId)));
}
