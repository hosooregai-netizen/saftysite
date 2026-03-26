import { getSafetyApiUpstreamBaseUrl } from './upstream';

const REQUEST_HEADERS_TO_SKIP = new Set(['connection', 'content-length', 'host']);
const RESPONSE_HEADERS_TO_SKIP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

function copyHeaders(source: Headers, blocked: Set<string>): Headers {
  const headers = new Headers();

  for (const [key, value] of source.entries()) {
    if (!blocked.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return headers;
}

function buildUpstreamUrl(request: Request, pathParts: string[]): string {
  const incomingUrl = new URL(request.url);
  const path = pathParts.map((segment) => encodeURIComponent(segment)).join('/');
  const upstreamUrl = new URL(`${getSafetyApiUpstreamBaseUrl()}/${path}`);
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl.toString();
}

function requiresRequestBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
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
  try {
    const upstreamResponse = await fetch(buildUpstreamUrl(request, pathParts), {
      method: request.method,
      headers: copyHeaders(request.headers, REQUEST_HEADERS_TO_SKIP),
      body: requiresRequestBody(request.method) ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: copyHeaders(upstreamResponse.headers, RESPONSE_HEADERS_TO_SKIP),
    });
  } catch (error) {
    return Response.json(
      {
        detail:
          error instanceof Error
            ? `안전 API 서버에 연결하지 못했습니다: ${error.message}`
            : '안전 API 서버에 연결하지 못했습니다.',
      },
      { status: 502 }
    );
  }
}

