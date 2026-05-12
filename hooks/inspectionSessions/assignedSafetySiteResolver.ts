import type { SafetySite } from '@/types/backend';

export interface AssignedSafetySiteResolverDeps {
  fetchAssignedSafetySites: () => Promise<SafetySite[]>;
  fetchSafetySiteDetail: (siteId: string) => Promise<SafetySite>;
  getAssignedSafetySite: (siteId: string) => SafetySite | null;
  hasAssignedSafetySiteDetail: (siteId: string) => boolean;
  replaceAssignedSafetySites: (sites: SafetySite[]) => void;
  upsertAssignedSafetySiteDetail: (site: SafetySite) => void;
  replaceAssignedSitesInStore: (sites: SafetySite[]) => void;
  upsertAssignedSitesIntoStore: (sites: SafetySite[]) => void;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasRegisteredContractWindow(site: SafetySite) {
  return Boolean(
    normalizeText(site.contract_start_date) &&
      normalizeText(site.contract_end_date),
  );
}

export async function resolveAssignedSafetySite(
  siteId: string,
  deps: AssignedSafetySiteResolverDeps,
): Promise<SafetySite | null> {
  const cached = deps.getAssignedSafetySite(siteId);
  if (
    cached &&
    deps.hasAssignedSafetySiteDetail(siteId) &&
    hasRegisteredContractWindow(cached)
  ) {
    deps.upsertAssignedSitesIntoStore([cached]);
    return cached;
  }

  let summarySite = cached;
  if (!summarySite) {
    const summarySites = await deps.fetchAssignedSafetySites();
    deps.replaceAssignedSafetySites(summarySites);
    deps.replaceAssignedSitesInStore(summarySites);
    summarySite = deps.getAssignedSafetySite(siteId);
    if (!summarySite) {
      return null;
    }
  } else {
    deps.upsertAssignedSitesIntoStore([summarySite]);
  }

  try {
    const detailedSite = await deps.fetchSafetySiteDetail(siteId);
    deps.upsertAssignedSafetySiteDetail(detailedSite);
    deps.upsertAssignedSitesIntoStore([detailedSite]);
    return deps.getAssignedSafetySite(siteId) ?? detailedSite;
  } catch {
    return summarySite;
  }
}
