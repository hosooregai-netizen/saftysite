import type { SafetyAdminOverviewResponse } from '@/types/admin';

const OVERVIEW_ROUTE_IN_FLIGHT_KEY = '__SAFETY_ADMIN_OVERVIEW_ROUTE_IN_FLIGHT__';

function getOverviewRouteInFlight() {
  const globalRecord = globalThis as typeof globalThis & {
    [OVERVIEW_ROUTE_IN_FLIGHT_KEY]?: Map<string, Promise<SafetyAdminOverviewResponse>>;
  };
  if (!(OVERVIEW_ROUTE_IN_FLIGHT_KEY in globalRecord)) {
    globalRecord[OVERVIEW_ROUTE_IN_FLIGHT_KEY] = new Map();
  }
  return globalRecord[OVERVIEW_ROUTE_IN_FLIGHT_KEY]!;
}

function buildOverviewRouteCacheKey(request: Request) {
  const includeFullRows = new URL(request.url).searchParams.get('include_full_rows') === 'true';
  return `${request.headers.get('authorization') || ''}:includeFullRows=${includeFullRows}`;
}

export function readOrCreateAdminOverviewRouteResponse(
  request: Request,
  loader: () => Promise<SafetyAdminOverviewResponse>,
) {
  const cacheKey = buildOverviewRouteCacheKey(request);
  const inFlight = getOverviewRouteInFlight();
  const existing = inFlight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const nextRequest = Promise.resolve(loader()).finally(() => {
    inFlight.delete(cacheKey);
  });
  inFlight.set(cacheKey, nextRequest);
  return nextRequest;
}

export function invalidateAdminOverviewRouteCache() {
  getOverviewRouteInFlight().clear();
}
