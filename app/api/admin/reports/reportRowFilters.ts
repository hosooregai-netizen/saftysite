import { isMailAttachmentReady } from '@/lib/mail/reportAttachmentEligibility';
import type { ControllerReportRow } from '@/types/admin';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildReportQueryText(row: ControllerReportRow) {
  return [
    row.reportKey,
    row.reportTitle,
    row.periodLabel,
    row.siteName,
    row.headquarterName,
    row.assigneeName,
  ]
    .join(' ')
    .toLowerCase();
}

export type ReportRowFilters = {
  assigneeUserId: string;
  dateFrom: string;
  dateTo: string;
  dispatchStatus: string;
  headquarterId: string;
  mailAttachableOnly: boolean;
  qualityStatus: string;
  query: string;
  reportKey: string;
  reportType: string;
  siteId: string;
  status: string;
};

export function matchesReportRow(row: ControllerReportRow, filters: ReportRowFilters) {
  if (filters.reportKey) {
    return row.reportKey === filters.reportKey;
  }
  if (filters.headquarterId && row.headquarterId !== filters.headquarterId) {
    return false;
  }
  if (filters.siteId && row.siteId !== filters.siteId) {
    return false;
  }
  if (filters.assigneeUserId && row.assigneeUserId !== filters.assigneeUserId) {
    return false;
  }
  if (filters.qualityStatus && row.qualityStatus !== filters.qualityStatus) {
    return false;
  }
  if (filters.dispatchStatus && row.dispatchStatus !== filters.dispatchStatus) {
    return false;
  }
  if (filters.reportType && row.reportType !== filters.reportType) {
    return false;
  }
  if (filters.status && row.status !== filters.status && row.workflowStatus !== filters.status) {
    return false;
  }
  if (
    filters.mailAttachableOnly &&
    !isMailAttachmentReady({
      originalPdfAvailable: Boolean(row.originalPdfAvailable),
      reportKey: row.reportKey,
      workflowStatus: row.workflowStatus || row.status,
    })
  ) {
    return false;
  }
  if (filters.dateFrom && row.visitDate && row.visitDate < filters.dateFrom) {
    return false;
  }
  if (filters.dateTo && row.visitDate && row.visitDate > filters.dateTo) {
    return false;
  }
  if (filters.dateFrom && !row.visitDate) {
    return false;
  }
  if (filters.query && !buildReportQueryText(row).includes(filters.query)) {
    return false;
  }
  return true;
}
