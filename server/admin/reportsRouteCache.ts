import type { ControllerReportRow, SafetyAdminReportsResponse } from '@/types/admin';

const REPORTS_ROUTE_CACHE_TTL_MS = 1000 * 60;
const REPORTS_ROUTE_CACHE_KEY = '__SAFETY_ADMIN_REPORTS_ROUTE_CACHE__';
const REPORTS_ROUTE_IN_FLIGHT_KEY = '__SAFETY_ADMIN_REPORTS_ROUTE_IN_FLIGHT__';
const REPORTS_ROWS_SNAPSHOT_CACHE_KEY = '__SAFETY_ADMIN_REPORTS_ROWS_SNAPSHOT_CACHE__';
const REPORTS_ROWS_SNAPSHOT_IN_FLIGHT_KEY = '__SAFETY_ADMIN_REPORTS_ROWS_SNAPSHOT_IN_FLIGHT__';

interface ReportsRouteCacheEntry {
  payload: SafetyAdminReportsResponse;
  savedAt: number;
}

interface ReportsRowsSnapshotCacheEntry {
  rows: ControllerReportRow[];
  savedAt: number;
}

function getReportsRouteCache() {
  const globalRecord = globalThis as typeof globalThis & {
    [REPORTS_ROUTE_CACHE_KEY]?: Map<string, ReportsRouteCacheEntry>;
  };
  if (!(REPORTS_ROUTE_CACHE_KEY in globalRecord)) {
    globalRecord[REPORTS_ROUTE_CACHE_KEY] = new Map();
  }
  return globalRecord[REPORTS_ROUTE_CACHE_KEY]!;
}

function getReportsRouteInFlight() {
  const globalRecord = globalThis as typeof globalThis & {
    [REPORTS_ROUTE_IN_FLIGHT_KEY]?: Map<string, Promise<SafetyAdminReportsResponse>>;
  };
  if (!(REPORTS_ROUTE_IN_FLIGHT_KEY in globalRecord)) {
    globalRecord[REPORTS_ROUTE_IN_FLIGHT_KEY] = new Map();
  }
  return globalRecord[REPORTS_ROUTE_IN_FLIGHT_KEY]!;
}

function getReportsRowsSnapshotCache() {
  const globalRecord = globalThis as typeof globalThis & {
    [REPORTS_ROWS_SNAPSHOT_CACHE_KEY]?: Map<string, ReportsRowsSnapshotCacheEntry>;
  };
  if (!(REPORTS_ROWS_SNAPSHOT_CACHE_KEY in globalRecord)) {
    globalRecord[REPORTS_ROWS_SNAPSHOT_CACHE_KEY] = new Map();
  }
  return globalRecord[REPORTS_ROWS_SNAPSHOT_CACHE_KEY]!;
}

function getReportsRowsSnapshotInFlight() {
  const globalRecord = globalThis as typeof globalThis & {
    [REPORTS_ROWS_SNAPSHOT_IN_FLIGHT_KEY]?: Map<string, Promise<ControllerReportRow[]>>;
  };
  if (!(REPORTS_ROWS_SNAPSHOT_IN_FLIGHT_KEY in globalRecord)) {
    globalRecord[REPORTS_ROWS_SNAPSHOT_IN_FLIGHT_KEY] = new Map();
  }
  return globalRecord[REPORTS_ROWS_SNAPSHOT_IN_FLIGHT_KEY]!;
}

function buildReportsRouteCacheKey(request: Request) {
  const url = new URL(request.url);
  return `${request.headers.get('authorization') || ''}:${url.searchParams.toString()}`;
}

function buildReportsRowsSnapshotCacheKey(request: Request) {
  return request.headers.get('authorization') || '';
}

export function getCachedAdminReportsRouteResponse(request: Request) {
  const cacheKey = buildReportsRouteCacheKey(request);
  const cached = getReportsRouteCache().get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.savedAt >= REPORTS_ROUTE_CACHE_TTL_MS) {
    getReportsRouteCache().delete(cacheKey);
    return null;
  }

  return cached.payload;
}

export function setCachedAdminReportsRouteResponse(
  request: Request,
  payload: SafetyAdminReportsResponse,
) {
  getReportsRouteCache().set(buildReportsRouteCacheKey(request), {
    payload,
    savedAt: Date.now(),
  });
}

export function getCachedAdminReportsRowsSnapshot(request: Request) {
  const cacheKey = buildReportsRowsSnapshotCacheKey(request);
  const cached = getReportsRowsSnapshotCache().get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.savedAt >= REPORTS_ROUTE_CACHE_TTL_MS) {
    getReportsRowsSnapshotCache().delete(cacheKey);
    return null;
  }

  return cached.rows;
}

export function setCachedAdminReportsRowsSnapshot(
  request: Request,
  rows: ControllerReportRow[],
) {
  getReportsRowsSnapshotCache().set(buildReportsRowsSnapshotCacheKey(request), {
    rows,
    savedAt: Date.now(),
  });
}

export function readOrCreateAdminReportsRouteResponse(
  request: Request,
  loader: () => Promise<SafetyAdminReportsResponse>,
) {
  const cached = getCachedAdminReportsRouteResponse(request);
  if (cached) {
    return Promise.resolve(cached);
  }

  const cacheKey = buildReportsRouteCacheKey(request);
  const inFlight = getReportsRouteInFlight();
  const existing = inFlight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const nextRequest = Promise.resolve(loader())
    .then((payload) => {
      setCachedAdminReportsRouteResponse(request, payload);
      return payload;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });
  inFlight.set(cacheKey, nextRequest);
  return nextRequest;
}

export function readOrCreateAdminReportsRowsSnapshot(
  request: Request,
  loader: () => Promise<ControllerReportRow[]>,
) {
  const cached = getCachedAdminReportsRowsSnapshot(request);
  if (cached) {
    return Promise.resolve(cached);
  }

  const cacheKey = buildReportsRowsSnapshotCacheKey(request);
  const inFlight = getReportsRowsSnapshotInFlight();
  const existing = inFlight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const nextRequest = Promise.resolve(loader())
    .then((rows) => {
      setCachedAdminReportsRowsSnapshot(request, rows);
      return rows;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });
  inFlight.set(cacheKey, nextRequest);
  return nextRequest;
}

export function invalidateAdminReportsRouteCache() {
  getReportsRouteCache().clear();
  getReportsRouteInFlight().clear();
  getReportsRowsSnapshotCache().clear();
  getReportsRowsSnapshotInFlight().clear();
}
