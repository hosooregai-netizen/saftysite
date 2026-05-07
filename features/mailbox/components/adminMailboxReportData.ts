import { fetchAdminReports, fetchAdminSite } from '@/lib/admin/apiClient';
import { getPrimarySiteManagerEmail } from '@/lib/siteContacts';
import type { ControllerReportRow } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import type { MailboxReportOption } from './mailboxPanelTypes';
import {
  doesReportOptionMatchSiteFilter,
  mergeCanonicalMailboxReportOptions,
  mergeMailboxReportOptions,
  mapAdminReportRowToMailboxReportOption,
} from './mailboxReportPickerHelpers';

const ADMIN_INITIAL_REPORT_LIST_LIMIT = 500;
const ADMIN_MODAL_REPORT_LIST_LIMIT = 20;

type AdminReportsFetcher = typeof fetchAdminReports;
type AdminSiteFetcher = typeof fetchAdminSite;

function mapAdminRowsToMailboxReportOptions(
  rows: ControllerReportRow[],
  adminSiteById: Map<string, SafetySite>,
  reportSiteFilter: string,
  selectedSite: SafetySite | null,
) {
  return mergeCanonicalMailboxReportOptions(
    rows
      .map((row) => mapAdminReportRowToMailboxReportOption(row, adminSiteById, selectedSite))
      .filter((option) => doesReportOptionMatchSiteFilter(option, reportSiteFilter, selectedSite)),
  );
}

async function buildRecipientAwareSiteMap(input: {
  adminSiteById: Map<string, SafetySite>;
  fetchSite?: AdminSiteFetcher;
  hydrateMissingRecipients?: boolean;
  rows: ControllerReportRow[];
}) {
  const nextSiteById = new Map(input.adminSiteById);

  if (input.hydrateMissingRecipients === false) {
    return nextSiteById;
  }

  const fetchSite = input.fetchSite ?? fetchAdminSite;
  const missingRecipientSiteIds = Array.from(
    new Set(
      input.rows
        .map((row) => row.siteId)
        .filter((siteId) => {
          if (!siteId) return false;
          return !getPrimarySiteManagerEmail(nextSiteById.get(siteId));
        }),
    ),
  );

  if (missingRecipientSiteIds.length === 0) {
    return nextSiteById;
  }

  await Promise.all(
    missingRecipientSiteIds.map(async (siteId) => {
      try {
        const site = await fetchSite(siteId);
        if (site?.id) {
          nextSiteById.set(site.id, site);
        }
      } catch (error) {
        console.warn('Failed to load mailbox report recipient site detail', {
          error: error instanceof Error ? error.message : String(error),
          siteId,
        });
      }
    }),
  );

  return nextSiteById;
}

export async function fetchCanonicalAdminMailboxSelectedReport(input: {
  adminSiteById: Map<string, SafetySite>;
  fetchSite?: AdminSiteFetcher;
  fetchReports?: AdminReportsFetcher;
  reportKey: string;
  siteId: string;
}): Promise<MailboxReportOption | null> {
  if (!input.reportKey) {
    return null;
  }

  const selectedSite = input.siteId ? input.adminSiteById.get(input.siteId) ?? null : null;
  const response = await (input.fetchReports ?? fetchAdminReports)({
    limit: 1,
    offset: 0,
    reportKey: input.reportKey,
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });
  const recipientAwareSiteById = await buildRecipientAwareSiteMap({
    adminSiteById: input.adminSiteById,
    fetchSite: input.fetchSite,
    rows: response.rows,
  });
  const options = mapAdminRowsToMailboxReportOptions(
    response.rows,
    recipientAwareSiteById,
    input.siteId,
    input.siteId ? recipientAwareSiteById.get(input.siteId) ?? selectedSite : selectedSite,
  );

  return options[0] ?? null;
}

export async function fetchCanonicalAdminMailboxReportOptions(input: {
  adminSiteById: Map<string, SafetySite>;
  fetchSite?: AdminSiteFetcher;
  fetchReports?: AdminReportsFetcher;
  page: number;
  reportPickerOpen: boolean;
  reportSearch: string;
  reportSiteFilter: string;
}) {
  const selectedSite = input.reportSiteFilter
    ? input.adminSiteById.get(input.reportSiteFilter) ?? null
    : null;
  const fetchReports = input.fetchReports ?? fetchAdminReports;
  const normalizedQuery = input.reportSearch.trim();
  const request = {
    limit: input.reportPickerOpen ? ADMIN_MODAL_REPORT_LIST_LIMIT : ADMIN_INITIAL_REPORT_LIST_LIMIT,
    mailAttachableOnly: true,
    offset: input.reportPickerOpen ? (input.page - 1) * ADMIN_MODAL_REPORT_LIST_LIMIT : 0,
    query: input.reportPickerOpen ? normalizedQuery || undefined : undefined,
    siteId: input.reportSiteFilter || undefined,
    sortBy: 'updatedAt' as const,
    sortDir: 'desc' as const,
  };

  let response = await fetchReports(request);
  let rows = response.rows;

  if (
    input.reportPickerOpen &&
    response.total === 0 &&
    selectedSite?.site_name &&
    input.reportSiteFilter
  ) {
    const fallbackResponse = await fetchReports({
      ...request,
      query: selectedSite.site_name,
      siteId: undefined,
    });
    rows = fallbackResponse.rows;
    response = fallbackResponse;
  }

  const recipientAwareSiteById = await buildRecipientAwareSiteMap({
    adminSiteById: input.adminSiteById,
    fetchSite: input.fetchSite,
    hydrateMissingRecipients: input.reportPickerOpen,
    rows,
  });
  const recipientAwareSelectedSite = input.reportSiteFilter
    ? recipientAwareSiteById.get(input.reportSiteFilter) ?? selectedSite
    : selectedSite;

  return {
    options: mapAdminRowsToMailboxReportOptions(
      rows,
      recipientAwareSiteById,
      input.reportSiteFilter,
      recipientAwareSelectedSite,
    ),
    total: input.reportPickerOpen ? response.total : rows.length,
  };
}

export function getAdminMailboxFallbackReportOptions(
  rows: ControllerReportRow[],
  adminSiteById: Map<string, SafetySite>,
) {
  return mergeMailboxReportOptions(
    rows.map((row) => mapAdminReportRowToMailboxReportOption(row, adminSiteById)),
  );
}
