'use client';

import { deletePersistedValue } from '@/lib/clientPersistence';
import {
  mapSafetyOperationalBadWorkplaceIndexItem,
  mapSafetyOperationalQuarterlyIndexItem,
} from '@/lib/erpReports/mappers';
import { isReportDispatchCompleted, normalizeReportDispatchMeta } from '@/lib/reportDispatch';
import { readOwnedPersistedValue, writeOwnedPersistedValue } from '@/lib/ownedPersistence';
import { fetchSafetyOperationalReportIndex } from '@/lib/safetyApi';
import type { SafetyReport, SafetySiteOperationalReportIndexResponse } from '@/types/backend';
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
const operationalIndexRequestGenerations = new Map<string, number>();
const operationalIndexOwnerGenerations = new Map<string, number>();
const operationalIndexListeners = new Map<
  string,
  Set<(entry: SiteOperationalReportIndexCacheEntry | null) => void>
>();
const hydratedOwnerIds = new Set<string>();

function buildOwnerSiteKey(ownerId: string, siteId: string) {
  return `${ownerId}::${siteId}`;
}

function getOperationalIndexRequestGeneration(requestKey: string) {
  return operationalIndexRequestGenerations.get(requestKey) ?? 0;
}

function nextOperationalIndexRequestGeneration(requestKey: string) {
  const nextGeneration = getOperationalIndexRequestGeneration(requestKey) + 1;
  operationalIndexRequestGenerations.set(requestKey, nextGeneration);
  return nextGeneration;
}

function getOperationalIndexOwnerGeneration(ownerId: string) {
  return operationalIndexOwnerGenerations.get(ownerId) ?? 0;
}

