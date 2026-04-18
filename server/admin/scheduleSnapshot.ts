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
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';

/**
 * Schedule snapshot is a legacy/shared helper layer.
 * The schedules UI reads from `/api/admin/schedules/calendar`,
 * `/api/admin/schedules/queue`, and `/api/admin/schedules/lookups` directly.
 */
interface ScheduleSourceSnapshot {
  data: ControllerDashboardData;
  refreshedAt: string;
  rows: SafetyInspectionSchedule[];
}

const SNAPSHOT_KEY = '__SAFETY_ADMIN_SCHEDULE_SOURCE_SNAPSHOT__';
const SNAPSHOT_TTL_MS = 1000 * 60;

function getSnapshotStore() {
  const globalRecord = globalThis as typeof globalThis & {
    [SNAPSHOT_KEY]?: {
      promise: Promise<ScheduleSourceSnapshot> | null;
      snapshot: ScheduleSourceSnapshot | null;
    };
  };
  if (!(SNAPSHOT_KEY in globalRecord)) {
    globalRecord[SNAPSHOT_KEY] = {
      promise: null,
      snapshot: null,
    };
  }
  return globalRecord[SNAPSHOT_KEY]!;
}

function isFresh(snapshot: ScheduleSourceSnapshot | null) {
  if (!snapshot) return false;
  const refreshedAt = new Date(snapshot.refreshedAt).getTime();
  if (Number.isNaN(refreshedAt)) return false;
  return Date.now() - refreshedAt < SNAPSHOT_TTL_MS;
}

export async function refreshAdminScheduleSnapshot(
  token: string,
  request: Request | null = null,
  today = new Date(),
) {
  const store = getSnapshotStore();
  const nextPromise = getAdminDirectorySnapshot(token, request)
    .then((directorySnapshot) => {
      const data: ControllerDashboardData = {
        ...directorySnapshot.data,
        contentItems: [],
      };
      const snapshot: ScheduleSourceSnapshot = {
        data,
        refreshedAt: new Date().toISOString(),
        rows: buildAdminScheduleRows(data, today),
      };
      store.snapshot = snapshot;
      return snapshot;
    })
    .finally(() => {
      store.promise = null;
    });
  store.promise = nextPromise;
  return nextPromise;
}

export async function getAdminScheduleSnapshot(
  token: string,
  request: Request | null = null,
  today = new Date(),
) {
  const store = getSnapshotStore();
  if (store.promise) {
    return store.promise;
  }
  if (isFresh(store.snapshot)) {
    return store.snapshot!;
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
