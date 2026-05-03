const DEFAULT_REPORT_API_CANDIDATES = [
  'http://127.0.0.1:8001/api',
  'http://127.0.0.1:8000/api',
  'http://127.0.0.1:8002/api',
  'http://127.0.0.1:8003/api',
  'http://127.0.0.1:8004/api',
  'http://127.0.0.1:8005/api',
  'http://127.0.0.1:8006/api',
  'http://127.0.0.1:8007/api',
  'http://127.0.0.1:8008/api',
  'http://127.0.0.1:8009/api',
  'http://127.0.0.1:8010/api',
] as const;

function getConfiguredReportApiBaseUrl(): string | null {
  const configured = process.env.REPORT_SAAS_API_BASE_URL?.trim();
  return configured ? configured.replace(/\/+$/, '') : null;
}

async function isHealthyReportApi(baseUrl: string): Promise<boolean> {
  try {
    const healthUrl = new URL('/health', baseUrl.replace(/\/api$/, ''));
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) {
      return false;
    }

    const payload = (await response.json().catch(() => null)) as { status?: unknown } | null;
    return payload?.status === 'ok';
  } catch {
    return false;
  }
}

async function getReportApiBaseUrl(): Promise<string | null> {
  const configured = getConfiguredReportApiBaseUrl();
  if (configured) {
    return configured;
  }

  for (const candidate of DEFAULT_REPORT_API_CANDIDATES) {
    if (await isHealthyReportApi(candidate)) {
      return candidate.replace(/\/+$/, '');
    }
  }

  return null;
}

async function buildUpstreamUrl(request: Request, path: string[]): Promise<URL | null> {
  const requestUrl = new URL(request.url);
  const baseUrl = await getReportApiBaseUrl();
  if (!baseUrl) {
    return null;
  }
  const upstream = new URL(`${baseUrl}/${path.join('/')}`);
  upstream.search = requestUrl.search;
  return upstream;
}

async function proxyRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const upstreamUrl = await buildUpstreamUrl(request, path);
  if (!upstreamUrl) {
    return Response.json(
      {
        error:
          'Report SaaS API is not running. Start it with `npm run api:dev`, or set REPORT_SAAS_API_BASE_URL.',
      },
      { status: 502 },
    );
  }
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');

  if (contentType) {
    headers.set('content-type', contentType);
  }
  if (authorization) {
    headers.set('authorization', authorization);
  }

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const responseType = response.headers.get('content-type');
  if (responseType) {
    responseHeaders.set('content-type', responseType);
  }

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return proxyRequest(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return proxyRequest(request, context);
}
