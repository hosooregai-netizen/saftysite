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

export function buildWorkerPickerHref(intent: WorkerSitePickerIntent): string {
  return intent === 'quarterly' ? '/quarterly' : '/bad-workplace';
}

export function parseWorkerSiteEntryIntent(
  value: string | null | undefined,
): WorkerSitePickerIntent | null {
  if (value === 'quarterly' || value === 'bad-workplace') {
    return value;
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
