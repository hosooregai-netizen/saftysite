export type WorkerSiteEntryIntent = 'site' | 'quarterly' | 'bad-workplace';
export type WorkerSitePickerIntent = Exclude<WorkerSiteEntryIntent, 'site'>;
export type SiteNavView =
  | 'site-home'
  | 'reports'
  | 'quarterly'
  | 'photos'
  | 'bad-workplace'
  | null;

type SearchParamsLike = {
  get: (key: string) => string | null;
};

export function buildSiteReportsHref(siteId: string): string {
  return `/sites/${encodeURIComponent(siteId)}`;
}

export function buildSiteHubHref(
  siteId: string,
  intent: WorkerSiteEntryIntent = 'site',
): string {
  if (intent === 'site') {
    return `/sites/${encodeURIComponent(siteId)}`;
  }

  const basePath = `/sites/${encodeURIComponent(siteId)}/entry`;
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

export function buildMobileSiteHomeHref(siteId: string): string {
  return `/mobile/sites/${encodeURIComponent(siteId)}`;
}

export function buildMobileSiteReportsHref(siteId: string): string {
  return `${buildMobileSiteHomeHref(siteId)}/reports`;
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

export function resolveWorkerMobileSwitchHref({
  pathname,
  searchParams = null,
}: {
  pathname: string | null;
  searchParams?: SearchParamsLike | null;
}): string {
  if (!pathname) {
    return buildMobileHomeHref();
  }

  const sessionMatch = pathname.match(/^\/sessions\/([^/]+)/);
  if (sessionMatch) {
    return buildMobileSessionHref(decodeURIComponent(sessionMatch[1]));
  }

  if (pathname === '/' || pathname === '/quarterly' || pathname === '/bad-workplace') {
    return buildMobileHomeHref();
  }

  const siteKey = getSiteKeyFromPath(pathname);
  if (siteKey) {
    const encodedSiteKey = encodeURIComponent(siteKey);
    if (pathname === `/sites/${encodedSiteKey}`) {
      return buildMobileSiteReportsHref(siteKey);
    }

    return buildMobileSiteHomeHref(siteKey);
  }

  const selectedSiteId = searchParams?.get('siteId');
  if (selectedSiteId) {
    return buildMobileSiteHomeHref(selectedSiteId);
  }

  return buildMobileHomeHref();
}

export function parseWorkerSiteEntryIntent(
  value: string | null | undefined,
): WorkerSitePickerIntent | null {
  if (value === 'quarterly' || value === 'bad-workplace') {
    return value;
  }

  return null;
}

export function getSiteKeyFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const matched = pathname.match(/^\/sites\/([^/]+)/);
  return matched ? decodeURIComponent(matched[1]) : null;
}

export function resolveSiteNavView({
  pathname,
  siteKey,
  activeAdminSection = null,
  selectedAdminSiteId = null,
}: {
  pathname: string | null;
  siteKey?: string | null;
  activeAdminSection?: string | null;
  selectedAdminSiteId?: string | null;
}): SiteNavView {
  if (!pathname || !siteKey) return null;

  const encodedSiteKey = encodeURIComponent(siteKey);

  if (pathname.startsWith(`/sites/${encodedSiteKey}/bad-workplace/`)) {
    return 'bad-workplace';
  }

  if (
    pathname === buildSiteQuarterlyListHref(siteKey) ||
    pathname.startsWith(`/sites/${encodedSiteKey}/quarterly/`)
  ) {
    return 'quarterly';
  }

  if (pathname === buildSitePhotoAlbumHref(siteKey)) {
    return 'photos';
  }

  if (pathname === buildSiteReportsHref(siteKey) || pathname.startsWith('/sessions/')) {
    return 'reports';
  }

  if (pathname === buildSiteHubHref(siteKey)) {
    return 'site-home';
  }

  if (
    pathname === '/admin' &&
    activeAdminSection === 'photos' &&
    selectedAdminSiteId === siteKey
  ) {
    return 'photos';
  }

  if (
    pathname === '/admin' &&
    activeAdminSection === 'headquarters' &&
    selectedAdminSiteId === siteKey
  ) {
    return 'site-home';
  }

  return null;
}

export function getWorkerSiteEntryTitle(intent: WorkerSitePickerIntent): string {
  return intent === 'quarterly' ? '분기 종합보고서' : '불량사업장 신고';
}

export function getWorkerSiteEntryDescription(intent: WorkerSitePickerIntent): string {
  return intent === 'quarterly'
    ? '먼저 현장을 선택한 뒤 해당 현장 컨텍스트 안에서 분기와 기술지도 보고서를 이어서 확인하세요.'
    : '먼저 현장을 선택한 뒤 해당 현장 컨텍스트 안에서 최근 기술지도 보고서를 바탕으로 신고 초안을 작성하세요.';
}

export function getWorkerSiteEntryLabel(intent: WorkerSiteEntryIntent): string {
  if (intent === 'quarterly') return '분기 종합보고서';
  if (intent === 'bad-workplace') return '불량사업장 신고';
  return '현장 목록';
}
