import { NextResponse } from 'next/server';
import { isVisibleReport } from '@/lib/admin/lifecycleStatus';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import {
  buildLegacyAdminReportRows,
  getLegacyAdminReportsSnapshot,
} from '@/server/admin/legacyAdminReportsSnapshot';
import { alignAdminReportRowsWithLegacySites } from '@/server/admin/legacyReportAlignment';
import {
  fetchAdminReportsViewServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { isMailAttachmentReady } from '@/lib/mail/reportAttachmentEligibility';
import {
  readOrCreateAdminReportsRouteResponse,
  readOrCreateAdminReportsRowsSnapshot,
} from '@/server/admin/reportsRouteCache';
import { mapBackendAdminReportRow } from '@/server/admin/upstreamMappers';
import type { ControllerReportRow, SafetyAdminReportsResponse } from '@/types/admin';
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
    mailAttachableOnly: boolean;
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
  if (
    filters.mailAttachableOnly &&
    !isMailAttachmentReady({
      originalPdfAvailable: Boolean(row.originalPdfAvailable),
      reportKey: row.reportKey,
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

async function buildReportsRoutePayload(
  token: string,
  request: Request,
): Promise<SafetyAdminReportsResponse> {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '20')));
  const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
  const sortBy = normalizeText(url.searchParams.get('sort_by') || 'updatedAt') || 'updatedAt';
  const sortDir = normalizeSortDirection(normalizeText(url.searchParams.get('sort_dir') || 'desc'));
  const filters = {
    assigneeUserId: normalizeText(url.searchParams.get('assignee_user_id')),
    dateFrom: normalizeText(url.searchParams.get('date_from')),
    dateTo: normalizeText(url.searchParams.get('date_to')),
    dispatchStatus: normalizeText(url.searchParams.get('dispatch_status')),
    headquarterId: normalizeText(url.searchParams.get('headquarter_id')),
    mailAttachableOnly: url.searchParams.get('mail_attachable_only') === 'true',
    qualityStatus: normalizeText(url.searchParams.get('quality_status')),
    query: normalizeText(url.searchParams.get('query')).toLowerCase(),
    reportType: normalizeText(url.searchParams.get('report_type')),
    siteId: normalizeText(url.searchParams.get('site_id')),
    status: normalizeText(url.searchParams.get('status')),
  };

  const rows = (
    await readOrCreateAdminReportsRowsSnapshot(request, () => buildReportsRowsSnapshot(token, request))
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

async function buildReportsRowsSnapshot(token: string, request: Request) {
  const [directorySnapshot, legacyReports, currentRows] = await Promise.all([
    getAdminDirectorySnapshot(token, request),
    getLegacyAdminReportsSnapshot(),
    fetchCurrentAdminReportRows(token, request),
  ]);
  const alignedCurrentRows = alignAdminReportRowsWithLegacySites(currentRows, {
    legacyRows: legacyReports,
    sites: directorySnapshot.data.sites,
  });
  const currentRowKeys = new Set(alignedCurrentRows.map((row) => row.reportKey));
  const legacyRows = buildLegacyAdminReportRows({
    legacyRows: legacyReports,
    pdfManifest: legacyPdfManifest,
    sites: directorySnapshot.data.sites,
    users: directorySnapshot.data.users,
  }).filter((row) => !currentRowKeys.has(row.reportKey));

  return [...alignedCurrentRows, ...legacyRows];
}

async function fetchCurrentAdminReportRows(token: string, request: Request) {
  const rows: ControllerReportRow[] = [];
  let offset = 0;

  while (true) {
    const response = await fetchAdminReportsViewServer(
      token,
      {
        limit: 200,
        offset,
      },
      request,
    );
    const mappedRows = response.rows
      .map((row) => applyLegacyOriginalPdfMeta(mapBackendAdminReportRow(row)))
      .filter((row) => row.reportKey)
      .filter((row) => isVisibleReport(row));
    rows.push(...mappedRows);

    offset += response.rows.length;
    if (offset >= response.total || response.rows.length < response.limit) {
      return rows;
    }
  }
}

function applyLegacyOriginalPdfMeta(row: ControllerReportRow): ControllerReportRow {
  const manifestEntry = legacyPdfManifest.get(row.reportKey) ?? null;
  if (!manifestEntry) {
    return row;
  }

  return {
    ...row,
    originalPdfAvailable: true,
    originalPdfDownloadPath:
      row.originalPdfDownloadPath ||
      `/api/admin/reports/${encodeURIComponent(row.reportKey)}/original-pdf`,
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
