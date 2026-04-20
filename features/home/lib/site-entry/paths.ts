export type WorkerSiteEntryIntent = 'site' | 'quarterly' | 'bad-workplace';
export type WorkerSitePickerIntent = Exclude<WorkerSiteEntryIntent, 'site'>;

export function buildSiteReportsHref(siteId: string): string {
  return `/sites/${encodeURIComponent(siteId)}`;
}

export function buildSiteHubHref(
  siteId: string,
  intent: WorkerSiteEntryIntent = 'site',
): string {
  const basePath = `/sites/${encodeURIComponent(siteId)}/entry`;
  if (intent === 'site') {
    return basePath;
  }

  const searchParams = new URLSearchParams();
  searchParams.set('entry', intent);
  return `${basePath}?${searchParams.toString()}`;
}

export function buildSiteQuarterlyHref(siteId: string, quarterKey: string): string {
  return `/sites/${encodeURIComponent(siteId)}/quarterly/${encodeURIComponent(quarterKey)}`;
}

export function buildSiteQuarterlyListHref(siteId: string): string {
  return `/sites/${encodeURIComponent(siteId)}/quarterly`;
}

export function buildSiteBadWorkplaceHref(siteId: string, reportMonth: string): string {
  return `/sites/${encodeURIComponent(siteId)}/bad-workplace/${encodeURIComponent(reportMonth)}`;
}

export function buildSitePhotoAlbumHref(
  siteId: string,
  query: Record<string, string | null | undefined> = {},
): string {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      searchParams.set(key, value);
    }
  });
  const queryString = searchParams.toString();
  const basePath = `/sites/${encodeURIComponent(siteId)}/photos`;
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildWorkerCalendarHref(siteId?: string | null): string {
  if (!siteId) return '/calendar';
  const searchParams = new URLSearchParams({ siteId });
  return `/calendar?${searchParams.toString()}`;
}

export function buildWorkerPickerHref(intent: WorkerSitePickerIntent): string {
  return intent === 'quarterly' ? '/quarterly' : '/bad-workplace';
}

export function buildMobileHomeHref(): string {
  return '/mobile';
}

export function buildMobileCalendarHref(): string {
  return '/mobile/calendar';
}

export function buildMobileMailboxHref(box: 'inbox' | 'sent' = 'inbox'): string {
  const searchParams = new URLSearchParams();
  if (box !== 'inbox') {
    searchParams.set('box', box);
  }
  const queryString = searchParams.toString();
  return queryString ? `/mobile/mailbox?${queryString}` : '/mobile/mailbox';
}

export function buildMobileSiteHomeHref(siteId: string): string {
  return `/mobile/sites/${encodeURIComponent(siteId)}`;
}

export function buildMobileSiteReportsHref(siteId: string): string {
  return `${buildMobileSiteHomeHref(siteId)}/reports`;
}

export function buildMobileSitePhotoAlbumHref(siteId: string): string {
  return `${buildMobileSiteHomeHref(siteId)}/photos`;
}

export function buildMobileSiteQuarterlyListHref(siteId: string): string {
  return `${buildMobileSiteHomeHref(siteId)}/quarterly`;
}

export function buildMobileSiteQuarterlyHref(siteId: string, quarterKey: string): string {
  return `${buildMobileSiteQuarterlyListHref(siteId)}/${encodeURIComponent(quarterKey)}`;
}

export function buildMobileSiteBadWorkplaceHref(siteId: string, reportMonth: string): string {
  return `${buildMobileSiteHomeHref(siteId)}/bad-workplace/${encodeURIComponent(reportMonth)}`;
}

export function buildMobileSessionHref(
  sessionId: string,
  query: Record<string, string | null | undefined> = {},
): string {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      searchParams.set(key, value);
    }
  });
  const queryString = searchParams.toString();
  const basePath = `/mobile/sessions/${encodeURIComponent(sessionId)}`;
  return queryString ? `${basePath}?${queryString}` : basePath;
}
