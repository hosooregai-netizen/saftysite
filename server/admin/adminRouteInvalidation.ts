import { invalidateAdminOverviewRouteCache } from './overviewRouteCache';
import { invalidateAdminReportsRouteCache } from './reportsRouteCache';

export interface AdminRouteInvalidationTargets {
  overview: boolean;
  reports: boolean;
}

function isWriteMethod(method: string) {
  const normalizedMethod = method.toUpperCase();
  return normalizedMethod === 'POST' ||
    normalizedMethod === 'PATCH' ||
    normalizedMethod === 'PUT' ||
    normalizedMethod === 'DELETE';
}

export function resolveAdminRouteInvalidationTargets(
  path: string[],
  method: string,
): AdminRouteInvalidationTargets {
  if (!isWriteMethod(method)) {
    return { overview: false, reports: false };
  }

  const [root] = path;
  const touchesReports =
    root === 'reports' ||
    root === 'assignments' ||
    root === 'headquarters' ||
    root === 'sites' ||
    root === 'users';

  return {
    overview: touchesReports,
    reports: touchesReports,
  };
}

export function invalidateAdminRouteCaches(targets: AdminRouteInvalidationTargets) {
  if (targets.reports) {
    invalidateAdminReportsRouteCache();
  }
  if (targets.overview) {
    invalidateAdminOverviewRouteCache();
  }
}

export function invalidateAdminOverviewAndReportsRouteCaches() {
  invalidateAdminRouteCaches({ overview: true, reports: true });
}
