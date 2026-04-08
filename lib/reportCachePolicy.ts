'use client';

export const REPORT_INDEX_SOFT_TTL_MS = 1000 * 60 * 5;
export const REPORT_INDEX_HARD_TTL_MS = 1000 * 60 * 60 * 24;

export type ReportCacheFreshness = 'missing' | 'fresh' | 'stale' | 'expired';

export function getReportCacheFreshness(
  fetchedAt: string | number | null | undefined,
  now = Date.now(),
): ReportCacheFreshness {
  if (typeof fetchedAt === 'number') {
    if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) {
      return 'missing';
    }

    const ageMs = now - fetchedAt;
    if (ageMs < 0) {
      return 'fresh';
    }
    if (ageMs <= REPORT_INDEX_SOFT_TTL_MS) {
      return 'fresh';
    }
    if (ageMs <= REPORT_INDEX_HARD_TTL_MS) {
      return 'stale';
    }
    return 'expired';
  }

  if (typeof fetchedAt !== 'string' || !fetchedAt.trim()) {
    return 'missing';
  }

  const parsed = new Date(fetchedAt).getTime();
  if (Number.isNaN(parsed)) {
    return 'missing';
  }

  return getReportCacheFreshness(parsed, now);
}

export function shouldUseBlockingReload(options: {
  force?: boolean;
  freshness: ReportCacheFreshness;
  hasVisibleData: boolean;
}) {
  if (options.force) {
    return true;
  }

  if (!options.hasVisibleData) {
    return true;
  }

  return options.freshness === 'missing' || options.freshness === 'expired';
}

export function shouldSurfaceCacheError(options: {
  force?: boolean;
  hasVisibleData: boolean;
}) {
  return Boolean(options.force || !options.hasVisibleData);
}
