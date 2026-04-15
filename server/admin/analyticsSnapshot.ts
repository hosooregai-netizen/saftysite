import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { buildAdminAnalyticsResponse } from '@/server/admin/automation';
import { getAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import { fetchAdminReports } from '@/server/admin/safetyApiServer';
import { backfillAnalyticsSourceData } from '@/features/admin/lib/control-center-model/analyticsSourceBackfill';
import type { SafetyAdminAnalyticsResponse } from '@/types/admin';

interface AnalyticsSourceSnapshot {
  data: ControllerDashboardData;
  refreshedAt: string;
  reports: SafetyReportListItem[];
}

const SNAPSHOT_KEY = '__SAFETY_ADMIN_ANALYTICS_SOURCE_SNAPSHOT__';
const SNAPSHOT_TTL_MS = 1000 * 60;

function getSnapshotStore() {
  const globalRecord = globalThis as typeof globalThis & {
    [SNAPSHOT_KEY]?: {
      promise: Promise<AnalyticsSourceSnapshot> | null;
      snapshot: AnalyticsSourceSnapshot | null;
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

function isFresh(snapshot: AnalyticsSourceSnapshot | null) {
  if (!snapshot) return false;
  const refreshedAt = new Date(snapshot.refreshedAt).getTime();
  if (Number.isNaN(refreshedAt)) return false;
  return Date.now() - refreshedAt < SNAPSHOT_TTL_MS;
}

export async function refreshAdminAnalyticsSnapshot(
  token: string,
  request: Request | null = null,
) {
  const store = getSnapshotStore();
  const nextPromise = Promise.all([
    getAdminDirectorySnapshot(token, request),
    fetchAdminReports(token, request),
  ])
    .then(([directorySnapshot, reports]) => {
      const rawData: ControllerDashboardData = {
        ...directorySnapshot.data,
        contentItems: [],
      };
      const data = backfillAnalyticsSourceData(rawData, reports);

      const snapshot: AnalyticsSourceSnapshot = {
        data,
        refreshedAt: new Date().toISOString(),
        reports,
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

export async function getAdminAnalyticsSnapshot(
  token: string,
  request: Request | null = null,
) {
  const store = getSnapshotStore();
  if (store.promise) {
    return store.promise;
  }
  if (isFresh(store.snapshot)) {
    return store.snapshot!;
  }
  return refreshAdminAnalyticsSnapshot(token, request);
}

export async function buildAdminAnalyticsSnapshotResponse(
  token: string,
  filters: {
    contractType?: string;
    headquarterId?: string;
    period?: string;
    query?: string;
    userId?: string;
  },
  request: Request | null = null,
  today = new Date(),
): Promise<SafetyAdminAnalyticsResponse> {
  const snapshot = await getAdminAnalyticsSnapshot(token, request);
  return buildAdminAnalyticsResponse(snapshot.data, snapshot.reports, filters, today);
}
