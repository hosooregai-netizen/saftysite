import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';

const DEFAULT_NEXT_BASE_URL = 'http://localhost:3000';

type TimeoutBucket = 'default' | 'erp_context' | 'upload' | 'report_upsert';
type ApiGroup =
  | 'erp'
  | 'reports'
  | 'documents'
  | 'admin'
  | 'uploads'
  | 'content'
  | 'workers'
  | 'mail';

interface ProbeDefinition {
  name: string;
  group: ApiGroup;
  method?: 'GET' | 'POST';
  path: (ctx: ProbeContext) => string | null;
  body?: (ctx: ProbeContext) => BodyInit | undefined;
  contentType?: string;
  timeoutBucket: TimeoutBucket;
  notes: string;
  maxElapsedMs?: number;
  maxResponseBytes?: number;
}

interface ProbeContext {
  siteId: string;
  reportId?: string | null;
  reportKey?: string | null;
}

interface ProbeResult {
  name: string;
  group: ApiGroup;
  method: string;
  path: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  responseBytes: number;
  timeoutBucket: TimeoutBucket;
  error?: string;
  notes: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function buildProxyUrl(baseUrl: string, path: string): string {
  return new URL(`/api/safety${path}`, baseUrl).toString();
}

async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const response = await fetch(buildProxyUrl(baseUrl, '/auth/token'), {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to login (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('Login response did not include access_token.');
  }

  return payload.access_token;
}

function buildHeaders(token: string, probe: ProbeDefinition): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (probe.contentType) {
    headers['Content-Type'] = probe.contentType;
  }

  return headers;
}

function getTimeoutMs(bucket: TimeoutBucket): number {
  switch (bucket) {
    case 'report_upsert':
    case 'upload':
      return 45_000;
    case 'erp_context':
      return 30_000;
    default:
      return 15_000;
  }
}

async function runProbe(baseUrl: string, token: string, probe: ProbeDefinition, ctx: ProbeContext): Promise<ProbeResult | null> {
  const path = probe.path(ctx);
  if (!path) return null;

  const startedAt = performance.now();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), getTimeoutMs(probe.timeoutBucket));

  try {
    const response = await fetch(buildProxyUrl(baseUrl, path), {
      method: probe.method ?? 'GET',
      headers: buildHeaders(token, probe),
      body: probe.body?.(ctx),
      signal: abortController.signal,
    });

    const responseBuffer = Buffer.from(await response.arrayBuffer());
    const bytes = responseBuffer.byteLength;
    const errorText = response.ok ? undefined : responseBuffer.toString('utf-8').slice(0, 500);
    return {
      name: probe.name,
      group: probe.group,
      method: probe.method ?? 'GET',
      path,
      ok: response.ok,
      status: response.status,
      elapsedMs: Math.round(performance.now() - startedAt),
      responseBytes: bytes,
      timeoutBucket: probe.timeoutBucket,
      error: errorText,
      notes: probe.notes,
    };
  } catch (error) {
    return {
      name: probe.name,
      group: probe.group,
      method: probe.method ?? 'GET',
      path,
      ok: false,
      status: null,
      elapsedMs: Math.round(performance.now() - startedAt),
      responseBytes: 0,
      timeoutBucket: probe.timeoutBucket,
      error: error instanceof Error ? error.message : 'unknown error',
      notes: probe.notes,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

const PROBES: ProbeDefinition[] = [
  {
    name: 'ERP Dashboard',
    group: 'erp',
    path: ({ siteId }) => `/sites/${siteId}/dashboard`,
    timeoutBucket: 'erp_context',
    notes: '현장 ERP 대시보드',
    maxElapsedMs: 6000,
    maxResponseBytes: 900000,
  },
  {
    name: 'ERP Draft Context TBM',
    group: 'erp',
    path: ({ siteId, reportId }) =>
      `/reports/site/${siteId}/draft-context?document_kind=tbm${reportId ? `&exclude_report_id=${reportId}` : ''}`,
    timeoutBucket: 'erp_context',
    notes: 'TBM 초안 컨텍스트',
    maxElapsedMs: 5000,
    maxResponseBytes: 1200000,
  },
  {
    name: 'ERP Draft Context Work Log',
    group: 'erp',
    path: ({ siteId, reportId }) =>
      `/reports/site/${siteId}/draft-context?document_kind=safety_work_log${reportId ? `&exclude_report_id=${reportId}` : ''}`,
    timeoutBucket: 'erp_context',
    notes: '작업일지 초안 컨텍스트',
    maxElapsedMs: 5000,
    maxResponseBytes: 1200000,
  },
  {
    name: 'Site Reports Full',
    group: 'reports',
    path: ({ siteId }) => `/reports/site/${siteId}/full?limit=50`,
    timeoutBucket: 'erp_context',
    notes: 'payload 포함 보고서 목록',
    maxElapsedMs: 8000,
    maxResponseBytes: 3000000,
  },
  {
    name: 'Site Workers',
    group: 'workers',
    path: ({ siteId }) => `/site-workers?site_id=${siteId}&limit=1000`,
    timeoutBucket: 'default',
    notes: '현장 작업자 목록',
    maxElapsedMs: 2500,
    maxResponseBytes: 1200000,
  },
  {
    name: 'Assignments Me Sites',
    group: 'workers',
    path: () => '/assignments/me/sites?active_only=true&include_headquarter_detail=true&include_assigned_user=true&limit=200',
    timeoutBucket: 'default',
    notes: '내 배정 현장 목록',
    maxElapsedMs: 3000,
    maxResponseBytes: 900000,
  },
  {
    name: 'Worker Schedules',
    group: 'workers',
    path: () => '/me/schedules?month=2026-04&limit=200',
    timeoutBucket: 'default',
    notes: '지도요원 일정 목록',
    maxElapsedMs: 3000,
    maxResponseBytes: 1200000,
  },
  {
    name: 'Content Items',
    group: 'content',
    path: () => '/content-items?active_only=true&include_body=false&limit=100',
    timeoutBucket: 'default',
    notes: '활성 콘텐츠 summary 목록',
    maxElapsedMs: 2000,
    maxResponseBytes: 500000,
  },
  {
    name: 'Admin Directory Lookups',
    group: 'admin',
    path: () => '/admin/directory/lookups',
    timeoutBucket: 'default',
    notes: '관리자 디렉터리 lookups',
    maxElapsedMs: 3000,
    maxResponseBytes: 600000,
  },
  {
    name: 'Admin Overview',
    group: 'admin',
    path: () => '/admin/dashboard/overview',
    timeoutBucket: 'erp_context',
    notes: '관리자 대시보드 overview',
    maxElapsedMs: 7000,
    maxResponseBytes: 2500000,
  },
  {
    name: 'Admin Analytics Summary',
    group: 'admin',
    path: () => '/admin/dashboard/analytics?period=month',
    timeoutBucket: 'erp_context',
    notes: '관리자 대시보드 analytics summary',
    maxElapsedMs: 1500,
    maxResponseBytes: 1000000,
  },
  {
    name: 'Admin Analytics Month Detail',
    group: 'admin',
    path: () => '/admin/dashboard/analytics/month-detail?period=month&basis_month=2026-04',
    timeoutBucket: 'erp_context',
    notes: '관리자 대시보드 analytics 기준월 상세',
    maxElapsedMs: 3000,
    maxResponseBytes: 2000000,
  },
  {
    name: 'Report By Key',
    group: 'reports',
    path: ({ reportKey }) => (reportKey ? `/reports/by-key/${reportKey}` : null),
    timeoutBucket: 'default',
    notes: '보고서 상세 조회',
    maxElapsedMs: 2500,
    maxResponseBytes: 1500000,
  },
];

function shouldEnforceBudgets(argv: string[]) {
  return argv.includes('--enforce-budgets') || process.env.PROBE_ENFORCE_BUDGETS === '1';
}

function evaluateBudgets(result: ProbeResult, probe: ProbeDefinition): string[] {
  const failures: string[] = [];
  if (!result.ok) {
    failures.push(`${probe.name}: request failed (${result.status ?? 'network'}) ${result.error ?? ''}`.trim());
  }
  if (probe.maxElapsedMs != null && result.elapsedMs > probe.maxElapsedMs) {
    failures.push(`${probe.name}: latency ${result.elapsedMs}ms > ${probe.maxElapsedMs}ms`);
  }
  if (probe.maxResponseBytes != null && result.responseBytes > probe.maxResponseBytes) {
    failures.push(`${probe.name}: response bytes ${result.responseBytes} > ${probe.maxResponseBytes}`);
  }
  return failures;
}

async function main(argv: string[] = process.argv.slice(2)) {
  const baseUrl = process.env.LIVE_NEXT_BASE_URL?.trim() || DEFAULT_NEXT_BASE_URL;
  const email = requireEnv('LIVE_SAFETY_EMAIL');
  const password = requireEnv('LIVE_SAFETY_PASSWORD');
  const siteId = requireEnv('LIVE_SAFETY_SITE_ID');
  const reportId = process.env.LIVE_SAFETY_REPORT_ID?.trim() || null;
  const reportKey = process.env.LIVE_SAFETY_REPORT_KEY?.trim() || null;

  const token = await login(baseUrl, email, password);
  const ctx: ProbeContext = { siteId, reportId, reportKey };
  const results = (await Promise.all(PROBES.map((probe) => runProbe(baseUrl, token, probe, ctx)))).filter(
    (result): result is ProbeResult => result !== null
  );
  const enforceBudgets = shouldEnforceBudgets(argv);
  const failures = results.filter((result) => !result.ok);
  const budgetFailures = enforceBudgets
    ? results.flatMap((result) => {
        const probe = PROBES.find((item) => item.name === result.name);
        return probe ? evaluateBudgets(result, probe) : [];
      })
    : [];

  const slowest = [...results].sort((left, right) => right.elapsedMs - left.elapsedMs).slice(0, 10);

  console.log(
    JSON.stringify(
      {
        baseUrl,
        generatedAt: new Date().toISOString(),
        results,
        summary: {
          budgetFailureCount: budgetFailures.length,
          failureCount: failures.length,
          slowest,
        },
      },
      null,
      2
    )
  );

  if (budgetFailures.length > 0) {
    console.error('[probe:api-live] budget failures:');
    for (const failure of budgetFailures) {
      console.error(` - ${failure}`);
    }
    process.exitCode = 1;
  } else if (failures.length > 0) {
    process.exitCode = 1;
  }
}

void main();
