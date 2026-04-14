import {
  getAnalyticsExportSheets,
  getOverviewExportSheets,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { buildAdminOverviewResponse } from '@/server/admin/automation';
import {
  getControllerReportDispatchLabel,
  getControllerReportTypeLabel,
} from '@/lib/admin/controllerReports';
import { getQualityStatusLabel } from '@/lib/admin/reportMeta';
import {
  fetchAdminCoreData,
  fetchAdminReports,
  fetchAdminOverviewServer,
  fetchAdminReportsViewServer,
  fetchAdminSchedulesServer,
} from '@/server/admin/safetyApiServer';
import {
  mapBackendAdminReportsResponse,
  mapBackendOverviewResponse,
  mapBackendScheduleListResponse,
} from '@/server/admin/upstreamMappers';
import { buildAdminAnalyticsResponse } from '@/server/admin/automation';
import type { TableExportColumn } from '@/types/admin';

export interface ServerWorkbookSheet {
  columns: TableExportColumn[];
  name: string;
  rows: Array<Record<string, unknown>>;
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatScheduleIssues(row: {
  isConflicted: boolean;
  isOutOfWindow: boolean;
  isOverdue: boolean;
}) {
  return [
    row.isConflicted ? '충돌' : '',
    row.isOutOfWindow ? '구간 밖' : '',
    row.isOverdue ? '지연' : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export async function buildAdminServerExportSheets(
  section: string,
  filters: Record<string, unknown>,
  token: string,
  request: Request,
): Promise<ServerWorkbookSheet[]> {
  if (section === 'overview') {
    const [rawOverview, data, reports] = await Promise.all([
      fetchAdminOverviewServer(token, request),
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);
    const upstreamOverview = mapBackendOverviewResponse(rawOverview);
    const normalizedOverview = buildAdminOverviewResponse(data, reports);
    const visibleSiteIds = new Set(data.sites.map((site) => site.id));
    const overview = {
      ...upstreamOverview,
      alerts: upstreamOverview.alerts.filter(
        (alert) => !alert.siteId || visibleSiteIds.has(alert.siteId),
      ),
      completionRows: upstreamOverview.completionRows.filter((row) => visibleSiteIds.has(row.siteId)),
      scheduleRows: upstreamOverview.scheduleRows.filter((row) => visibleSiteIds.has(row.siteId)),
      coverageRows: normalizedOverview.coverageRows,
      deadlineSignalSummary: normalizedOverview.deadlineSignalSummary,
      deadlineRows: normalizedOverview.deadlineRows,
      metricCards: normalizedOverview.metricCards,
      overdueSiteRows: normalizedOverview.overdueSiteRows,
      pendingReviewRows: normalizedOverview.pendingReviewRows,
      quarterlyMaterialSummary: normalizedOverview.quarterlyMaterialSummary,
      siteStatusSummary: normalizedOverview.siteStatusSummary,
      summaryRows: normalizedOverview.summaryRows,
      unsentReportRows: normalizedOverview.unsentReportRows,
      workerLoadRows: normalizedOverview.workerLoadRows,
    };
    return getOverviewExportSheets(overview);
  }

  if (section === 'analytics') {
    const [data, reports] = await Promise.all([
      fetchAdminCoreData(token, request),
      fetchAdminReports(token, request),
    ]);
    const analytics = buildAdminAnalyticsResponse(
      data,
      reports,
      {
        contractType: asText(filters.contract_type),
        headquarterId: asText(filters.headquarter_id),
        period: asText(filters.period) || 'month',
        query: asText(filters.query),
        userId: asText(filters.user_id),
      },
      new Date(),
    );
    return getAnalyticsExportSheets(analytics);
  }

  if (section === 'reports') {
    const [data, reportsResponse] = await Promise.all([
      fetchAdminCoreData(token, request),
      fetchAdminReportsViewServer(
        token,
        {
          assignee_user_id: asText(filters.assignee_user_id),
          date_from: asText(filters.date_from),
          date_to: asText(filters.date_to),
          dispatch_status: asText(filters.dispatch_status),
          headquarter_id: asText(filters.headquarter_id),
          limit: 500,
          offset: 0,
          quality_status: asText(filters.quality_status),
          query: asText(filters.query),
          report_type: asText(filters.report_type),
          site_id: asText(filters.site_id),
          sort_by: asText(filters.sort_by) || 'updatedAt',
          sort_dir: asText(filters.sort_dir) || 'desc',
          status: asText(filters.status),
        },
        request,
      ),
    ]);
    const rows = mapBackendAdminReportsResponse(reportsResponse).rows;

    return [
      {
        name: '전체 보고서',
        columns: [
          { key: 'reportType', label: '유형' },
          { key: 'reportTitle', label: '보고서명' },
          { key: 'siteName', label: '현장' },
          { key: 'headquarterName', label: '사업장' },
          { key: 'assigneeName', label: '담당자' },
          { key: 'status', label: '상태' },
          { key: 'visitDate', label: '기준일' },
          { key: 'updatedAt', label: '수정일' },
          { key: 'dispatchStatus', label: '발송상태' },
          { key: 'deadlineDate', label: '마감일' },
          { key: 'qualityStatus', label: '품질체크' },
          { key: 'checkerName', label: '체크 담당자' },
        ],
        rows: rows.map((row) => ({
          assigneeName: row.assigneeName,
          checkerName: data.users.find((user) => user.id === row.checkerUserId)?.name || '',
          deadlineDate: row.deadlineDate,
          dispatchStatus: getControllerReportDispatchLabel(row),
          headquarterName: row.headquarterName,
          qualityStatus: getQualityStatusLabel(row.qualityStatus),
          reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
          reportType: getControllerReportTypeLabel(row.reportType),
          siteName: row.siteName,
          status: row.status,
          updatedAt: formatDateTime(row.updatedAt),
          visitDate: row.visitDate || '-',
        })),
      },
    ];
  }

  if (section === 'schedules') {
    const rows = mapBackendScheduleListResponse(
      await fetchAdminSchedulesServer(
        token,
        {
          assignee_user_id: asText(filters.assignee_user_id),
          limit: 1000,
          month: asText(filters.month),
          offset: 0,
          planned_date: asText(filters.planned_date),
          query: asText(filters.query),
          site_id: asText(filters.site_id),
          sort_by: asText(filters.sort_by) || 'plannedDate',
          sort_dir: asText(filters.sort_dir) || 'asc',
          status: asText(filters.status),
        },
        request,
      ),
    ).rows;

    return [
      {
        name: '방문 일정',
        columns: [
          { key: 'siteName', label: '현장' },
          { key: 'headquarterName', label: '사업장' },
          { key: 'roundNo', label: '회차' },
          { key: 'plannedDate', label: '방문일' },
          { key: 'window', label: '허용 구간' },
          { key: 'assigneeName', label: '담당자' },
          { key: 'status', label: '상태' },
          { key: 'selectionReason', label: '선택 사유' },
          { key: 'selectionConfirmed', label: '선택 확정' },
          { key: 'issues', label: '이슈' },
          { key: 'exceptionReasonCode', label: '사유코드' },
          { key: 'exceptionMemo', label: '사유 메모' },
        ],
        rows: rows.map((row) => ({
          assigneeName: row.assigneeName || '-',
          exceptionMemo: row.exceptionMemo || '',
          exceptionReasonCode: row.exceptionReasonCode || '',
          headquarterName: row.headquarterName || '-',
          issues: formatScheduleIssues(row) || '-',
          plannedDate: row.plannedDate || '-',
          roundNo: `${row.roundNo}회차`,
          selectionConfirmed: row.selectionConfirmedAt
            ? `${row.selectionConfirmedByName || row.assigneeName || '-'} / ${formatDateTime(row.selectionConfirmedAt)}`
            : '-',
          selectionReason: row.selectionReasonLabel
            ? `${row.selectionReasonLabel}${row.selectionReasonMemo ? ` - ${row.selectionReasonMemo}` : ''}`
            : '-',
          siteName: row.siteName,
          status: row.status,
          window: `${row.windowStart} ~ ${row.windowEnd}`,
        })),
      },
      {
        name: '일정 이슈',
        columns: [
          { key: 'siteName', label: '현장' },
          { key: 'roundNo', label: '회차' },
          { key: 'plannedDate', label: '방문일' },
          { key: 'assigneeName', label: '담당자' },
          { key: 'issues', label: '이슈' },
        ],
        rows: rows
          .filter((row) => row.isConflicted || row.isOutOfWindow || row.isOverdue)
          .map((row) => ({
            assigneeName: row.assigneeName || '-',
            issues: formatScheduleIssues(row),
            plannedDate: row.plannedDate || '-',
            roundNo: `${row.roundNo}회차`,
            siteName: row.siteName,
          })),
      },
    ];
  }

  throw new Error('서버 집계 엑셀을 지원하지 않는 섹션입니다.');
}
