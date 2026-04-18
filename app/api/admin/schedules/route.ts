import { NextResponse } from 'next/server';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { getAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import {
  buildAdminCalendarSchedules,
  buildAdminQueueSchedules,
} from '@/server/admin/automation';
import type { SafetyInspectionSchedule } from '@/types/admin';

export const runtime = 'nodejs';

function logLegacyScheduleRouteUsage(context: Record<string, unknown>) {
  console.info('admin-schedules-route-legacy-usage', context);
}

function compareText(left: string, right: string, direction: 'asc' | 'desc') {
  const compared = left.localeCompare(right, 'ko');
  return direction === 'asc' ? compared : -compared;
}

function compareNumber(left: number, right: number, direction: 'asc' | 'desc') {
  return direction === 'asc' ? left - right : right - left;
}

function sortSchedules(
  rows: SafetyInspectionSchedule[],
  sortBy: string,
  sortDir: 'asc' | 'desc',
) {
  const compare = (left: SafetyInspectionSchedule, right: SafetyInspectionSchedule) => {
    switch (sortBy) {
      case 'assigneeName':
        return compareText(left.assigneeName, right.assigneeName, sortDir);
      case 'headquarterName':
        return compareText(left.headquarterName, right.headquarterName, sortDir);
      case 'roundNo':
        return compareNumber(left.roundNo, right.roundNo, sortDir);
      case 'siteName':
        return compareText(left.siteName, right.siteName, sortDir);
      case 'status':
        return compareText(left.status, right.status, sortDir);
      case 'windowEnd':
        return compareText(left.windowEnd, right.windowEnd, sortDir);
      case 'windowStart':
        return compareText(left.windowStart, right.windowStart, sortDir);
      case 'plannedDate':
      default:
        return compareText(left.plannedDate || '', right.plannedDate || '', sortDir);
    }
  };

  return [...rows].sort((left, right) => {
    const primary = compare(left, right);
    if (primary !== 0) return primary;

    const byDate = compareText(left.plannedDate || '', right.plannedDate || '', 'asc');
    if (byDate !== 0) return byDate;

    const byRound = compareNumber(left.roundNo, right.roundNo, 'asc');
    if (byRound !== 0) return byRound;

    return compareText(left.siteName, right.siteName, 'asc');
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    // Legacy aggregate schedules route backed by scheduleSnapshot.
    // The schedules UI should prefer /calendar, /queue, and /lookups.
    const token = readRequiredAdminToken(request);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(5000, Number(url.searchParams.get('limit') || '1000')));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
    const month = url.searchParams.get('month') || '';
    const sortBy = url.searchParams.get('sort_by') || 'plannedDate';
    const sortDir = url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc';
    const snapshot = await getAdminScheduleSnapshot(token, request);
    const filters = {
      assigneeUserId: url.searchParams.get('assignee_user_id') || '',
      month,
      plannedDate: url.searchParams.get('planned_date') || '',
      query: url.searchParams.get('query') || '',
      siteId: url.searchParams.get('site_id') || '',
      status: url.searchParams.get('status') || '',
    };
    logLegacyScheduleRouteUsage({
      assignee_user_id: Boolean(filters.assigneeUserId),
      month: filters.month,
      planned_date: Boolean(filters.plannedDate),
      query: Boolean(filters.query),
      site_id: Boolean(filters.siteId),
      sort_by: sortBy,
      sort_dir: sortDir,
      status: Boolean(filters.status),
    });
    const rows = sortSchedules(
      [
        ...buildAdminCalendarSchedules(snapshot.rows, filters, new Date()),
        ...buildAdminQueueSchedules(snapshot.rows, filters, new Date()),
      ],
      sortBy,
      sortDir,
    );

    return NextResponse.json({
      limit,
      month,
      offset,
      rows: rows.slice(offset, offset + limit),
      total: rows.length,
    }, {
      headers: {
        'X-Admin-Schedules-Route-Mode': 'legacy-snapshot',
      },
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '일정 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
