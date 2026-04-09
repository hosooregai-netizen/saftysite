import { buildSafetyApiProxyUrl, buildSafetyApiUrl } from './config';
import { buildPublicSafetyApiUpstreamUrl } from './upstream';

const DEFAULT_SAFETY_API_TIMEOUT_MS = 12000;
const UPLOAD_SAFETY_API_TIMEOUT_MS = 45000;
const REPORT_UPSERT_SAFETY_API_TIMEOUT_MS = 45000;
const ERP_CONTEXT_SAFETY_API_TIMEOUT_MS = 30000;
const DEFAULT_GET_CACHE_TTL_MS = 5000;
const CONTENT_ITEMS_CACHE_TTL_MS = 60000;
const REPORTS_BY_SITE_CACHE_TTL_MS = 15000;
const AUTH_ME_CACHE_TTL_MS = 3000;
const ERP_DASHBOARD_CACHE_TTL_MS = 15000;
const ERP_DRAFT_CONTEXT_CACHE_TTL_MS = 15000;
const DIRECT_WRITE_ENABLED =
  typeof process.env.NEXT_PUBLIC_SAFETY_API_DIRECT_WRITE_ENABLED === 'string' &&
  ['1', 'true', 'yes', 'on'].includes(
    process.env.NEXT_PUBLIC_SAFETY_API_DIRECT_WRITE_ENABLED.trim().toLowerCase(),
  );

type JsonLike =
  | undefined
  | null
  | boolean
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike };

interface SafetyApiCacheEntry {
  expiresAt: number;
  value: JsonLike;
}

const responseCache = new Map<string, SafetyApiCacheEntry>();
const inFlightGetRequests = new Map<string, Promise<JsonLike>>();

export class SafetyApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'SafetyApiError';
    this.status = status;
  }
}

function cloneJsonLike<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getCacheKey(path: string, method: string, token?: string | null) {
  return `${method.toUpperCase()}::${token || 'anonymous'}::${path}`;
}

