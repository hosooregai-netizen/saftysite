import { buildAdminOverviewModel } from '@/features/admin/lib/buildAdminControlCenterModel';
import { formatDateValue, parseDateValue } from '@/features/admin/lib/control-center-model/dates';
import { normalizeDispatchMeta } from '@/lib/admin/reportMeta';
import type { SafetyAdminOverviewResponse } from '@/types/admin';
import type {
  SafetyBackendAdminReportRow,
  SafetyBackendAdminReportsResponse,
  SafetyReportListItem,
} from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import {
  fetchAdminDirectoryData,
  fetchAdminReportsViewServer,
} from './safetyApiServer';

const OVERVIEW_REPORT_PAGE_LIMIT = 200;
const OVERVIEW_REPORT_TYPES = ['technical_guidance', 'quarterly_report'] as const;

type OverviewPolicyOverlay = Pick<
  SafetyAdminOverviewResponse,
  | 'deadlineSignalSummary'
  | 'metricCards'
  | 'priorityQuarterlyManagementRows'
  | 'siteStatusSummary'
  | 'summaryRows'
  | 'unsentReportRows'
>;

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function startOfYearDate(today: Date) {
  return new Date(today.getFullYear(), 0, 1);
}

function extractQuarterKeyFromText(value: string) {
  const directMatched = value.match(/\b(\d{4})-Q([1-4])\b/i);
  if (directMatched) {
    return `${directMatched[1]}-Q${directMatched[2]}`;
  }

  const labelMatched = value.match(/(\d{4})\s*년\s*([1-4])\s*분기/);
  if (labelMatched) {
    return `${labelMatched[1]}-Q${labelMatched[2]}`;
  }

  return '';
}

function getQuarterKeyForDate(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  return `${parsed.getFullYear()}-Q${Math.floor(parsed.getMonth() / 3) + 1}`;
}

function inferQuarterKey(row: SafetyBackendAdminReportRow) {
  const explicitQuarterKey = extractQuarterKeyFromText(
    [
      normalizeText(row.route_param),
      normalizeText(row.period_label),
      normalizeText(row.report_title),
    ]
      .filter(Boolean)
      .join(' '),
  );

  if (explicitQuarterKey) return explicitQuarterKey;

  return row.report_type === 'quarterly_report'
    ? getQuarterKeyForDate(normalizeText(row.visit_date) || normalizeText(row.updated_at))
    : '';
}

function toSafetyReportListItem(row: SafetyBackendAdminReportRow): SafetyReportListItem {
  const reportKey = normalizeText(row.report_key);
  const dispatch = normalizeDispatchMeta(row.dispatch);
  const deliveryStatus = dispatch?.dispatchStatus || '';
  const quarterKey = inferQuarterKey(row);

  return {
    assigned_user_id: normalizeText(row.assignee_user_id) || null,
    created_at: normalizeText(row.updated_at),
    dispatch,
    dispatch_completed: deliveryStatus === 'sent' || deliveryStatus === 'manual_checked',
    document_kind: null,
    headquarter_id: normalizeText(row.headquarter_id) || null,
    id: reportKey,
    last_autosaved_at: null,
    latest_revision_no: 0,
    lifecycle_status: normalizeText(row.lifecycle_status) as SafetyReportListItem['lifecycle_status'],
    meta: {
      periodLabel: normalizeText(row.period_label),
      quarterKey,
      reportKind: normalizeText(row.report_type),
      reportMonth: normalizeText(row.report_month),
      routeParam: normalizeText(row.route_param),
    },
    payload_version: 0,
    progress_rate:
      typeof row.progress_rate === 'number' && Number.isFinite(row.progress_rate)
        ? row.progress_rate
        : null,
    published_at: null,
    report_key: reportKey,
    report_title: normalizeText(row.report_title),
    report_type: normalizeText(row.report_type) as SafetyReportListItem['report_type'],
    review: null,
    schedule_id: null,
    site_id: normalizeText(row.site_id),
    status: (normalizeText(row.workflow_status) || normalizeText(row.status)) as SafetyReportListItem['status'],
    submitted_at: null,
    total_round: null,
    updated_at: normalizeText(row.updated_at),
    visit_date: normalizeText(row.visit_date) || null,
    visit_round: null,
    workflow_status: (normalizeText(row.workflow_status) ||
      normalizeText(row.status)) as SafetyReportListItem['workflow_status'],
  };
}

async function fetchAllAdminReportRows(
  token: string,
  request: Request | null,
  params: Record<string, string | number>,
) {
  const rows: SafetyBackendAdminReportRow[] = [];
  let offset = 0;

  while (true) {
    const response: SafetyBackendAdminReportsResponse = await fetchAdminReportsViewServer(
      token,
      {
        ...params,
        limit: OVERVIEW_REPORT_PAGE_LIMIT,
        offset,
      },
      request,
    );
    rows.push(...response.rows);

    if (response.rows.length < OVERVIEW_REPORT_PAGE_LIMIT || rows.length >= response.total) {
      return rows;
    }

    offset += response.rows.length;
  }
}

