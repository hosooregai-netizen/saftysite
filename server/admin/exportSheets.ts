import {
  getAnalyticsExportSheets,
  getOverviewExportSheets,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import {
  getControllerReportDispatchLabel,
  getControllerReportTypeLabel,
} from '@/lib/admin/controllerReports';
import { getQualityStatusLabel } from '@/lib/admin/reportMeta';
import {
  buildAdminAnalyticsResponse,
  buildAdminOverviewResponse,
  buildAdminSchedules,
} from '@/server/admin/automation';
import { queryAdminReportRows } from '@/server/admin/reportRows';
import {
  fetchAdminCoreData,
  fetchAdminReports,
} from '@/server/admin/safetyApiServer';
import { buildControllerReportRows } from '@/lib/admin/controllerReports';
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
  const [data, reports] = await Promise.all([
    fetchAdminCoreData(token, request),
    fetchAdminReports(token, request),
  ]);

  if (section === 'overview') {
    const overview = buildAdminOverviewResponse(data, reports);
    return getOverviewExportSheets(overview);
  }

  if (section === 'analytics') {
    const analytics = buildAdminAnalyticsResponse(data, reports, {
      contractType: asText(filters.contract_type),
      headquarterId: asText(filters.headquarter_id),
      period: asText(filters.period),
      query: asText(filters.query),
      userId: asText(filters.user_id),
    });
    return getAnalyticsExportSheets(analytics);
  }

  if (section === 'reports') {
    const rows = queryAdminReportRows(
      buildControllerReportRows(reports, data.sites, data.users),
      {
        assigneeUserId: asText(filters.assignee_user_id),
        dateFrom: asText(filters.date_from),
        dateTo: asText(filters.date_to),
        dispatchStatus: asText(filters.dispatch_status),
        headquarterId: asText(filters.headquarter_id),
        qualityStatus: asText(filters.quality_status),
        query: asText(filters.query),
        reportType: asText(filters.report_type),
        siteId: asText(filters.site_id),
        sortBy: asText(filters.sort_by) || 'updatedAt',
        sortDir: asText(filters.sort_dir) || 'desc',
        status: asText(filters.status),
      },
    );

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
    const rows = buildAdminSchedules(data, {
      assigneeUserId: asText(filters.assignee_user_id),
      month: asText(filters.month),
      plannedDate: asText(filters.planned_date),
      query: asText(filters.query),
      siteId: asText(filters.site_id),
      status: asText(filters.status),
    });

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
