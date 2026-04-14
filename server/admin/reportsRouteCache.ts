import type { SafetyAdminReportsResponse } from '@/types/admin';

const REPORTS_ROUTE_CACHE_TTL_MS = 1000 * 60;
const reportsRouteCache = new Map<
  string,
  {
    payload: SafetyAdminReportsResponse;
    savedAt: number;
  }
>();

function buildReportsRouteCacheKey(request: Request) {
  const url = new URL(request.url);
  return `${request.headers.get('authorization') || ''}:${url.searchParams.toString()}`;
}

export function getCachedAdminReportsRouteResponse(request: Request) {
  const cached = reportsRouteCache.get(buildReportsRouteCacheKey(request));
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.savedAt >= REPORTS_ROUTE_CACHE_TTL_MS) {
    reportsRouteCache.delete(buildReportsRouteCacheKey(request));
    return null;
  }

  return cached.payload;
}

export function setCachedAdminReportsRouteResponse(
  request: Request,
  payload: SafetyAdminReportsResponse,
) {
  reportsRouteCache.set(buildReportsRouteCacheKey(request), {
    payload,
    savedAt: Date.now(),
  });
}

export function invalidateAdminReportsRouteCache() {
  reportsRouteCache.clear();
}
