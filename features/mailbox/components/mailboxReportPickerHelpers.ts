import type { ControllerReportRow } from '@/types/admin';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import { doesLegacySiteMatch, normalizeLegacyMatchText } from '@/lib/admin/legacySiteMatching';
import {
  getMailAttachmentUnavailableReason,
  isLegacyMailAttachmentReport,
  isMailAttachmentReady,
} from '@/lib/mail/reportAttachmentEligibility';
import type { MailboxReportOption } from './mailboxPanelTypes';

export function normalizeReportPickerText(value: unknown) {
  return normalizeLegacyMatchText(value);
}

function isLegacyReportKey(value: string) {
  return isLegacyMailAttachmentReport(normalizeReportPickerText(value));
}

export function getReportAttachmentUnavailableReason(
  option: Pick<MailboxReportOption, 'originalPdfAvailable' | 'reportKey'>,
) {
  return getMailAttachmentUnavailableReason({
    originalPdfAvailable: option.originalPdfAvailable,
    reportKey: option.reportKey,
  });
}

export function isReportAttachmentReady(
  option: Pick<MailboxReportOption, 'originalPdfAvailable' | 'reportKey'>,
) {
  return isMailAttachmentReady({
    originalPdfAvailable: option.originalPdfAvailable,
    reportKey: option.reportKey,
  });
}

export function doesReportOptionMatchSiteFilter(
  option: Pick<MailboxReportOption, 'headquarterName' | 'reportKey' | 'siteId' | 'siteName'>,
  siteFilter: string,
  selectedSite: SafetySite | null | undefined,
) {
  if (!siteFilter) return true;
  if (option.siteId === siteFilter) return true;
  return isLegacyReportKey(option.reportKey) && doesLegacySiteMatch(option, selectedSite);
}

export function mapSafetyReportListItemToMailboxReportOption(
  item: SafetyReportListItem,
  adminSiteById: Map<string, SafetySite>,
): MailboxReportOption {
  const matchedSite = adminSiteById.get(item.site_id);
  const originalPdfAvailable = Boolean(item.originalPdfAvailable);
  const reportKey = item.report_key;
  return {
    attachmentReady: isReportAttachmentReady({ originalPdfAvailable, reportKey }),
    attachmentUnavailableReason: getReportAttachmentUnavailableReason({
      originalPdfAvailable,
      reportKey,
    }),
    headquarterId: item.headquarter_id || '',
    headquarterName:
      matchedSite?.headquarter_detail?.name || matchedSite?.headquarter?.name || '',
    recipientEmail: matchedSite?.site_contact_email || '',
    documentKind: item.document_kind ?? null,
    meta: item.meta,
    originalPdfAvailable,
    originalPdfDownloadPath: item.originalPdfDownloadPath || '',
    reportKey,
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
    isLegacyReportKey(row.reportKey) && doesLegacySiteMatch(row, selectedSite)
      ? selectedSite
      : null;
  const matchedSite = matchedSiteById || matchedSelectedSite || null;
  const originalPdfAvailable = Boolean(row.originalPdfAvailable);
  const reportKey = row.reportKey;

  return {
    attachmentReady: isReportAttachmentReady({ originalPdfAvailable, reportKey }),
    attachmentUnavailableReason: getReportAttachmentUnavailableReason({
      originalPdfAvailable,
      reportKey,
    }),
    headquarterId: row.headquarterId || matchedSite?.headquarter_id || '',
    headquarterName:
      row.headquarterName ||
      matchedSite?.headquarter_detail?.name ||
      matchedSite?.headquarter?.name ||
      '',
    recipientEmail: matchedSite?.site_contact_email || '',
    documentKind: null,
    meta: { reportKind: row.reportType },
    originalPdfAvailable,
    originalPdfDownloadPath: row.originalPdfDownloadPath || '',
    reportKey,
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

    const merged = {
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
    };
    byReportKey.set(option.reportKey, {
      ...merged,
      attachmentReady: isReportAttachmentReady(merged),
      attachmentUnavailableReason: getReportAttachmentUnavailableReason(merged),
    });
  });
  return Array.from(byReportKey.values());
}
