import type { ControllerReportRow } from '@/types/admin';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { MailboxReportOption } from './mailboxPanelTypes';

export function normalizeReportPickerText(value: unknown) {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()
    : '';
}

function normalizeCompanyText(value: unknown) {
  return normalizeReportPickerText(value)
    .replace(/\(주\)|㈜|주식회사|\(유\)|유한회사/g, '')
    .replace(/[()\s]/g, '');
}

function isLegacyReportKey(value: string) {
  return normalizeReportPickerText(value).startsWith('legacy:');
}

function getSiteHeadquarterName(site: SafetySite | null | undefined) {
  return (
    normalizeReportPickerText(site?.headquarter_detail?.name) ||
    normalizeReportPickerText(site?.headquarter?.name)
  );
}

function doesTextMatchSite(
  input: {
    headquarterName: string;
    siteName: string;
  },
  site: SafetySite | null | undefined,
) {
  if (!site) return false;
  const optionSiteName = normalizeReportPickerText(input.siteName);
  const siteName = normalizeReportPickerText(site.site_name);
  if (!optionSiteName || !siteName || optionSiteName !== siteName) {
    return false;
  }

  const optionHeadquarterName = normalizeCompanyText(input.headquarterName);
  const siteHeadquarterName = normalizeCompanyText(getSiteHeadquarterName(site));
  return !optionHeadquarterName || !siteHeadquarterName || optionHeadquarterName === siteHeadquarterName;
}

export function doesReportOptionMatchSiteFilter(
  option: Pick<MailboxReportOption, 'headquarterName' | 'reportKey' | 'siteId' | 'siteName'>,
  siteFilter: string,
  selectedSite: SafetySite | null | undefined,
) {
  if (!siteFilter) return true;
  if (option.siteId === siteFilter) return true;
  return isLegacyReportKey(option.reportKey) && doesTextMatchSite(option, selectedSite);
}

export function mapSafetyReportListItemToMailboxReportOption(
  item: SafetyReportListItem,
  adminSiteById: Map<string, SafetySite>,
): MailboxReportOption {
  const matchedSite = adminSiteById.get(item.site_id);
  return {
    headquarterId: item.headquarter_id || '',
    headquarterName:
      matchedSite?.headquarter_detail?.name || matchedSite?.headquarter?.name || '',
    recipientEmail: matchedSite?.site_contact_email || '',
    documentKind: item.document_kind ?? null,
    meta: item.meta,
    originalPdfAvailable: Boolean(item.originalPdfAvailable),
    originalPdfDownloadPath: item.originalPdfDownloadPath || '',
    reportKey: item.report_key,
    reportType: item.report_type ?? null,
    reportTitle: item.report_title,
    siteId: item.site_id,
    siteName: matchedSite?.site_name || item.site_id,
    updatedAt: item.updated_at,
    visitDate: item.visit_date,
  };
}

export function mapAdminReportRowToMailboxReportOption(
  row: ControllerReportRow,
  adminSiteById: Map<string, SafetySite>,
  selectedSite: SafetySite | null | undefined = null,
): MailboxReportOption {
  const matchedSiteById = adminSiteById.get(row.siteId);
  const matchedSelectedSite =
    isLegacyReportKey(row.reportKey) && doesTextMatchSite(row, selectedSite)
      ? selectedSite
      : null;
  const matchedSite = matchedSiteById || matchedSelectedSite || null;

  return {
    headquarterId: row.headquarterId || matchedSite?.headquarter_id || '',
    headquarterName:
      row.headquarterName ||
      matchedSite?.headquarter_detail?.name ||
      matchedSite?.headquarter?.name ||
      '',
    recipientEmail: matchedSite?.site_contact_email || '',
    documentKind: null,
    meta: { reportKind: row.reportType },
    originalPdfAvailable: Boolean(row.originalPdfAvailable),
    originalPdfDownloadPath: row.originalPdfDownloadPath || '',
    reportKey: row.reportKey,
    reportType: row.reportType,
    reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
    siteId: row.siteId || matchedSelectedSite?.id || '',
    siteName: row.siteName || matchedSite?.site_name || row.siteId,
    updatedAt: row.updatedAt || null,
    visitDate: row.visitDate || null,
  };
}

export function mergeMailboxReportOptions(options: MailboxReportOption[]) {
  const byReportKey = new Map<string, MailboxReportOption>();
  options.forEach((option) => {
    if (!option.reportKey) return;
    const existing = byReportKey.get(option.reportKey);
    if (!existing) {
      byReportKey.set(option.reportKey, option);
      return;
    }

    byReportKey.set(option.reportKey, {
      ...existing,
      ...option,
      headquarterId: option.headquarterId || existing.headquarterId,
      headquarterName: option.headquarterName || existing.headquarterName,
      originalPdfAvailable: option.originalPdfAvailable || existing.originalPdfAvailable,
      originalPdfDownloadPath: option.originalPdfDownloadPath || existing.originalPdfDownloadPath,
      recipientEmail: option.recipientEmail || existing.recipientEmail,
      siteId: option.siteId || existing.siteId,
      siteName: option.siteName || existing.siteName,
      updatedAt: option.updatedAt || existing.updatedAt,
      visitDate: option.visitDate || existing.visitDate,
    });
  });
  return Array.from(byReportKey.values());
}
