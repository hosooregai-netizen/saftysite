import type { ControllerReportRow } from '@/types/admin';

export interface AdminReportQuery {
  assigneeUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  dispatchStatus?: string;
  headquarterId?: string;
  qualityStatus?: string;
  query?: string;
  reportType?: string;
  siteId?: string;
  sortBy?: string;
  sortDir?: string;
  status?: string;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export function sortAdminReportRows(
  rows: ControllerReportRow[],
  sortBy = 'updatedAt',
  sortDir = 'desc',
) {
  const direction = sortDir === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    switch (sortBy) {
      case 'reportType':
        return left.reportType.localeCompare(right.reportType, 'ko') * direction;
      case 'siteName':
        return left.siteName.localeCompare(right.siteName, 'ko') * direction;
      case 'visitDate':
        return (left.visitDate || '').localeCompare(right.visitDate || '') * direction;
      case 'deadlineDate':
        return (left.deadlineDate || '').localeCompare(right.deadlineDate || '') * direction;
      case 'qualityStatus':
        return left.qualityStatus.localeCompare(right.qualityStatus, 'ko') * direction;
      default:
        return left.updatedAt.localeCompare(right.updatedAt) * direction;
    }
  });
}

export function filterAdminReportRows(
  rows: ControllerReportRow[],
  filters: AdminReportQuery,
) {
  const query = normalizeText(filters.query).toLowerCase();
  const dateFrom = normalizeText(filters.dateFrom);
  const dateTo = normalizeText(filters.dateTo);

  return rows.filter((row) => {
    if (filters.reportType && row.reportType !== filters.reportType) return false;
    if (filters.status && row.status !== filters.status && row.lifecycleStatus !== filters.status) {
      return false;
    }
    if (filters.headquarterId && row.headquarterId !== filters.headquarterId) return false;
    if (filters.siteId && row.siteId !== filters.siteId) return false;
    if (filters.assigneeUserId && row.assigneeUserId !== filters.assigneeUserId) return false;
    if (filters.dispatchStatus && row.dispatchStatus !== filters.dispatchStatus) return false;
    if (filters.qualityStatus && row.qualityStatus !== filters.qualityStatus) return false;

    const dateValue = row.visitDate || row.updatedAt.slice(0, 10);
    if (dateFrom && dateValue < dateFrom) return false;
    if (dateTo && dateValue > dateTo) return false;

    if (!query) return true;

    return [
      row.reportTitle,
      row.siteName,
      row.headquarterName,
      row.assigneeName,
      row.periodLabel,
      row.reportMonth,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
}

export function queryAdminReportRows(
  rows: ControllerReportRow[],
  filters: AdminReportQuery,
) {
  return sortAdminReportRows(
    filterAdminReportRows(rows, filters),
    filters.sortBy,
    filters.sortDir,
  );
}
