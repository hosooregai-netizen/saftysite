import type { AdminSectionKey } from '@/lib/admin';

export const EXCEL_UPLOAD_QUERY_VALUE = 'excel';
export const LEGACY_EXCEL_UPLOAD_QUERY_VALUE = 'k2b';

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

export function buildAdminExcelUploadHref(
  currentSearchParams: SearchParamLike | null | undefined,
  options: {
    headquarterId?: string | null;
    section?: AdminSectionKey;
    siteId?: string | null;
  } = {},
): string {
  return buildAdminSearchHref({
    currentSearchParams,
    excelUpload: EXCEL_UPLOAD_QUERY_VALUE,
    headquarterId: options.headquarterId,
    section: options.section ?? 'headquarters',
    siteId: options.siteId,
  });
}

export function buildAdminExcelUploadCloseHref(
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

export function isExcelUploadOpen(currentSearchParams: SearchParamLike | null | undefined): boolean {
  const value = currentSearchParams?.get('excelUpload');
  return value === EXCEL_UPLOAD_QUERY_VALUE || value === LEGACY_EXCEL_UPLOAD_QUERY_VALUE;
}
