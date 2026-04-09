import { saveBlobAsFile } from '@/lib/api';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { TableExportColumn } from '@/types/admin';

interface ExportSheetInput {
  columns: TableExportColumn[];
  name: string;
  rows: Array<Record<string, unknown>>;
}

interface ServerExportFilters {
  [key: string]: string | number | boolean | null | undefined;
}

function getTimestampToken() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hour}${minute}`;
}

function getFilename(section: string) {
  return `admin-${section}-${getTimestampToken()}.xlsx`;
}

function getFilenameFromDisposition(header: string | null, fallback: string) {
  if (!header) {
    return fallback;
  }

  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return fallback;
    }
  }

  const plainMatch = header.match(/filename=\"?([^\";]+)\"?/i);
  return plainMatch?.[1]?.trim() || fallback;
}

export async function exportAdminWorkbook(
  section: string,
  sheets: ExportSheetInput[],
  filename = getFilename(section),
) {
  const token = readSafetyAuthToken();
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api/admin/exports/${encodeURIComponent(section)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filename,
      sheets,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody === 'object' && 'error' in errorBody
        ? String(errorBody.error)
        : response.statusText;
    throw new Error(message || '엑셀 내보내기에 실패했습니다.');
  }

  const blob = await response.blob();
  saveBlobAsFile(blob, filename);
}

export async function exportAdminServerWorkbook(
  section: string,
  filters: ServerExportFilters = {},
  filename = getFilename(section),
) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const response = await fetch(`/api/admin/exports/${encodeURIComponent(section)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename,
      filters,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody === 'object' && 'error' in errorBody
        ? String(errorBody.error)
        : response.statusText;
    throw new Error(message || '엑셀 내보내기에 실패했습니다.');
  }

  const blob = await response.blob();
  saveBlobAsFile(blob, filename);
}

export async function downloadAdminSiteBasicMaterial(siteId: string, fallbackFilename?: string) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const response = await fetch(`/api/admin/sites/${encodeURIComponent(siteId)}/basic-material`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody === 'object' && 'error' in errorBody
        ? String(errorBody.error)
        : response.statusText;
    throw new Error(message || '기초자료 다운로드에 실패했습니다.');
  }

  const blob = await response.blob();
  const filename = getFilenameFromDisposition(
    response.headers.get('content-disposition'),
    fallbackFilename || `site-basic-material-${getTimestampToken()}.xlsx`,
  );
  saveBlobAsFile(blob, filename);
}
