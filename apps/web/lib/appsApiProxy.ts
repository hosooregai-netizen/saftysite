const DEFAULT_API_CANDIDATES = [
  'http://127.0.0.1:8001/api',
  'http://127.0.0.1:8000/api',
] as const;

function getConfiguredApiBaseUrl(): string | null {
  const configured = process.env.REPORT_SAAS_API_BASE_URL?.trim();
  return configured ? configured.replace(/\/+$/, '') : null;
}

async function isHealthyApi(baseUrl: string): Promise<boolean> {
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

async function getApiBaseUrl(): Promise<string | null> {
  const configured = getConfiguredApiBaseUrl();
  if (configured) {
    return configured;
  }

  for (const candidate of DEFAULT_API_CANDIDATES) {
    if (await isHealthyApi(candidate)) {
      return candidate.replace(/\/+$/, '');
    }
  }

  return null;
}

function createFailureResponse(scopeLabel: string) {
  return Response.json(
    {
      error: `${scopeLabel} API를 찾지 못했습니다. \`npm run dev\` 또는 \`npm run api:dev\`로 apps/api를 먼저 실행해 주세요.`,
    },
    { status: 502 },
  );
}

export async function proxyAppsApiRequest(
  request: Request,
  path: string[],
  prefix: 'admin' | 'mail' | 'safety',
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    return createFailureResponse(prefix);
  }

  const upstream = new URL(`${baseUrl}/v1/${prefix}/${path.join('/')}`);
  upstream.search = requestUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');

  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);

  const response = await fetch(upstream, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  for (const headerName of ['content-type', 'content-disposition', 'cache-control', 'location']) {
    const headerValue = response.headers.get(headerName);
    if (headerValue) {
      responseHeaders.set(headerName, headerValue);
    }
  }

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}
