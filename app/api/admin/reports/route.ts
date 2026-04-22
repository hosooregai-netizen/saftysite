import { NextResponse } from 'next/server';
import { buildControllerReportRows } from '@/lib/admin/controllerReports';
import { asMapperRecord } from '@/lib/safetyApiMappers/utils';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import {
  fetchAdminReports,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { readOrCreateAdminReportsRouteResponse } from '@/server/admin/reportsRouteCache';
import type { ControllerReportRow, SafetyAdminReportsResponse } from '@/types/admin';
import type { SafetyReportListItem } from '@/types/backend';
import legacyReportOriginalPdfs from '@/data/legacy-admin-report-original-pdfs.json';

export const runtime = 'nodejs';

type LegacyReportPdfEntry = {
  archivePath: string;
  fileName: string;
  legacyReportId: string;
  visitDate: string;
};

const legacyPdfManifest = new Map(
  Object.entries(legacyReportOriginalPdfs as Record<string, LegacyReportPdfEntry>),
);

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSortDirection(value: string) {
  return value === 'asc' ? 'asc' : 'desc';
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

function getSortValue(row: ControllerReportRow, sortBy: string) {
  switch (sortBy) {
    case 'assigneeName':
      return row.assigneeName;
    case 'headquarterName':
      return row.headquarterName;
    case 'qualityStatus':
      return row.qualityStatus;
    case 'reportTitle':
      return row.reportTitle || row.periodLabel || row.reportKey;
    case 'reportType':
      return row.reportType;
    case 'siteName':
      return row.siteName;
    case 'status':
      return row.status;
    case 'visitDate':
      return row.visitDate;
    case 'updatedAt':
    default:
      return row.updatedAt;
  }
}

function compareReportRows(
  left: ControllerReportRow,
  right: ControllerReportRow,
  sortBy: string,
  sortDir: 'asc' | 'desc',
) {
  const direction = sortDir === 'asc' ? 1 : -1;
  const leftValue = normalizeText(getSortValue(left, sortBy));
  const rightValue = normalizeText(getSortValue(right, sortBy));
  const primaryCompare = leftValue.localeCompare(rightValue, 'ko');
  if (primaryCompare !== 0) {
    return primaryCompare * direction;
  }

  return left.reportKey.localeCompare(right.reportKey, 'ko') * direction;
}

function matchesReportRow(
  row: ControllerReportRow,
  filters: {
    assigneeUserId: string;
    dateFrom: string;
    dateTo: string;
    dispatchStatus: string;
    headquarterId: string;
    qualityStatus: string;
    query: string;
    reportType: string;
    siteId: string;
    status: string;
  },
) {
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

async function buildReportsRoutePayload(
  token: string,
  request: Request,
): Promise<SafetyAdminReportsResponse> {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '100')));
  const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
  const sortBy = normalizeText(url.searchParams.get('sort_by') || 'updatedAt') || 'updatedAt';
  const sortDir = normalizeSortDirection(normalizeText(url.searchParams.get('sort_dir') || 'desc'));
  const filters = {
    assigneeUserId: normalizeText(url.searchParams.get('assignee_user_id')),
    dateFrom: normalizeText(url.searchParams.get('date_from')),
    dateTo: normalizeText(url.searchParams.get('date_to')),
    dispatchStatus: normalizeText(url.searchParams.get('dispatch_status')),
    headquarterId: normalizeText(url.searchParams.get('headquarter_id')),
    qualityStatus: normalizeText(url.searchParams.get('quality_status')),
    query: normalizeText(url.searchParams.get('query')).toLowerCase(),
    reportType: normalizeText(url.searchParams.get('report_type')),
    siteId: normalizeText(url.searchParams.get('site_id')),
    status: normalizeText(url.searchParams.get('status')),
  };

  const [directorySnapshot, reports] = await Promise.all([
    getAdminDirectorySnapshot(token, request),
    fetchAdminReports(token, request),
  ]);
  const reportsWithOriginalPdf = reports.map((report) =>
    mergeLegacyOriginalPdfMeta(report, legacyPdfManifest.get(report.report_key) ?? null),
  );
  const rows = buildControllerReportRows(
    reportsWithOriginalPdf,
    directorySnapshot.data.sites,
    directorySnapshot.data.users,
  )
    .filter((row) => matchesReportRow(row, filters))
    .sort((left, right) => compareReportRows(left, right, sortBy, sortDir));

  return {
    limit,
    offset,
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
  };
}

function mergeLegacyOriginalPdfMeta(
  report: SafetyReportListItem,
  manifestEntry: LegacyReportPdfEntry | null,
): SafetyReportListItem {
  if (!manifestEntry) {
    return report;
  }

  const meta = asMapperRecord(report.meta);
  const archivePath =
    normalizeText(meta.original_pdf_archive_path) ||
    normalizeText(meta.originalPdfArchivePath) ||
    manifestEntry.archivePath;
  const fileName =
    normalizeText(meta.original_pdf_filename) ||
    normalizeText(meta.originalPdfFilename) ||
    manifestEntry.fileName;

  return {
    ...report,
    meta: {
      ...meta,
      originalPdfArchivePath: archivePath,
      originalPdfDownloadPath:
        normalizeText(meta.originalPdfDownloadPath) ||
        normalizeText(meta.original_pdf_download_path) ||
        `/api/admin/reports/${encodeURIComponent(report.report_key)}/original-pdf`,
      originalPdfFilename: fileName,
      original_pdf_archive_path: archivePath,
      original_pdf_available: true,
      original_pdf_download_path:
        normalizeText(meta.original_pdf_download_path) ||
        normalizeText(meta.originalPdfDownloadPath) ||
        `/api/admin/reports/${encodeURIComponent(report.report_key)}/original-pdf`,
      original_pdf_filename: fileName,
    },
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const payload = await readOrCreateAdminReportsRouteResponse(
      request,
      () => buildReportsRoutePayload(token, request),
    );
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '보고서 목록을 불러오지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
