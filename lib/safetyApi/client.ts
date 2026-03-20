import { buildSafetyApiUrl } from './config';

export class SafetyApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'SafetyApiError';
    this.status = status;
  }
}

function formatRequestLabel(path: string, method?: string): string {
  const normalizedMethod = (method || 'GET').toUpperCase();
  return `${normalizedMethod} ${path}`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      const detail = payload.detail;

      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item) => {
            if (!item || typeof item !== 'object') return '';
            const record = item as Record<string, unknown>;
            return typeof record.msg === 'string' ? record.msg : '';
          })
          .filter(Boolean)
          .join(', ');
      }
    } catch {
      return response.statusText || '요청 처리 중 오류가 발생했습니다.';
    }
  }

  const text = await response.text();
  return text || response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

export async function requestSafetyApi<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const requestLabel = formatRequestLabel(path, options.method);
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildSafetyApiUrl(path), {
      ...options,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    throw new SafetyApiError(
      error instanceof Error
        ? `${requestLabel} 요청 중 네트워크 오류가 발생했습니다. ${error.message}`
        : `${requestLabel} 요청 중 안전 API 서버에 연결하지 못했습니다.`,
      null
    );
  }

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
