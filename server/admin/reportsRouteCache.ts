import type { SafetyAdminReportsResponse } from '@/types/admin';

const REPORTS_ROUTE_CACHE_TTL_MS = 1000 * 60;
const REPORTS_ROUTE_CACHE_KEY = '__SAFETY_ADMIN_REPORTS_ROUTE_CACHE__';
const REPORTS_ROUTE_IN_FLIGHT_KEY = '__SAFETY_ADMIN_REPORTS_ROUTE_IN_FLIGHT__';

interface ReportsRouteCacheEntry {
  payload: SafetyAdminReportsResponse;
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

function buildReportsRouteCacheKey(request: Request) {
  const url = new URL(request.url);
  return `${request.headers.get('authorization') || ''}:${url.searchParams.toString()}`;
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

export function invalidateAdminReportsRouteCache() {
  getReportsRouteCache().clear();
  getReportsRouteInFlight().clear();
}
