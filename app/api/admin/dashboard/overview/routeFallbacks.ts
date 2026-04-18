import { buildDeadlineSignalSummaryFromRows } from '@/features/admin/lib/control-center-model/overviewPolicies';
import type {
  SafetyAdminOverviewResponse,
  SafetyAdminPriorityQuarterlyManagementRow,
} from '@/types/admin';
import type { SafetyBackendAdminOverviewResponse } from '@/types/backend';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapBackendOverviewUnsentRowsPreservingUpstream(
  rows: SafetyBackendAdminOverviewResponse['unsent_report_rows'],
): SafetyAdminOverviewResponse['unsentReportRows'] {
  return rows.map((row) => {
    const referenceDate = normalizeText(row.reference_date) || normalizeText(row.visit_date);
    return {
      assigneeName: normalizeText(row.assignee_name),
      deadlineDate: normalizeText(row.deadline_date),
      dispatchStatus: (normalizeText(row.dispatch_status) ||
        '') as SafetyAdminOverviewResponse['unsentReportRows'][number]['dispatchStatus'],
      headquarterName: normalizeText(row.headquarter_name),
      href: normalizeText(row.href),
      referenceDate,
      reportKey: normalizeText(row.report_key),
      reportTitle: normalizeText(row.report_title),
      reportTypeLabel: normalizeText(row.report_type_label),
      siteId: normalizeText(row.site_id),
      siteName: normalizeText(row.site_name),
      unsentDays:
        typeof row.unsent_days === 'number' && Number.isFinite(row.unsent_days)
          ? row.unsent_days
          : 0,
      visitDate: normalizeText(row.visit_date),
      mailMissingReason: normalizeText(row.mail_missing_reason),
      mailReady: Boolean(row.mail_ready),
      recipientEmail: normalizeText(row.recipient_email),
      recipientName: normalizeText(row.recipient_name),
    };
  });
}

function mapBackendOverviewPriorityRowsPreservingUpstream(
  rows: SafetyBackendAdminOverviewResponse['priority_quarterly_management_rows'] | undefined,
): SafetyAdminPriorityQuarterlyManagementRow[] {
  return (rows ?? []).map((row) => ({
    currentQuarterKey: normalizeText(row.current_quarter_key),
    currentQuarterLabel: normalizeText(row.current_quarter_label),
    exceptionLabel: normalizeText(row.exception_label),
    exceptionStatus: (normalizeText(row.exception_status) ||
      'ok') as SafetyAdminPriorityQuarterlyManagementRow['exceptionStatus'],
    headquarterName: normalizeText(row.headquarter_name),
    href: normalizeText(row.href),
    latestGuidanceDate: normalizeText(row.latest_guidance_date),
    latestGuidanceRound:
      typeof row.latest_guidance_round === 'number' && Number.isFinite(row.latest_guidance_round)
        ? row.latest_guidance_round
        : null,
    projectAmount:
      typeof row.project_amount === 'number' && Number.isFinite(row.project_amount)
        ? row.project_amount
        : null,
    quarterlyDispatchStatus: (normalizeText(row.quarterly_dispatch_status) ||
      'report_missing') as SafetyAdminPriorityQuarterlyManagementRow['quarterlyDispatchStatus'],
    quarterlyReflectionStatus: (normalizeText(row.quarterly_reflection_status) ||
      'missing') as SafetyAdminPriorityQuarterlyManagementRow['quarterlyReflectionStatus'],
    quarterlyReportHref: normalizeText(row.quarterly_report_href),
    quarterlyReportKey: normalizeText(row.quarterly_report_key),
    siteId: normalizeText(row.site_id),
    siteName: normalizeText(row.site_name),
  }));
}