function getGetCacheTtlMs(path: string, method?: string): number {
  const normalizedMethod = (method || 'GET').toUpperCase();
  if (normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
    return 0;
  }

  if (path === '/auth/me') {
    return AUTH_ME_CACHE_TTL_MS;
  }

  if (path.includes('/content-items')) {
    return CONTENT_ITEMS_CACHE_TTL_MS;
  }

  if (path.includes('/dashboard')) {
    return ERP_DASHBOARD_CACHE_TTL_MS;
  }

  if (path.includes('/draft-context')) {
    return ERP_DRAFT_CONTEXT_CACHE_TTL_MS;
  }

  if (path.includes('/reports/site/') && path.endsWith('/full')) {
    return REPORTS_BY_SITE_CACHE_TTL_MS;
  }

  if (path.includes('/reports/site/') && path.endsWith('/operational-index')) {
    return REPORTS_BY_SITE_CACHE_TTL_MS;
  }

  if (path.startsWith('/reports?') || path.includes('/reports?site_id=')) {
    return REPORTS_BY_SITE_CACHE_TTL_MS;
  }

  return DEFAULT_GET_CACHE_TTL_MS;
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

function getSafetyApiTimeoutMs(path: string, options: RequestInit): number {
  if (path.includes('/assets/upload') || options.body instanceof FormData) {
    return UPLOAD_SAFETY_API_TIMEOUT_MS;
  }

  if (path === '/reports/upsert') {
    return REPORT_UPSERT_SAFETY_API_TIMEOUT_MS;
  }

  if (path.includes('/dashboard') || path.includes('/draft-context')) {
    return ERP_CONTEXT_SAFETY_API_TIMEOUT_MS;
  }

  return DEFAULT_SAFETY_API_TIMEOUT_MS;
}

interface SafetyApiRequestTarget {
  label: 'default' | 'direct' | 'proxy';
  url: string;
}

export function buildPreferredSafetyApiRequestTargets(path: string): SafetyApiRequestTarget[] {
  const defaultUrl = buildSafetyApiUrl(path);

  if (path !== '/reports/upsert') {
    return [{ label: 'default', url: defaultUrl }];
  }

  const proxiedUrl = buildSafetyApiProxyUrl(path);
  if (!DIRECT_WRITE_ENABLED) {
    return [{ label: 'proxy', url: proxiedUrl }];
  }

  const directUrl = buildPublicSafetyApiUpstreamUrl(path);
  if (!directUrl || directUrl === proxiedUrl) {
    return [{ label: 'proxy', url: proxiedUrl }];
  }

  return [
    { label: 'direct', url: directUrl },
    { label: 'proxy', url: proxiedUrl },
  ];
}

export async function requestSafetyApi<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const requestLabel = formatRequestLabel(path, method);
  const headers = new Headers(options.headers);
  const timeoutMs = getSafetyApiTimeoutMs(path, options);
  const cacheTtlMs = getGetCacheTtlMs(path, method);
  const cacheKey = getCacheKey(path, method, token);
  const now = Date.now();

  if (cacheTtlMs > 0) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cloneJsonLike(cached.value) as T;
    }

    const inFlightRequest = inFlightGetRequests.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest.then((value) => cloneJsonLike(value) as T);
    }
  } else if (method !== 'GET' && method !== 'HEAD') {
    responseCache.clear();
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`${requestLabel} 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`)
    );
  }, timeoutMs);
  const originalSignal = options.signal;

  if (originalSignal) {
    if (originalSignal.aborted) {
      abortController.abort(originalSignal.reason);
    } else {
      originalSignal.addEventListener(
        'abort',
        () => abortController.abort(originalSignal.reason),
        { once: true }
      );
    }
  }

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const executeRequest = async (): Promise<JsonLike> => {
    let response: Response | null = null;
    let responseTarget: SafetyApiRequestTarget | null = null;
    const failedTargets: Array<{ label: SafetyApiRequestTarget['label']; message: string }> = [];

    try {
      let lastNetworkError: unknown = null;

      for (const target of buildPreferredSafetyApiRequestTargets(path)) {
        try {
          response = await fetch(target.url, {
            ...options,
            headers,
            cache: 'no-store',
            signal: abortController.signal,
          });
          responseTarget = target;
          lastNetworkError = null;
          break;
        } catch (error) {
          failedTargets.push({
            label: target.label,
            message: error instanceof Error ? error.message : 'unknown network error',
          });
          lastNetworkError = error;
        }
      }

      if (!response) {
        throw lastNetworkError ?? new Error(`${requestLabel} request failed before receiving a response.`);
      }
    } catch (error) {
      const retryHint =
        failedTargets.length > 1
          ? ` 직접 경로와 프록시 경로를 모두 시도했습니다: ${failedTargets
              .map((item) => `${item.label}=${item.message}`)
              .join(', ')}`
          : failedTargets.length === 1
            ? ` 시도 경로(${failedTargets[0].label}) 오류: ${failedTargets[0].message}`
            : '';
      throw new SafetyApiError(
        error instanceof Error
          ? `${requestLabel} 요청 중 네트워크 오류가 발생했습니다. ${error.message}${retryHint}`
          : `${requestLabel} 요청 중 안전 API 서버에 연결하지 못했습니다.`,
        null
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let message = await parseErrorMessage(response);
      if (responseTarget?.label === 'proxy') {
        const directFailure = failedTargets.find((item) => item.label === 'direct');
        if (directFailure) {
          message = `${message} 직접 저장 경로 연결 실패 후 프록시로 재시도했습니다 (${directFailure.message}).`;
        }
      }
      throw new SafetyApiError(
        `${requestLabel} 요청이 실패했습니다 (${response.status}). ${message}`,
        response.status
      );
    }

    if (response.status === 204) {
      return undefined as JsonLike;
    }

    return (await response.json()) as JsonLike;
  };

  if (cacheTtlMs > 0) {
    const requestPromise = executeRequest()
      .then((value) => {
        responseCache.set(cacheKey, {
          expiresAt: Date.now() + cacheTtlMs,
          value: cloneJsonLike(value),
        });
        return value;
      })
      .finally(() => {
        inFlightGetRequests.delete(cacheKey);
      });

    inFlightGetRequests.set(cacheKey, requestPromise);
    return requestPromise.then((value) => cloneJsonLike(value) as T);
  }

  return (await executeRequest()) as T;
}
