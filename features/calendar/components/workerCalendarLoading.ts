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