function mapBackendDeadlineSignalSummaryPreservingUpstream(
  response: SafetyBackendAdminOverviewResponse,
  fallbackRows: SafetyAdminOverviewResponse['unsentReportRows'],
): SafetyAdminOverviewResponse['deadlineSignalSummary'] {
  const summary = response.deadline_signal_summary;
  const entries = Array.isArray(summary?.entries)
    ? summary.entries.map((entry) => ({
        count: entry.count,
        href: normalizeText(entry.href),
        key: normalizeText(entry.key),
        label: normalizeText(entry.label),
      }))
    : [];

  if (entries.length > 0) {
    return {
      entries,
      totalReportCount:
        typeof summary?.total_report_count === 'number' ? summary.total_report_count : fallbackRows.length,
    };
  }

  return buildDeadlineSignalSummaryFromRows(fallbackRows);
}

function formatCountLike(previousValue: string, count: number) {
  const normalized = normalizeText(previousValue);
  const suffix = normalized.replace(/^[\d,.\s]+/, '');
  return `${count.toLocaleString('ko-KR')}${suffix || '\uAC74'}`;
}

function isDispatchManagementLabel(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized.includes('dispatch') || normalized.includes('발송');
}

function syncDispatchMetricCards(
  cards: SafetyAdminOverviewResponse['metricCards'],
  dispatchManagementCount: number,
): SafetyAdminOverviewResponse['metricCards'] {
  if (cards.length === 0) return cards;
  const dispatchCardIndex = cards.findIndex((card) =>
    isDispatchManagementLabel(`${card.label} ${card.meta}`),
  );
  const targetIndex = dispatchCardIndex >= 0 ? dispatchCardIndex : cards.length - 1;
  return cards.map((card, index) =>
    index === targetIndex
      ? {
          ...card,
          tone: dispatchManagementCount > 0 ? 'danger' : 'default',
          value: formatCountLike(card.value, dispatchManagementCount),
        }
      : card,
  );
}

function syncDispatchSummaryRows(
  rows: SafetyAdminOverviewResponse['summaryRows'],
  dispatchManagementCount: number,
): SafetyAdminOverviewResponse['summaryRows'] {
  if (rows.length === 0) return rows;
  const dispatchRowIndex = rows.findIndex((row) =>
    isDispatchManagementLabel(`${row.label} ${row.meta}`),
  );
  const targetIndex = dispatchRowIndex >= 0 ? dispatchRowIndex : rows.length - 1;
  return rows.map((row, index) =>
    index === targetIndex
      ? { ...row, value: formatCountLike(row.value, dispatchManagementCount) }
      : row,
  );
}

export function applyOverviewUpstreamFallbacks(
  response: SafetyBackendAdminOverviewResponse,
  mappedOverview: SafetyAdminOverviewResponse,
): SafetyAdminOverviewResponse {
  const rawUnsentCount = response.unsent_report_rows.length;
  const rawPriorityCount = response.priority_quarterly_management_rows?.length ?? 0;
  const mappedPriorityRows = mappedOverview.priorityQuarterlyManagementRows ?? [];
  const shouldPreserveUnsent = rawUnsentCount > 0 && mappedOverview.unsentReportRows.length === 0;
  const shouldPreservePriority = rawPriorityCount > 0 && mappedPriorityRows.length === 0;

  if (!shouldPreserveUnsent && !shouldPreservePriority) {
    return mappedOverview;
  }

  const nextOverview: SafetyAdminOverviewResponse = {
    ...mappedOverview,
  };

  if (shouldPreserveUnsent) {
    const unsentReportRows = mapBackendOverviewUnsentRowsPreservingUpstream(response.unsent_report_rows);
    nextOverview.unsentReportRows = unsentReportRows;
    nextOverview.deadlineSignalSummary = mapBackendDeadlineSignalSummaryPreservingUpstream(
      response,
      unsentReportRows,
    );
    nextOverview.metricCards = syncDispatchMetricCards(mappedOverview.metricCards, unsentReportRows.length);
    nextOverview.summaryRows = syncDispatchSummaryRows(mappedOverview.summaryRows, unsentReportRows.length);
  }

  if (shouldPreservePriority) {
    nextOverview.priorityQuarterlyManagementRows = mapBackendOverviewPriorityRowsPreservingUpstream(
      response.priority_quarterly_management_rows,
    );
  }

  return nextOverview;
}
