import type { ControllerDashboardData } from '@/types/controller';
import { fetchAdminDirectoryData } from '@/server/admin/safetyApiServer';

const SNAPSHOT_TTL_MS = 1000 * 60;
const SNAPSHOT_KEY = '__SAFETY_ADMIN_DIRECTORY_SNAPSHOT__';

interface AdminDirectorySnapshot {
  data: Pick<ControllerDashboardData, 'assignments' | 'headquarters' | 'sites' | 'users'>;
  refreshedAt: string;
}

interface AdminDirectorySnapshotStore {
  promise: Promise<AdminDirectorySnapshot> | null;
  snapshot: AdminDirectorySnapshot | null;
}

function getSnapshotStore() {
  const globalRecord = globalThis as typeof globalThis & {
    [SNAPSHOT_KEY]?: AdminDirectorySnapshotStore;
  };
  if (!(SNAPSHOT_KEY in globalRecord)) {
    globalRecord[SNAPSHOT_KEY] = {
      promise: null,
      snapshot: null,
    };
  }
  return globalRecord[SNAPSHOT_KEY]!;
}

function isFresh(snapshot: AdminDirectorySnapshot | null) {
  if (!snapshot) return false;
  const refreshedAt = new Date(snapshot.refreshedAt).getTime();
  if (Number.isNaN(refreshedAt)) return false;
  return Date.now() - refreshedAt < SNAPSHOT_TTL_MS;
}

export function invalidateAdminDirectorySnapshot() {
  const store = getSnapshotStore();
  store.promise = null;
  store.snapshot = null;
}

export async function refreshAdminDirectorySnapshot(
  token: string,
  request: Request | null = null,
) {
  const store = getSnapshotStore();
  const nextPromise = fetchAdminDirectoryData(token, request)
    .then((data) => {
      const snapshot: AdminDirectorySnapshot = {
        data,
        refreshedAt: new Date().toISOString(),
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

export async function getAdminDirectorySnapshot(
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
  return refreshAdminDirectorySnapshot(token, request);
}
