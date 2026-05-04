import type { SafetyInspectionSchedule } from '@/types/admin';

interface WorkerCalendarSiteOption {
  id: string;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function pushUnique(target: string[], seen: Set<string>, value: string) {
  const normalized = normalizeText(value);
  if (!normalized || seen.has(normalized)) return;
  seen.add(normalized);
  target.push(normalized);
}

function getTimeMs(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = normalizeText(value);
  if (!normalized) return 0;
  const parsed = new Date(normalized).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function buildWorkerCalendarReportIndexSiteIds(input: {
  rows: Array<Pick<SafetyInspectionSchedule, 'siteId'>>;
  selectedSiteId?: string;
  sites: WorkerCalendarSiteOption[];
}) {
  const selectedSiteId = normalizeText(input.selectedSiteId);
  if (selectedSiteId) {
    return input.sites.some((site) => site.id === selectedSiteId) ? [selectedSiteId] : [];
  }

  const knownSiteIds = new Set(input.sites.map((site) => site.id));
  const seen = new Set<string>();
  const siteIds: string[] = [];

  input.rows.forEach((row) => {
    const siteId = normalizeText(row.siteId);
    if (!knownSiteIds.has(siteId)) return;
    pushUnique(siteIds, seen, siteId);
  });

  return siteIds;
}

export function shouldUseWorkerCalendarReportItems(input: {
  fetchedAt?: string | number | null;
  loadedAfterMs?: number;
  readySiteIds: ReadonlySet<string>;
  siteId: string;
  status?: string;
}) {
  const siteId = normalizeText(input.siteId);
  if (!siteId || !input.readySiteIds.has(siteId) || input.status !== 'loaded') {
    return false;
  }
  if (input.loadedAfterMs && getTimeMs(input.fetchedAt) < input.loadedAfterMs) {
    return false;
  }
  return true;
}
