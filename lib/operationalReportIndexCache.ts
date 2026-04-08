'use client';

import { deletePersistedValue } from '@/lib/clientPersistence';
import {
  mapSafetyOperationalBadWorkplaceIndexItem,
  mapSafetyOperationalQuarterlyIndexItem,
} from '@/lib/erpReports/mappers';
import { readOwnedPersistedValue, writeOwnedPersistedValue } from '@/lib/ownedPersistence';
import { fetchSafetyOperationalReportIndex } from '@/lib/safetyApi';
import type { SafetySiteOperationalReportIndexResponse } from '@/types/backend';
import type {
  OperationalBadWorkplaceIndexItem,
  OperationalQuarterlyIndexItem,
} from '@/types/erpReports';

export interface SiteOperationalReportIndexCacheEntry {
  quarterlyReports: OperationalQuarterlyIndexItem[];
  badWorkplaceReports: OperationalBadWorkplaceIndexItem[];
  fetchedAt: string;
}

type PersistedOperationalReportIndexState = Record<
  string,
  SiteOperationalReportIndexCacheEntry
>;

const OPERATIONAL_REPORT_INDEX_STORAGE_KEY = 'site-operational-report-index-v1';
const operationalIndexCache = new Map<string, SiteOperationalReportIndexCacheEntry>();
const operationalIndexRequests = new Map<
  string,
  Promise<SiteOperationalReportIndexCacheEntry>
>();
const operationalIndexListeners = new Map<
  string,
  Set<(entry: SiteOperationalReportIndexCacheEntry | null) => void>
>();
const hydratedOwnerIds = new Set<string>();

function buildOwnerSiteKey(ownerId: string, siteId: string) {
  return `${ownerId}::${siteId}`;
}

function notifyOperationalIndexListeners(ownerId: string, siteId: string) {
  const key = buildOwnerSiteKey(ownerId, siteId);
  const listeners = operationalIndexListeners.get(key);
  if (!listeners || listeners.size === 0) {
    return;
  }

  const entry = normalizeCacheEntry(operationalIndexCache.get(key));
  listeners.forEach((listener) => {
    listener(entry);
  });
}

function toPersistedOwnerState(ownerId: string) {
  const persisted: PersistedOperationalReportIndexState = {};
  const prefix = `${ownerId}::`;

  operationalIndexCache.forEach((value, key) => {
    if (!key.startsWith(prefix)) {
      return;
    }

    persisted[key.slice(prefix.length)] = value;
  });

  return persisted;
}

async function persistOwnerState(ownerId: string) {
  if (!ownerId) {
    await deletePersistedValue(OPERATIONAL_REPORT_INDEX_STORAGE_KEY);
    return;
  }

  const nextState = toPersistedOwnerState(ownerId);
  if (Object.keys(nextState).length === 0) {
    await deletePersistedValue(OPERATIONAL_REPORT_INDEX_STORAGE_KEY);
    return;
  }

  await writeOwnedPersistedValue(
    OPERATIONAL_REPORT_INDEX_STORAGE_KEY,
    ownerId,
    nextState,
  );
}

function normalizeCacheEntry(
  entry: SiteOperationalReportIndexCacheEntry | null | undefined,
): SiteOperationalReportIndexCacheEntry | null {
  if (!entry) {
    return null;
  }

  if (
    !Array.isArray(entry.quarterlyReports) ||
    !Array.isArray(entry.badWorkplaceReports) ||
    typeof entry.fetchedAt !== 'string'
  ) {
    return null;
  }

  return {
    quarterlyReports: [...entry.quarterlyReports],
    badWorkplaceReports: [...entry.badWorkplaceReports],
    fetchedAt: entry.fetchedAt,
  };
}