function nextOperationalIndexOwnerGeneration(ownerId: string) {
  const nextGeneration = getOperationalIndexOwnerGeneration(ownerId) + 1;
  operationalIndexOwnerGenerations.set(ownerId, nextGeneration);
  return nextGeneration;
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function getStoredReportKind(report: SafetyReport) {
  const payload = asRecord(report.payload);
  const meta = asRecord(report.meta);
  return (
    normalizeText(payload.reportKind) ||
    normalizeText(meta.reportKind) ||
    normalizeText(report.report_type) ||
    normalizeText(report.document_kind)
  );
}

function getSelectedReportCount(report: SafetyReport) {
  const payload = asRecord(report.payload);
  const meta = asRecord(report.meta);
  if (Array.isArray(payload.generatedFromSessionIds)) {
    return payload.generatedFromSessionIds.length;
  }
  return (
    normalizeNonNegativeNumber(payload.selectedReportCount) ||
    normalizeNonNegativeNumber(payload.selected_report_count) ||
    normalizeNonNegativeNumber(meta.selectedReportCount) ||
    normalizeNonNegativeNumber(meta.selected_report_count)
  );
}

function mapSafetyReportToOperationalQuarterlyIndexItem(
  report: SafetyReport,
): OperationalQuarterlyIndexItem | null {
  const reportKind = getStoredReportKind(report);
  if (reportKind !== 'quarterly_summary' && reportKind !== 'quarterly_report') {
    return null;
  }

  const payload = asRecord(report.payload);
  const meta = asRecord(report.meta);
  const dispatch = normalizeReportDispatchMeta(report.dispatch ?? meta.dispatch ?? payload.dispatch);
  const dispatchCompleted =
    Boolean(report.dispatch_completed) || isReportDispatchCompleted(dispatch);
  const mapped = mapSafetyOperationalQuarterlyIndexItem({
    report_key: report.report_key,
    report_title: report.report_title,
    site_id: report.site_id,
    status: report.status,
    dispatch_completed: dispatchCompleted,
    created_at: report.created_at,
    updated_at: report.updated_at,
    meta: {
      ...meta,
      periodStartDate:
        normalizeText(meta.periodStartDate) || normalizeText(payload.periodStartDate),
      periodEndDate:
        normalizeText(meta.periodEndDate) || normalizeText(payload.periodEndDate),
      quarterKey: normalizeText(meta.quarterKey) || normalizeText(payload.quarterKey),
      year: meta.year ?? payload.year,
      quarter: meta.quarter ?? payload.quarter,
      status: meta.status ?? payload.status,
      lastCalculatedAt:
        normalizeText(meta.lastCalculatedAt) || normalizeText(payload.lastCalculatedAt),
    },
    selected_report_count: getSelectedReportCount(report),
    last_calculated_at:
      normalizeText(payload.lastCalculatedAt) ||
      normalizeText(meta.lastCalculatedAt) ||
      report.updated_at,
  });

  if (!mapped) {
    return null;
  }

  return {
    ...mapped,
    dispatchCompleted,
    dispatchStatus: dispatch.dispatchStatus || null,
    dispatch,
    meta: {
      ...meta,
      dispatch,
    },
  };
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
          dispatch_completed: item.dispatch_completed,
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
          dispatch_completed: item.dispatch_completed,
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

  const ownerGeneration = getOperationalIndexOwnerGeneration(ownerId);
  const persisted = await readOwnedPersistedValue<PersistedOperationalReportIndexState>(
    OPERATIONAL_REPORT_INDEX_STORAGE_KEY,
    ownerId,
  );

  if (ownerGeneration !== getOperationalIndexOwnerGeneration(ownerId)) {
    return;
  }

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

  const requestGeneration = nextOperationalIndexRequestGeneration(requestKey);
  const requestRef: { current: Promise<SiteOperationalReportIndexCacheEntry> | null } = {
    current: null,
  };
  const request = fetchSafetyOperationalReportIndex(token, siteId, {
    force: options?.force,
  })
    .then((response) => {
      const nextCache = mapBackendResponse(response);
      if (getOperationalIndexRequestGeneration(requestKey) !== requestGeneration) {
        const latestRequest = operationalIndexRequests.get(requestKey);
        if (latestRequest && latestRequest !== requestRef.current) {
          return latestRequest;
        }
        return normalizeCacheEntry(operationalIndexCache.get(requestKey)) ?? nextCache;
      }
      operationalIndexCache.set(requestKey, nextCache);
      notifyOperationalIndexListeners(ownerId, siteId);
      void persistOwnerState(ownerId);
      return nextCache;
    })
    .finally(() => {
      if (operationalIndexRequests.get(requestKey) === requestRef.current) {
        operationalIndexRequests.delete(requestKey);
      }
    });

  requestRef.current = request;
  operationalIndexRequests.set(requestKey, request);
  return request;
}

export function upsertOperationalQuarterlyReportIndexFromReport(
  ownerId: string | null | undefined,
  siteId: string | null | undefined,
  report: SafetyReport,
) {
  if (!ownerId || !siteId || report.site_id !== siteId) {
    return null;
  }

  const nextItem = mapSafetyReportToOperationalQuarterlyIndexItem(report);
  if (!nextItem) {
    return null;
  }

  const requestKey = buildOwnerSiteKey(ownerId, siteId);
  nextOperationalIndexOwnerGeneration(ownerId);
  nextOperationalIndexRequestGeneration(requestKey);

  const currentEntry = normalizeCacheEntry(operationalIndexCache.get(requestKey)) ?? {
    quarterlyReports: [],
    badWorkplaceReports: [],
    fetchedAt: new Date().toISOString(),
  };
  const replacedReports = currentEntry.quarterlyReports.map((item) =>
    item.id === report.report_key || item.id === report.id ? nextItem : item,
  );
  const hasExistingReport = replacedReports.some((item) => item.id === nextItem.id);
  const nextEntry = {
    quarterlyReports: sortQuarterlyReports(
      hasExistingReport ? replacedReports : [...replacedReports, nextItem],
    ),
    badWorkplaceReports: [...currentEntry.badWorkplaceReports],
    fetchedAt: new Date().toISOString(),
  };

  operationalIndexCache.set(requestKey, nextEntry);
  notifyOperationalIndexListeners(ownerId, siteId);
  void persistOwnerState(ownerId).catch(() => {
    // Dispatch success should not fail because browser persistence is unavailable.
  });
  return normalizeCacheEntry(nextEntry);
}

export async function invalidateOperationalReportIndex(
  ownerId: string,
  siteId: string,
) {
  const requestKey = buildOwnerSiteKey(ownerId, siteId);
  nextOperationalIndexOwnerGeneration(ownerId);
  nextOperationalIndexRequestGeneration(requestKey);
  operationalIndexCache.delete(requestKey);
  operationalIndexRequests.delete(requestKey);
  notifyOperationalIndexListeners(ownerId, siteId);
  await persistOwnerState(ownerId);
}

export async function clearOperationalReportIndexCaches() {
  const keys = [...operationalIndexListeners.keys()];
  operationalIndexCache.clear();
  operationalIndexRequests.clear();
  operationalIndexRequestGenerations.clear();
  operationalIndexOwnerGenerations.clear();
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
