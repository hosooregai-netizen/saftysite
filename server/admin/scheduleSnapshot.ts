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
import {
  alignScheduleRowsWithLegacyReports,
} from '@/server/admin/legacyReportAlignment';
import { getLegacyAdminReportsSnapshot } from '@/server/admin/legacyAdminReportsSnapshot';
import {
  fetchAdminScheduleCalendarServer,
  fetchAdminScheduleQueueServer,
} from '@/server/admin/safetyApiServer';
import {
  mapBackendAdminScheduleCalendarResponse,
  mapBackendAdminScheduleQueueResponse,
} from '@/server/admin/upstreamMappers';
import { getWorkerScheduleMirrorRows } from '@/server/admin/workerScheduleMirror';

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

function getScheduleIdKey(row: SafetyInspectionSchedule) {
  return row.id ? `id:${row.id}` : '';
}

function getScheduleSiteRoundKey(row: SafetyInspectionSchedule) {
  return row.siteId && row.roundNo > 0 ? `site-round:${row.siteId}:${row.roundNo}` : '';
}

function parseTime(value: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function fillScheduleFallbackFields(
  primary: SafetyInspectionSchedule,
  fallback: SafetyInspectionSchedule,
): SafetyInspectionSchedule {
  return {
    ...primary,
    assigneeName: primary.assigneeName || fallback.assigneeName,
    assigneeUserId: primary.assigneeUserId || fallback.assigneeUserId,
    headquarterId: primary.headquarterId || fallback.headquarterId,
    headquarterName: primary.headquarterName || fallback.headquarterName,
    siteId: primary.siteId || fallback.siteId,
    siteName: primary.siteName || fallback.siteName,
    totalRounds: primary.totalRounds || fallback.totalRounds,
    windowEnd: primary.windowEnd || fallback.windowEnd,
    windowStart: primary.windowStart || fallback.windowStart,
  };
}

function chooseScheduleSnapshotRow(
  memoRow: SafetyInspectionSchedule,
  backendRow: SafetyInspectionSchedule,
) {
  const memoConfirmedAt = parseTime(memoRow.selectionConfirmedAt);
  const backendConfirmedAt = parseTime(backendRow.selectionConfirmedAt);

  if (memoConfirmedAt && backendConfirmedAt && memoConfirmedAt !== backendConfirmedAt) {
    return memoConfirmedAt > backendConfirmedAt
      ? fillScheduleFallbackFields(memoRow, backendRow)
      : fillScheduleFallbackFields(backendRow, memoRow);
  }

  if (!memoRow.plannedDate && backendRow.plannedDate) {
    return fillScheduleFallbackFields(backendRow, memoRow);
  }
  if (memoRow.plannedDate && !backendRow.plannedDate) {
    return fillScheduleFallbackFields(memoRow, backendRow);
  }
  if (!memoRow.linkedReportKey && backendRow.linkedReportKey) {
    return fillScheduleFallbackFields(backendRow, memoRow);
  }
  if (!memoRow.actualVisitDate && backendRow.actualVisitDate) {
    return fillScheduleFallbackFields(backendRow, memoRow);
  }

  return fillScheduleFallbackFields(memoRow, backendRow);
}

export function mergeAdminScheduleSnapshotRows(input: {
  backendRows: SafetyInspectionSchedule[];
  memoRows: SafetyInspectionSchedule[];
}) {
  const mergedByKey = new Map<string, SafetyInspectionSchedule>();
  const aliasToKey = new Map<string, string>();
  const registerAliases = (row: SafetyInspectionSchedule, primaryKey: string) => {
    const idKey = getScheduleIdKey(row);
    const siteRoundKey = getScheduleSiteRoundKey(row);
    if (idKey) aliasToKey.set(idKey, primaryKey);
    if (siteRoundKey) aliasToKey.set(siteRoundKey, primaryKey);
  };

  input.memoRows.forEach((row) => {
    const key = getScheduleIdKey(row) || getScheduleSiteRoundKey(row);
    if (!key) return;
    mergedByKey.set(key, row);
    registerAliases(row, key);
  });

  input.backendRows.forEach((backendRow) => {
    const key =
      aliasToKey.get(getScheduleIdKey(backendRow)) ||
      aliasToKey.get(getScheduleSiteRoundKey(backendRow)) ||
      getScheduleIdKey(backendRow) ||
      getScheduleSiteRoundKey(backendRow);
    if (!key) return;
    const memoRow = mergedByKey.get(key);
    const mergedRow = memoRow ? chooseScheduleSnapshotRow(memoRow, backendRow) : backendRow;
    mergedByKey.set(key, mergedRow);
    registerAliases(mergedRow, key);
  });

  return Array.from(mergedByKey.values());
}

async function fetchBackendAdminScheduleRows(
  token: string,
  filters: {
    assigneeUserId?: string;
    month?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  request: Request | null,
) {
  try {
    const params = {
      assignee_user_id: filters.assigneeUserId || '',
      limit: 5000,
      month: filters.month || '',
      offset: 0,
      query: filters.query || '',
      site_id: filters.siteId || '',
      status: filters.status || '',
    };
    const [calendar, queue] = await Promise.all([
      fetchAdminScheduleCalendarServer(
        token,
        params,
        request,
      ),
      fetchAdminScheduleQueueServer(
        token,
        params,
        request,
      ),
    ]);
    return [
      ...mapBackendAdminScheduleCalendarResponse(calendar).rows,
      ...mapBackendAdminScheduleQueueResponse(queue).rows,
    ];
  } catch {
    return [];
  }
}

export async function refreshAdminScheduleSnapshot(
  token: string,
  request: Request | null = null,
  today = new Date(),
) {
  const store = getSnapshotStore();
  const nextPromise = Promise.all([
    getAdminDirectorySnapshot(token, request),
    getLegacyAdminReportsSnapshot(),
  ])
    .then(([directorySnapshot, legacyReports]) => {
      const data: ControllerDashboardData = {
        ...directorySnapshot.data,
        contentItems: [],
      };
      const memoRows = buildAdminScheduleRows(data, today);
      const snapshot: ScheduleSourceSnapshot = {
        data,
        refreshedAt: new Date().toISOString(),
        rows: alignScheduleRowsWithLegacyReports(memoRows, {
          legacyRows: legacyReports,
          sites: data.sites,
          today,
        }),
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

export function invalidateAdminScheduleSnapshot() {
  const store = getSnapshotStore();
  store.snapshot = null;
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
  const workerMirrorRows = getWorkerScheduleMirrorRows();
  const sourceRows = mergeAdminScheduleSnapshotRows({
    backendRows: [
      ...(await fetchBackendAdminScheduleRows(token, filters, request)),
      ...workerMirrorRows,
    ],
    memoRows: snapshot.rows,
  });
  const rows = buildAdminCalendarSchedules(sourceRows, filters, today);
  const unselectedRows = buildAdminQueueSchedules(sourceRows, filters, today);
  const allSelectedRows = buildAdminCalendarSchedules(
    sourceRows,
    { ...filters, month: 'all' },
    today,
  );

  return {
    allSelectedTotal: allSelectedRows.length,
    availableMonths: buildFilteredAvailableMonths(sourceRows, filters, today),
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
  const workerMirrorRows = getWorkerScheduleMirrorRows();
  const sourceRows = mergeAdminScheduleSnapshotRows({
    backendRows: [
      ...(await fetchBackendAdminScheduleRows(token, filters, request)),
      ...workerMirrorRows,
    ],
    memoRows: snapshot.rows,
  });
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, Math.min(5000, filters.limit ?? 50));
  const rows = buildAdminQueueSchedules(sourceRows, filters, today);

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
