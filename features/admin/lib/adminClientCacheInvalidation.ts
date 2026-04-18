'use client';

import {
  ADMIN_DASHBOARD_BOOTSTRAP_LEGACY_CACHE_KEYS,
  ADMIN_DASHBOARD_BOOTSTRAP_MAILBOX_DIRECTORY_CACHE_KEY,
  ADMIN_DASHBOARD_BOOTSTRAP_REPORT_LIST_CACHE_KEY,
  ADMIN_DASHBOARD_BOOTSTRAP_SITES_CACHE_KEY,
} from './adminDashboardBootstrapCache';
import {
  clearAdminSessionCache,
  clearAdminSessionCacheByPrefix,
} from './adminSessionCache';

function clearAdminSessionCacheKeys(
  scope: string | null | undefined,
  keys: string[],
) {
  keys.forEach((key) => clearAdminSessionCache(scope, key));
}

function clearAdminSessionCachePrefixes(
  scope: string | null | undefined,
  prefixes: string[],
) {
  prefixes.forEach((prefix) => clearAdminSessionCacheByPrefix(scope, prefix));
}

export function invalidateAdminReportMutationClientCaches(
  scope: string | null | undefined,
) {
  clearAdminSessionCacheKeys(scope, [
    'overview',
    ADMIN_DASHBOARD_BOOTSTRAP_REPORT_LIST_CACHE_KEY,
    ...ADMIN_DASHBOARD_BOOTSTRAP_LEGACY_CACHE_KEYS,
  ]);
  clearAdminSessionCachePrefixes(scope, ['reports:', 'analytics:']);
}

export function invalidateAdminDirectoryMutationClientCaches(
  scope: string | null | undefined,
) {
  invalidateAdminReportMutationClientCaches(scope);
  clearAdminSessionCacheKeys(scope, [
    'analytics-lookups',
    'directory-lookups',
    'schedule-lookups',
    ADMIN_DASHBOARD_BOOTSTRAP_MAILBOX_DIRECTORY_CACHE_KEY,
    ADMIN_DASHBOARD_BOOTSTRAP_SITES_CACHE_KEY,
  ]);
  clearAdminSessionCachePrefixes(scope, [
    'headquarters:list:',
    'schedule-calendar:',
    'schedule-queue:',
    'sites:list:',
    'users:list:',
  ]);
}