async function fetchCurrentYearOverviewReports(
  token: string,
  request: Request | null,
  today: Date,
) {
  const baseParams = {
    date_from: formatDateValue(startOfYearDate(today)),
    date_to: formatDateValue(today),
    sort_by: 'visitDate',
    sort_dir: 'desc',
  };
  const rows = await Promise.all(
    OVERVIEW_REPORT_TYPES.map((reportType) =>
      fetchAllAdminReportRows(token, request, {
        ...baseParams,
        report_type: reportType,
      }),
    ),
  );
  const rowsByKey = new Map<string, SafetyBackendAdminReportRow>();

  rows.flat().forEach((row) => {
    const reportKey = normalizeText(row.report_key);
    if (reportKey) rowsByKey.set(reportKey, row);
  });

  return Array.from(rowsByKey.values()).map((row) => toSafetyReportListItem(row));
}

function hasDispatchMeaning(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes('미발송') || normalized.includes('dispatch');
}

function findDispatchCardIndex(
  cards: SafetyAdminOverviewResponse['metricCards'] | SafetyAdminOverviewResponse['summaryRows'],
) {
  const index = cards.findIndex((card) =>
    hasDispatchMeaning(`${card.label} ${card.meta}`),
  );
  return index >= 0 ? index : cards.length - 1;
}

function mergeMetricCards(
  baseCards: SafetyAdminOverviewResponse['metricCards'],
  overlayCards: SafetyAdminOverviewResponse['metricCards'],
) {
  if (baseCards.length === 0) return overlayCards;
  if (overlayCards.length === 0) return baseCards;

  const nextCards = baseCards.map((card) => ({ ...card }));
  overlayCards.slice(0, 4).forEach((card, index) => {
    if (nextCards[index]) nextCards[index] = card;
  });

  const dispatchOverlay = overlayCards[findDispatchCardIndex(overlayCards)];
  const dispatchIndex = findDispatchCardIndex(nextCards);
  if (dispatchOverlay && nextCards[dispatchIndex]) {
    nextCards[dispatchIndex] = dispatchOverlay;
  }

  return nextCards;
}

function mergeSummaryRows(
  baseRows: SafetyAdminOverviewResponse['summaryRows'],
  overlayRows: SafetyAdminOverviewResponse['summaryRows'],
) {
  if (baseRows.length === 0) return overlayRows;
  if (overlayRows.length === 0) return baseRows;

  const nextRows = baseRows.map((row) => ({ ...row }));
  overlayRows.slice(0, 4).forEach((row, index) => {
    if (nextRows[index]) nextRows[index] = row;
  });

  const dispatchOverlay = overlayRows[findDispatchCardIndex(overlayRows)];
  const dispatchIndex = findDispatchCardIndex(nextRows);
  if (dispatchOverlay && nextRows[dispatchIndex]) {
    nextRows[dispatchIndex] = dispatchOverlay;
  }

  return nextRows;
}

export async function buildAdminOverviewPolicyOverlay(
  token: string,
  request: Request | null,
  today = new Date(),
): Promise<OverviewPolicyOverlay> {
  const [directoryData, reports] = await Promise.all([
    fetchAdminDirectoryData(token, request),
    fetchCurrentYearOverviewReports(token, request, today),
  ]);
  const data: ControllerDashboardData = {
    ...directoryData,
    contentItems: [],
  };
  const model = buildAdminOverviewModel(data, reports, [], today);

  return {
    deadlineSignalSummary: model.deadlineSignalSummary,
    metricCards: model.metricCards,
    priorityQuarterlyManagementRows: model.priorityQuarterlyManagementRows,
    siteStatusSummary: model.siteStatusSummary,
    summaryRows: model.summaryRows,
    unsentReportRows: model.unsentReportRows,
  };
}

export function mergeAdminOverviewPolicyOverlay(
  base: SafetyAdminOverviewResponse,
  overlay: OverviewPolicyOverlay,
): SafetyAdminOverviewResponse {
  return {
    ...base,
    deadlineSignalSummary: overlay.deadlineSignalSummary,
    metricCards: mergeMetricCards(base.metricCards, overlay.metricCards),
    priorityQuarterlyManagementRows: overlay.priorityQuarterlyManagementRows,
    siteStatusSummary: overlay.siteStatusSummary,
    summaryRows: mergeSummaryRows(base.summaryRows, overlay.summaryRows),
    unsentReportRows: overlay.unsentReportRows,
  };
}
