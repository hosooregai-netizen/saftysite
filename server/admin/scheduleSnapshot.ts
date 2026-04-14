import type {
  SafetyAdminScheduleCalendarResponse,
  SafetyAdminScheduleLookupsResponse,
  SafetyAdminScheduleQueueResponse,
  SafetyInspectionSchedule,
} from '@/types/admin';
import type { ControllerDashboardData } from '@/types/controller';
import {
  buildAdminCalendarSchedules,
  buildAdminQueueSchedules,
  buildAdminScheduleRows,
  buildAvailableScheduleMonths,
} from '@/server/admin/automation';
import { fetchAdminCoreData } from '@/server/admin/safetyApiServer';

interface ScheduleSourceSnapshot {
  data: ControllerDashboardData;
  refreshedAt: string;
  rows: SafetyInspectionSchedule[];
}

const SNAPSHOT_KEY = '__SAFETY_ADMIN_SCHEDULE_SOURCE_SNAPSHOT__';

function getSnapshotStore() {
  const globalRecord = globalThis as typeof globalThis & {
    [SNAPSHOT_KEY]?: ScheduleSourceSnapshot | null;
  };
  if (!(SNAPSHOT_KEY in globalRecord)) {
    globalRecord[SNAPSHOT_KEY] = null;
  }
  return globalRecord;
}

export async function refreshAdminScheduleSnapshot(
  token: string,
  request: Request | null = null,
  today = new Date(),
) {
  const data = await fetchAdminCoreData(token, request);
  const snapshot: ScheduleSourceSnapshot = {
    data,
    refreshedAt: new Date().toISOString(),
    rows: buildAdminScheduleRows(data, today),
  };
  getSnapshotStore()[SNAPSHOT_KEY] = snapshot;
  return snapshot;
}

export async function getAdminScheduleSnapshot(
  token: string,
  request: Request | null = null,
  today = new Date(),
) {
  const snapshot = getSnapshotStore()[SNAPSHOT_KEY];
  if (snapshot) {
    return snapshot;
  }
  return refreshAdminScheduleSnapshot(token, request, today);
}

function buildFilteredAvailableMonths(
  rows: SafetyInspectionSchedule[],
  filters: {
    assigneeUserId?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  today: Date,
) {
  const calendarRows = buildAdminCalendarSchedules(rows, { ...filters, month: 'all' }, today);
  const queueRows = buildAdminQueueSchedules(rows, { ...filters, month: 'all' }, today);
  return buildAvailableScheduleMonths([...calendarRows, ...queueRows]);
}

export async function buildAdminScheduleCalendarSnapshotResponse(
  token: string,
  filters: {
    assigneeUserId?: string;
    month?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  request: Request | null = null,
  today = new Date(),
): Promise<SafetyAdminScheduleCalendarResponse> {
  const snapshot = await getAdminScheduleSnapshot(token, request, today);
  const rows = buildAdminCalendarSchedules(snapshot.rows, filters, today);
  const unselectedRows = buildAdminQueueSchedules(snapshot.rows, filters, today);
  const allSelectedRows = buildAdminCalendarSchedules(
    snapshot.rows,
    { ...filters, month: 'all' },
    today,
  );

  return {
    allSelectedTotal: allSelectedRows.length,
    availableMonths: buildFilteredAvailableMonths(snapshot.rows, filters, today),
    month: filters.month || '',
    monthTotal: rows.length,
    refreshedAt: snapshot.refreshedAt,
    rows,
    unselectedTotal: unselectedRows.length,
  };
}

export async function buildAdminScheduleQueueSnapshotResponse(
  token: string,
  filters: {
    assigneeUserId?: string;
    limit?: number;
    month?: string;
    offset?: number;
    query?: string;
    siteId?: string;
    status?: string;
  },
  request: Request | null = null,
  today = new Date(),
): Promise<SafetyAdminScheduleQueueResponse> {
  const snapshot = await getAdminScheduleSnapshot(token, request, today);
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, Math.min(5000, filters.limit ?? 50));
  const rows = buildAdminQueueSchedules(snapshot.rows, filters, today);

  return {
    limit,
    month: filters.month || '',
    offset,
    refreshedAt: snapshot.refreshedAt,
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
  };
}

export async function buildAdminScheduleLookupsSnapshotResponse(
  token: string,
  request: Request | null = null,
  today = new Date(),
): Promise<SafetyAdminScheduleLookupsResponse> {
  const snapshot = await getAdminScheduleSnapshot(token, request, today);

  return {
    sites: snapshot.data.sites.map((site) => ({
      id: site.id,
      name: site.site_name,
    })),
    users: snapshot.data.users.map((user) => ({
      id: user.id,
      name: user.name,
    })),
  };
}
