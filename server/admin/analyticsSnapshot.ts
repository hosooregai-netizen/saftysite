import type { SafetyReportListItem } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import { buildAdminAnalyticsResponse } from '@/server/admin/automation';
import { fetchAdminCoreData, fetchAdminReports } from '@/server/admin/safetyApiServer';
import type { SafetyAdminAnalyticsResponse } from '@/types/admin';

interface AnalyticsSourceSnapshot {
  data: ControllerDashboardData;
  refreshedAt: string;
  reports: SafetyReportListItem[];
}

const SNAPSHOT_KEY = '__SAFETY_ADMIN_ANALYTICS_SOURCE_SNAPSHOT__';

function getSnapshotStore() {
  const globalRecord = globalThis as typeof globalThis & {
    [SNAPSHOT_KEY]?: AnalyticsSourceSnapshot | null;
  };
  if (!(SNAPSHOT_KEY in globalRecord)) {
    globalRecord[SNAPSHOT_KEY] = null;
  }
  return globalRecord;
}

export async function refreshAdminAnalyticsSnapshot(
  token: string,
  request: Request | null = null,
) {
  const [data, reports] = await Promise.all([
    fetchAdminCoreData(token, request),
    fetchAdminReports(token, request),
  ]);

  const snapshot: AnalyticsSourceSnapshot = {
    data,
    refreshedAt: new Date().toISOString(),
    reports,
  };
  getSnapshotStore()[SNAPSHOT_KEY] = snapshot;
  return snapshot;
}

export async function getAdminAnalyticsSnapshot(
  token: string,
  request: Request | null = null,
) {
  const snapshot = getSnapshotStore()[SNAPSHOT_KEY];
  if (snapshot) {
    return snapshot;
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
