import type { SafetyAdminOverviewResponse } from '@/types/admin';

const OVERVIEW_ROUTE_CACHE_TTL_MS = 1000 * 60;
const OVERVIEW_ROUTE_CACHE_KEY = '__SAFETY_ADMIN_OVERVIEW_ROUTE_CACHE__';

interface OverviewRouteCacheEntry {
  payload: SafetyAdminOverviewResponse;
  savedAt: number;
}

function getOverviewRouteCache() {
  const globalRecord = globalThis as typeof globalThis & {
    [OVERVIEW_ROUTE_CACHE_KEY]?: Map<string, OverviewRouteCacheEntry>;
  };
  if (!(OVERVIEW_ROUTE_CACHE_KEY in globalRecord)) {
    globalRecord[OVERVIEW_ROUTE_CACHE_KEY] = new Map();
  }
  return globalRecord[OVERVIEW_ROUTE_CACHE_KEY]!;
}

function buildOverviewRouteCacheKey(request: Request) {
  return request.headers.get('authorization') || '';
}

export function getCachedAdminOverviewRouteResponse(request: Request) {
  const cache = getOverviewRouteCache();
  const key = buildOverviewRouteCacheKey(request);
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.savedAt >= OVERVIEW_ROUTE_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return cached.payload;
}

export function setCachedAdminOverviewRouteResponse(
  request: Request,
  payload: SafetyAdminOverviewResponse,
) {
  getOverviewRouteCache().set(buildOverviewRouteCacheKey(request), {
    payload,
    savedAt: Date.now(),
  });
}

export function invalidateAdminOverviewRouteCache() {
  getOverviewRouteCache().clear();
}
