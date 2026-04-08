import { getSafetyApiUpstreamBaseUrl } from './upstream';

const REQUEST_HEADERS_TO_SKIP = new Set(['connection', 'content-length', 'host']);
const RESPONSE_HEADERS_TO_SKIP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);
const DEFAULT_PROXY_TIMEOUT_MS = 15000;
const FILE_PROXY_TIMEOUT_MS = 45000;
const ERP_CONTEXT_PROXY_TIMEOUT_MS = 30000;

function copyHeaders(source: Headers, blocked: Set<string>): Headers {
  const headers = new Headers();

  for (const [key, value] of source.entries()) {
    if (!blocked.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return headers;
}

function buildUploadUpstreamBaseUrl(apiUpstreamBaseUrl: string): string {
  try {
    return new URL(apiUpstreamBaseUrl).origin;
  } catch {
    return apiUpstreamBaseUrl.replace(/\/api\/v1\/?$/i, '');
  }
}

export function resolveSafetyProxyUpstreamBaseUrl(pathParts: string[]): string {
  const apiUpstreamBaseUrl = getSafetyApiUpstreamBaseUrl();
  if (pathParts[0] !== 'uploads') {
    return apiUpstreamBaseUrl;
  }

  // Uploaded asset files are served from the upstream origin root, not the API prefix.
  return buildUploadUpstreamBaseUrl(apiUpstreamBaseUrl);
}

export function buildSafetyProxyUpstreamUrl(request: Request, pathParts: string[]): string {
  const incomingUrl = new URL(request.url);
  const path = pathParts.map((segment) => encodeURIComponent(segment)).join('/');
  const upstreamUrl = new URL(`${resolveSafetyProxyUpstreamBaseUrl(pathParts)}/${path}`);
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl.toString();
}

function requiresRequestBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

function getProxyTimeoutMs(request: Request): number {
  const contentType = request.headers.get('content-type') || '';
  const pathname = new URL(request.url).pathname;
  if (contentType.includes('multipart/form-data')) {
    return FILE_PROXY_TIMEOUT_MS;
  }

  if (
    pathname.includes('/dashboard') ||
    pathname.includes('/draft-context') ||
    pathname.includes('/reports/upsert')
  ) {
    return ERP_CONTEXT_PROXY_TIMEOUT_MS;
  }

  return DEFAULT_PROXY_TIMEOUT_MS;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    ('name' in error && error.name === 'AbortError')
  );
}

export function createSafetyApiOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT',
    },
  });
}

export async function proxySafetyApiRequest(
  request: Request,
  pathParts: string[]
): Promise<Response> {
  const abortController = new AbortController();
  const timeoutMs = getProxyTimeoutMs(request);
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`안전 API 프록시 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`)
    );
  }, timeoutMs);

  try {
    const upstreamResponse = await fetch(buildSafetyProxyUpstreamUrl(request, pathParts), {
      method: request.method,
      headers: copyHeaders(request.headers, REQUEST_HEADERS_TO_SKIP),
      body: requiresRequestBody(request.method) ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: abortController.signal,
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: copyHeaders(upstreamResponse.headers, RESPONSE_HEADERS_TO_SKIP),
    });
  } catch (error) {
    const status = isAbortError(error) ? 504 : 503;
    return Response.json(
      {
        detail:
          error instanceof Error
            ? `안전 API 서버에 연결하지 못했습니다: ${error.message}`
            : '안전 API 서버에 연결하지 못했습니다.',
      },
      { status }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
