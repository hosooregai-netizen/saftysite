import type { ControllerReportRow } from '@/types/admin';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import { doesLegacySiteMatch, normalizeLegacyMatchText } from '@/lib/admin/legacySiteMatching';
import { getPrimarySiteManagerEmail } from '@/lib/siteContacts';
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
  option: Pick<MailboxReportOption, 'originalPdfAvailable' | 'reportKey' | 'workflowStatus'>,
) {
  return getMailAttachmentUnavailableReason({
    originalPdfAvailable: option.originalPdfAvailable,
    reportKey: option.reportKey,
    workflowStatus: option.workflowStatus,
  });
}

export function isReportAttachmentReady(
  option: Pick<MailboxReportOption, 'originalPdfAvailable' | 'reportKey' | 'workflowStatus'>,
) {
  return isMailAttachmentReady({
    originalPdfAvailable: option.originalPdfAvailable,
    reportKey: option.reportKey,
    workflowStatus: option.workflowStatus,
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
  const workflowStatus = item.workflow_status || item.status || null;
  return {
    assigneeName:
      matchedSite?.assigned_user?.name ||
      matchedSite?.assigned_users?.map((user) => user.name).filter(Boolean).join(', ') ||
      '',
    attachmentReady: isReportAttachmentReady({ originalPdfAvailable, reportKey, workflowStatus }),
    attachmentUnavailableReason: getReportAttachmentUnavailableReason({
      originalPdfAvailable,
      reportKey,
      workflowStatus,
    }),
    headquarterId: item.headquarter_id || '',
    headquarterName:
      matchedSite?.headquarter_detail?.name || matchedSite?.headquarter?.name || '',
    recipientEmail: getPrimarySiteManagerEmail(matchedSite),
    documentKind: item.document_kind ?? null,
    meta: item.meta,
    originalPdfAvailable,
    originalPdfDownloadPath: item.originalPdfDownloadPath || '',
    reportKey,
    reportType: item.report_type ?? null,
    reportTitle: item.report_title,
    siteId: item.site_id,
    siteName: matchedSite?.site_name || item.site_id,
    totalRound: item.total_round ?? matchedSite?.total_rounds ?? null,
    updatedAt: item.updated_at,
    visitDate: item.visit_date,
    visitRound: item.visit_round ?? null,
    workflowStatus,
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
  const workflowStatus = row.workflowStatus || row.status || null;

  return {
    assigneeName: row.assigneeName || matchedSite?.assigned_user?.name || '',
    attachmentReady: isReportAttachmentReady({ originalPdfAvailable, reportKey, workflowStatus }),
    attachmentUnavailableReason: getReportAttachmentUnavailableReason({
      originalPdfAvailable,
      reportKey,
      workflowStatus,
    }),
    headquarterId: row.headquarterId || matchedSite?.headquarter_id || '',
    headquarterName:
      row.headquarterName ||
      matchedSite?.headquarter_detail?.name ||
      matchedSite?.headquarter?.name ||
      '',
    recipientEmail: getPrimarySiteManagerEmail(matchedSite),
    documentKind: null,
    meta: { reportKind: row.reportType },
    originalPdfAvailable,
    originalPdfDownloadPath: row.originalPdfDownloadPath || '',
    reportKey,
    reportType: row.reportType,
    reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
    siteId: row.siteId || matchedSelectedSite?.id || '',
    siteName: row.siteName || matchedSite?.site_name || row.siteId,
    totalRound: row.totalRound ?? matchedSite?.total_rounds ?? null,
    updatedAt: row.updatedAt || null,
    visitDate: row.visitDate || null,
    visitRound: row.visitRound ?? null,
    workflowStatus,
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
      assigneeName: option.assigneeName || existing.assigneeName,
      headquarterId: option.headquarterId || existing.headquarterId,
      headquarterName: option.headquarterName || existing.headquarterName,
      originalPdfAvailable: option.originalPdfAvailable || existing.originalPdfAvailable,
      originalPdfDownloadPath: option.originalPdfDownloadPath || existing.originalPdfDownloadPath,
      recipientEmail: option.recipientEmail || existing.recipientEmail,
      siteId: option.siteId || existing.siteId,
      siteName: option.siteName || existing.siteName,
      totalRound: option.totalRound ?? existing.totalRound,
      updatedAt: option.updatedAt || existing.updatedAt,
      visitDate: option.visitDate || existing.visitDate,
      visitRound: option.visitRound ?? existing.visitRound,
      workflowStatus: option.workflowStatus || existing.workflowStatus,
    };
    byReportKey.set(option.reportKey, {
      ...merged,
      attachmentReady: isReportAttachmentReady(merged),
      attachmentUnavailableReason: getReportAttachmentUnavailableReason(merged),
    });
  });
  return Array.from(byReportKey.values());
}

function buildMailboxSemanticIdentity(option: MailboxReportOption) {
  const siteIdentity = normalizeReportPickerText(option.siteId || option.siteName);
  const reportIdentity = normalizeReportPickerText(option.reportTitle);
  const visitIdentity = normalizeReportPickerText(option.visitDate || '');
  const typeIdentity = normalizeReportPickerText(option.reportType || '');
  if (!siteIdentity || !reportIdentity) {
    return '';
  }
  return [siteIdentity, reportIdentity, visitIdentity, typeIdentity].join('::');
}

function choosePreferredMailboxReportOption(
  existing: MailboxReportOption,
  incoming: MailboxReportOption,
) {
  if (incoming.originalPdfAvailable !== existing.originalPdfAvailable) {
    return incoming.originalPdfAvailable ? incoming : existing;
  }
  if (incoming.attachmentReady !== existing.attachmentReady) {
    return incoming.attachmentReady ? incoming : existing;
  }
  if ((incoming.updatedAt || '') !== (existing.updatedAt || '')) {
    return (incoming.updatedAt || '') > (existing.updatedAt || '') ? incoming : existing;
  }
  const incomingIsLegacy = isLegacyReportKey(incoming.reportKey);
  const existingIsLegacy = isLegacyReportKey(existing.reportKey);
  if (incomingIsLegacy !== existingIsLegacy) {
    return incomingIsLegacy ? incoming : existing;
  }
  return incoming.reportKey.localeCompare(existing.reportKey, 'ko') < 0 ? incoming : existing;
}

export function mergeCanonicalMailboxReportOptions(options: MailboxReportOption[]) {
  const mergedByReportKey = mergeMailboxReportOptions(options);
  const byIdentity = new Map<string, MailboxReportOption>();

  mergedByReportKey.forEach((option) => {
    const identity = buildMailboxSemanticIdentity(option);
    if (!identity) {
      byIdentity.set(`${option.reportKey}::${byIdentity.size}`, option);
      return;
    }

    const existing = byIdentity.get(identity);
    if (!existing) {
      byIdentity.set(identity, option);
      return;
    }

    const preferred = choosePreferredMailboxReportOption(existing, option);
    const other = preferred === existing ? option : existing;
    const merged = {
      ...other,
      ...preferred,
      attachmentReady: preferred.attachmentReady || other.attachmentReady,
      attachmentUnavailableReason:
        preferred.attachmentUnavailableReason || other.attachmentUnavailableReason,
      assigneeName: preferred.assigneeName || other.assigneeName,
      headquarterId: preferred.headquarterId || other.headquarterId,
      headquarterName: preferred.headquarterName || other.headquarterName,
      originalPdfAvailable: preferred.originalPdfAvailable || other.originalPdfAvailable,
      originalPdfDownloadPath:
        preferred.originalPdfDownloadPath || other.originalPdfDownloadPath,
      recipientEmail: preferred.recipientEmail || other.recipientEmail,
      siteId: preferred.siteId || other.siteId,
      siteName: preferred.siteName || other.siteName,
      totalRound: preferred.totalRound ?? other.totalRound,
      updatedAt: preferred.updatedAt || other.updatedAt,
      visitDate: preferred.visitDate || other.visitDate,
      visitRound: preferred.visitRound ?? other.visitRound,
      workflowStatus: preferred.workflowStatus || other.workflowStatus,
    };
    byIdentity.set(identity, {
      ...merged,
      attachmentReady: isReportAttachmentReady(merged),
      attachmentUnavailableReason: getReportAttachmentUnavailableReason(merged),
    });
  });

  return Array.from(byIdentity.values());
}
