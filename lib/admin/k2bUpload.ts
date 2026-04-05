import type { AdminSectionKey } from '@/lib/admin';

export const K2B_EXCEL_UPLOAD_VALUE = 'k2b';

type SearchParamLike = {
  get(name: string): string | null;
  toString(): string;
};

interface BuildAdminSearchHrefInput {
  section: AdminSectionKey;
  currentSearchParams?: SearchParamLike | null;
  excelUpload?: string | null;
  headquarterId?: string | null;
  siteId?: string | null;
}

function setOptionalParam(searchParams: URLSearchParams, key: string, value: string | null | undefined) {
  if (typeof value === 'string' && value.trim()) {
    searchParams.set(key, value);
    return;
  }
  searchParams.delete(key);
}

export function buildAdminSearchHref({
  section,
  currentSearchParams,
  excelUpload,
  headquarterId,
  siteId,
}: BuildAdminSearchHrefInput): string {
  const searchParams = new URLSearchParams(currentSearchParams?.toString() || '');
  searchParams.set('section', section);
  setOptionalParam(searchParams, 'excelUpload', excelUpload);
  setOptionalParam(searchParams, 'headquarterId', headquarterId);
  setOptionalParam(searchParams, 'siteId', siteId);
  return `/admin?${searchParams.toString()}`;
}

export function buildAdminK2bUploadHref(
  currentSearchParams: SearchParamLike | null | undefined,
  options: {
    headquarterId?: string | null;
    section?: AdminSectionKey;
    siteId?: string | null;
  } = {},
): string {
  return buildAdminSearchHref({
    currentSearchParams,
    excelUpload: K2B_EXCEL_UPLOAD_VALUE,
    headquarterId: options.headquarterId,
    section: options.section ?? 'headquarters',
    siteId: options.siteId,
  });
}

export function buildAdminK2bUploadCloseHref(
  currentSearchParams: SearchParamLike | null | undefined,
  options: {
    headquarterId?: string | null;
    section?: AdminSectionKey;
    siteId?: string | null;
  } = {},
): string {
  return buildAdminSearchHref({
    currentSearchParams,
    excelUpload: null,
    headquarterId: options.headquarterId,
    section: options.section ?? 'headquarters',
    siteId: options.siteId,
  });
}

export function isK2bUploadOpen(currentSearchParams: SearchParamLike | null | undefined): boolean {
  return currentSearchParams?.get('excelUpload') === K2B_EXCEL_UPLOAD_VALUE;
}
