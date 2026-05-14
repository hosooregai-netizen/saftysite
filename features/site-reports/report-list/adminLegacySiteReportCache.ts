'use client';

import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import { fetchAdminReports } from '@/lib/admin/apiClient';
import type { ControllerReportRow, SafetyAdminReportsResponse } from '@/types/admin';
import type { SafetyReportStatus } from '@/types/backend';
import type { InspectionReportListItem } from '@/types/inspectionSession';

export const ADMIN_LEGACY_SITE_REPORT_CACHE_KEY_PREFIX = 'site-report-legacy:';
const ADMIN_LEGACY_SITE_REPORT_PAGE_LIMIT = 200;

export interface AdminLegacySiteReportRequestToken {
  generation: number;
  siteId: string;
}

export interface AdminLegacySiteReportCacheReadResult {
  hasCache: boolean;
  isFresh: boolean;
  items: InspectionReportListItem[];
  savedAt: number | null;
}

type AdminLegacySiteReportRequestRef = {
  current: AdminLegacySiteReportRequestToken | null;
};

type AdminReportsFetcher = (
  input: Parameters<typeof fetchAdminReports>[0],
) => Promise<SafetyAdminReportsResponse>;

export function buildAdminLegacySiteReportCacheKey(siteId: string) {
  return `${ADMIN_LEGACY_SITE_REPORT_CACHE_KEY_PREFIX}${siteId}`;
}

export function beginAdminLegacySiteReportRequest(
  ref: AdminLegacySiteReportRequestRef,
  siteId: string,
): AdminLegacySiteReportRequestToken {
  const generation = (ref.current?.generation ?? 0) + 1;
  const token = { generation, siteId };
  ref.current = token;
  return token;
}

export function isCurrentAdminLegacySiteReportRequest(
  ref: AdminLegacySiteReportRequestRef,
  token: AdminLegacySiteReportRequestToken,
) {
  return (
    ref.current?.generation === token.generation &&
    ref.current.siteId === token.siteId
  );
}

export function readAdminLegacySiteReportCache(
  ownerId: string | null | undefined,
  siteId: string | null | undefined,
): AdminLegacySiteReportCacheReadResult {
  if (!ownerId || !siteId) {
    return { hasCache: false, isFresh: false, items: [], savedAt: null };
  }

  const cached = readAdminSessionCache<InspectionReportListItem[]>(
    ownerId,
    buildAdminLegacySiteReportCacheKey(siteId),
  );
  const items = Array.isArray(cached.value) ? cached.value : [];

  return {
    hasCache: Array.isArray(cached.value),
    isFresh: cached.isFresh,
    items: [...items],
    savedAt: cached.savedAt,
  };
}

export function writeAdminLegacySiteReportCache(
  ownerId: string | null | undefined,
  siteId: string | null | undefined,
  items: InspectionReportListItem[],
) {
  if (!ownerId || !siteId) return;

  writeAdminSessionCache(
    ownerId,
    buildAdminLegacySiteReportCacheKey(siteId),
    [...items],
  );
}

export function upsertAdminLegacySiteReportCacheItem(
  ownerId: string | null | undefined,
  siteId: string | null | undefined,
  item: InspectionReportListItem,
) {
  if (!ownerId || !siteId) return;

  const cached = readAdminLegacySiteReportCache(ownerId, siteId);
  const replaced = cached.items.some((current) => current.reportKey === item.reportKey);
  const nextItems = replaced
    ? cached.items.map((current) => (current.reportKey === item.reportKey ? item : current))
    : [...cached.items, item];

  writeAdminLegacySiteReportCache(ownerId, siteId, nextItems);
}

function extractVisitRound(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d{1,3})/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizePositiveRound(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : null;
}

function isLegacyTechnicalGuidanceRow(row: ControllerReportRow) {
  return row.reportType === 'technical_guidance' && row.reportKey.startsWith('legacy:');
}

function isDispatchCompleted(row: ControllerReportRow) {
  return (
    row.dispatch?.dispatchStatus === 'sent' ||
    row.dispatch?.dispatchStatus === 'manual_checked'
  );
}

function normalizeLegacyReportStatus(status: string): SafetyReportStatus {
  switch (status) {
    case 'submitted':
    case 'published':
    case 'archived':
      return status;
    case 'draft':
    default:
      return 'draft';
  }
}

export function mapAdminLegacyRowToReportItem(
  row: ControllerReportRow,
): InspectionReportListItem {
  const parsedRouteRound =
    typeof row.routeParam === 'string' && /^\d+$/.test(row.routeParam)
      ? Number(row.routeParam)
      : null;

  return {
    id: row.reportKey,
    reportKey: row.reportKey,
    reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
    reportOpenHref: `/admin/report-open?reportKey=${encodeURIComponent(row.reportKey)}`,
    reportOpenMode: 'original_pdf',
    readOnly: true,
    originalPdfAvailable: Boolean(row.originalPdfAvailable),
    siteId: row.siteId,
    headquarterId: row.headquarterId || null,
    assignedUserId: row.assigneeUserId || null,
    visitDate: row.visitDate || null,
    visitRound:
      normalizePositiveRound(row.visitRound ?? null) ??
      parsedRouteRound ??
      extractVisitRound(row.reportTitle) ??
      extractVisitRound(row.periodLabel),
    totalRound: null,
    progressRate: row.progressRate,
    status: normalizeLegacyReportStatus(row.status),
    dispatchCompleted: isDispatchCompleted(row),
    dispatchStatus: row.dispatch?.dispatchStatus || (row.dispatchStatus === 'sent' ? 'sent' : null),
    reportIndexSource: 'legacy',
    payloadVersion: 1,
    latestRevisionNo: 0,
    submittedAt: row.status === 'submitted' || row.status === 'published' ? row.updatedAt : null,
    publishedAt: row.status === 'published' ? row.updatedAt : null,
    lastAutosavedAt: row.updatedAt,
    createdAt: row.updatedAt,
    updatedAt: row.updatedAt,
    meta: {
      dispatch: row.dispatch,
      drafter: row.assigneeName,
      originalPdfAvailable: Boolean(row.originalPdfAvailable),
      reportType: row.reportType,
      siteName: row.siteName,
    },
  };
}

export async function fetchAllAdminLegacySiteReportItems(
  siteId: string,
  fetchReports: AdminReportsFetcher = fetchAdminReports,
) {
  const items: InspectionReportListItem[] = [];
  let offset = 0;

  while (true) {
    const response = await fetchReports({
      limit: ADMIN_LEGACY_SITE_REPORT_PAGE_LIMIT,
      offset,
      reportType: 'technical_guidance',
      siteId,
    });
    items.push(
      ...response.rows
        .filter((row) => isLegacyTechnicalGuidanceRow(row))
        .map((row) => mapAdminLegacyRowToReportItem(row)),
    );

    const pageLimit = response.limit || ADMIN_LEGACY_SITE_REPORT_PAGE_LIMIT;
    const nextOffset = offset + response.rows.length;
    const total = response.total ?? nextOffset;

    if (
      response.rows.length === 0 ||
      nextOffset >= total ||
      response.rows.length < pageLimit
    ) {
      return items;
    }

    offset = nextOffset;
  }
}