function sortQuarterlyReports(items: OperationalQuarterlyIndexItem[]) {
  return [...items].sort((left, right) => {
    const timeDelta =
      new Date(right.updatedAt || right.lastCalculatedAt || right.createdAt).getTime() -
      new Date(left.updatedAt || left.lastCalculatedAt || left.createdAt).getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function sortBadWorkplaceReports(items: OperationalBadWorkplaceIndexItem[]) {
  return [...items].sort((left, right) => {
    const monthDelta = right.reportMonth.localeCompare(left.reportMonth);
    if (monthDelta !== 0) {
      return monthDelta;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function mapBackendResponse(
  response: SafetySiteOperationalReportIndexResponse,
): SiteOperationalReportIndexCacheEntry {
  const quarterlyReports = sortQuarterlyReports(
    response.quarterly_reports
      .map((item) =>
        mapSafetyOperationalQuarterlyIndexItem({
          report_key: item.report_key,
          report_title: item.report_title,
          site_id: item.site_id,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          meta: {
            periodStartDate: item.period_start_date,
            periodEndDate: item.period_end_date,
            quarterKey: item.quarter_key,
            year: item.year,
            quarter: item.quarter,
            status: item.status,
            lastCalculatedAt: item.last_calculated_at,
          },
          selected_report_count: item.selected_report_count,
          last_calculated_at: item.last_calculated_at,
        }),
      )
      .filter((item): item is OperationalQuarterlyIndexItem => Boolean(item)),
  );
  const badWorkplaceReports = sortBadWorkplaceReports(
    response.bad_workplace_reports
      .map((item) =>
        mapSafetyOperationalBadWorkplaceIndexItem({
          report_key: item.report_key,
          report_title: item.report_title,
          site_id: item.site_id,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          meta: {
            reportMonth: item.report_month,
            reporterUserId: item.reporter_user_id,
            reporterName: item.reporter_name,
            status: item.status,
          },
          report_month: item.report_month,
          reporter_user_id: item.reporter_user_id,
          reporter_name: item.reporter_name,
          source_finding_count: item.source_finding_count,
          violation_count: item.violation_count,
        }),
      )
      .filter((item): item is OperationalBadWorkplaceIndexItem => Boolean(item)),
  );

  return {
    quarterlyReports,
    badWorkplaceReports,
    fetchedAt: new Date().toISOString(),
  };
}

export function getCachedOperationalReportIndex(
  ownerId: string | null | undefined,
  siteId: string | null | undefined,
) {
  if (!ownerId || !siteId) {
    return null;
  }

  return normalizeCacheEntry(operationalIndexCache.get(buildOwnerSiteKey(ownerId, siteId)));
}

export async function hydrateOperationalReportIndexOwner(ownerId: string) {
  if (!ownerId || hydratedOwnerIds.has(ownerId)) {
    return;
  }

  const persisted = await readOwnedPersistedValue<PersistedOperationalReportIndexState>(
    OPERATIONAL_REPORT_INDEX_STORAGE_KEY,
    ownerId,
  );

  Object.entries(persisted ?? {}).forEach(([siteId, entry]) => {
    const normalized = normalizeCacheEntry(entry);
    if (normalized) {
      operationalIndexCache.set(buildOwnerSiteKey(ownerId, siteId), normalized);
      notifyOperationalIndexListeners(ownerId, siteId);
    }
  });

  hydratedOwnerIds.add(ownerId);
}

export async function fetchAndCacheOperationalReportIndex(
  token: string,
  ownerId: string,
  siteId: string,
  options?: { force?: boolean },
) {
  const requestKey = buildOwnerSiteKey(ownerId, siteId);
  if (!options?.force) {
    const inFlightRequest = operationalIndexRequests.get(requestKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }
  }

  const request = fetchSafetyOperationalReportIndex(token, siteId)
    .then((response) => {
      const nextCache = mapBackendResponse(response);
      operationalIndexCache.set(requestKey, nextCache);
      notifyOperationalIndexListeners(ownerId, siteId);
      void persistOwnerState(ownerId);
      return nextCache;
    })
    .finally(() => {
      operationalIndexRequests.delete(requestKey);
    });

  operationalIndexRequests.set(requestKey, request);
  return request;
}

export async function invalidateOperationalReportIndex(
  ownerId: string,
  siteId: string,
) {
  operationalIndexCache.delete(buildOwnerSiteKey(ownerId, siteId));
  notifyOperationalIndexListeners(ownerId, siteId);
  await persistOwnerState(ownerId);
}

export async function clearOperationalReportIndexCaches() {
  const keys = [...operationalIndexListeners.keys()];
  operationalIndexCache.clear();
  operationalIndexRequests.clear();
  hydratedOwnerIds.clear();
  keys.forEach((key) => {
    const listeners = operationalIndexListeners.get(key);
    listeners?.forEach((listener) => listener(null));
  });
  await deletePersistedValue(OPERATIONAL_REPORT_INDEX_STORAGE_KEY);
}

export function subscribeOperationalReportIndex(
  ownerId: string | null | undefined,
  siteId: string | null | undefined,
  listener: (entry: SiteOperationalReportIndexCacheEntry | null) => void,
) {
  if (!ownerId || !siteId) {
    return () => {};
  }

  const key = buildOwnerSiteKey(ownerId, siteId);
  const listeners = operationalIndexListeners.get(key) ?? new Set();
  listeners.add(listener);
  operationalIndexListeners.set(key, listeners);

  return () => {
    const currentListeners = operationalIndexListeners.get(key);
    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);
    if (currentListeners.size === 0) {
      operationalIndexListeners.delete(key);
    }
  };
}
