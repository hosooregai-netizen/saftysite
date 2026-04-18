'use client';

/**
 * Dashboard bootstrap caches support shell hydration only.
 * They are intentionally separate from section-owned caches such as
 * `overview`, `analytics:*`, `reports:*`, and `schedule-*`.
 */
export const ADMIN_DASHBOARD_BOOTSTRAP_REPORT_LIST_CACHE_KEY = 'bootstrap:report-list';
export const ADMIN_DASHBOARD_BOOTSTRAP_SITES_CACHE_KEY = 'bootstrap:sites-data';
export const ADMIN_DASHBOARD_BOOTSTRAP_MAILBOX_DIRECTORY_CACHE_KEY = 'bootstrap:mailbox-directory';

/**
 * Legacy keys are still cleared during invalidation so existing sessions
 * do not retain stale bootstrap payloads after the namespace split.
 */
export const ADMIN_DASHBOARD_BOOTSTRAP_LEGACY_CACHE_KEYS = [
  'report-list',
  'sites-data',
  'mailbox-directory',
] as const;
