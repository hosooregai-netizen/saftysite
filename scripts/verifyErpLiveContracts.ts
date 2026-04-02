import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, type Locator, type Page } from 'playwright';

const DEFAULT_NEXT_BASE_URL = 'http://localhost:3100';

interface WorkerMobileSession {
  id: string;
  token: string;
  entry_url: string;
  status: string;
  revoked_at: string | null;
}

interface WorkerMobileSessionDetailError {
  detail?: string;
}

interface SiteDashboardResponse {
  site: {
    id: string;
    site_name: string;
  };
}

interface SiteWorkerSummary {
  id: string;
  name: string;
}

interface SafetyReportListItem {
  id: string;
  document_kind?: string | null;
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

function buildPageUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  expectedStatus = 200
): Promise<T> {
  const response = await fetch(buildProxyUrl(baseUrl, path), init);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | WorkerMobileSessionDetailError) : (null as T);

  if (response.status !== expectedStatus) {
    const detail =
      payload && typeof payload === 'object' && payload !== null && 'detail' in payload
        ? payload.detail
        : text;
    throw new Error(
      `${init.method || 'GET'} ${path} failed (${response.status}): ${detail || 'unknown error'}`
    );
  }

  return payload as T;
}

async function login(baseUrl: string, email: string, password: string): Promise<string> {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const response = await requestJson<{ access_token: string }>(
    baseUrl,
    '/auth/token',
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.access_token;
}

function authHeaders(token: string, extraHeaders?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

async function waitForBodyText(page: Page, markers: string[], timeout = 15000): Promise<void> {
  await page.waitForFunction(
    (values: string[]) => {
      const text = document.body?.innerText || '';
      return values.some((value) => text.includes(value));
    },
    markers,
    { timeout }
  );
}

async function waitForLocatorDisabled(
  page: Page,
  locator: Locator,
  disabled: boolean,
  label: string,
  timeout = 15000
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if ((await locator.isDisabled()) === disabled) {
      return;
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`${label} disabled=${disabled} 상태를 ${timeout}ms 안에 확인하지 못했습니다.`);
}

async function loginViaUi(page: Page, baseUrl: string, email: string, password: string): Promise<void> {
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.locator('input[type="email"]').waitFor({ state: 'visible' });
  await page.locator('input[type="password"]').waitFor({ state: 'visible' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.getByRole('heading', { name: '현장 허브' }).waitFor({ state: 'visible' });
}

async function verifyUiFlow(input: {
  baseUrl: string;
  email: string;
  password: string;
  siteId: string;
  siteName: string;
  workerName: string;
  reportId: string;
  session: WorkerMobileSession;
}): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  try {
    await loginViaUi(page, input.baseUrl, input.email, input.password);

    await page.goto(buildPageUrl(input.baseUrl, `/sites/${encodeURIComponent(input.siteId)}`), {
      waitUntil: 'load',
    });
    await waitForBodyText(page, [input.siteName, '현장 대시보드']);
    await page.getByRole('link', { name: '출입자관리' }).first().waitFor({ state: 'visible' });

    await page.goto(
      buildPageUrl(input.baseUrl, `/sites/${encodeURIComponent(input.siteId)}/workers`),
      { waitUntil: 'load' }
    );
    await page.getByRole('heading', { name: '출입자 목록' }).waitFor({ state: 'visible' });
    const workerRow = page.locator('tbody tr', { hasText: input.workerName }).first();
    await workerRow.waitFor({ state: 'visible' });
    await workerRow.getByRole('button', { name: '수정' }).click();
    await page
      .getByRole('heading', { name: `${input.workerName} 수정` })
      .waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: '모바일 링크 이력' }).waitFor({ state: 'visible' });

    const sessionCard = page
      .locator('[class*="linkHistoryItem"]', { hasText: input.session.token })
      .first();
    await sessionCard.waitFor({ state: 'visible' });
    const revokeButton = sessionCard.getByRole('button', { name: '강제 만료' });
    await waitForLocatorDisabled(page, revokeButton, false, '강제 만료 버튼');
    await revokeButton.click();
    await waitForLocatorDisabled(page, revokeButton, true, '강제 만료 버튼');

    await page.goto(buildPageUrl(input.baseUrl, `/sites/${encodeURIComponent(input.siteId)}/safety`), {
      waitUntil: 'load',
    });
    await page.getByRole('heading', { name: '문서 종류' }).waitFor({ state: 'visible' });

    await page.goto(buildPageUrl(input.baseUrl, `/documents/${encodeURIComponent(input.reportId)}`), {
      waitUntil: 'load',
    });
    await waitForBodyText(page, ['저장 상태 / 필수 입력', '모바일 확인 대상자', '초안 컨텍스트', '읽기전용']);

    await page.goto(buildPageUrl(input.baseUrl, `/m/${encodeURIComponent(input.session.token)}`), {
      waitUntil: 'load',
    });
    await page
      .getByRole('heading', { name: '이 링크는 더 이상 사용할 수 없습니다.' })
      .waitFor({ state: 'visible' });
    await page
      .getByText('현장 관리직이 기존 링크를 종료했습니다. 출입 전 새 링크나 QR 카드를 다시 받아 주세요.')
      .waitFor({ state: 'visible' });

    assert.equal(pageErrors.length, 0, `Browser page errors: ${pageErrors.join(' | ')}`);
    assert.equal(consoleErrors.length, 0, `Browser console errors: ${consoleErrors.join(' | ')}`);
  } finally {
    await browser.close();
  }
}

export async function main() {
  const baseUrl = process.env.LIVE_NEXT_BASE_URL?.trim() || DEFAULT_NEXT_BASE_URL;
  const email = requireEnv('LIVE_SAFETY_EMAIL');
  const password = requireEnv('LIVE_SAFETY_PASSWORD');
  const siteId = requireEnv('LIVE_SAFETY_SITE_ID');
  const workerId = requireEnv('LIVE_SAFETY_WORKER_ID');

  console.log(`verify:erp-live using ${baseUrl}`);
  const accessToken = await login(baseUrl, email, password);

  const dashboard = await requestJson<SiteDashboardResponse>(baseUrl, `/sites/${siteId}/dashboard`, {
    headers: authHeaders(accessToken),
  });
  const workers = await requestJson<SiteWorkerSummary[]>(
    baseUrl,
    `/site-workers?site_id=${encodeURIComponent(siteId)}&limit=1000`,
    {
      headers: authHeaders(accessToken),
    }
  );
  const worker = workers.find((item) => item.id === workerId);
  if (!worker) {
    throw new Error(`Worker ${workerId} was not returned from /site-workers for site ${siteId}.`);
  }

  await requestJson(
    baseUrl,
    `/reports/site/${siteId}/draft-context?document_kind=tbm`,
    {
      headers: authHeaders(accessToken),
    }
  );

  const reports = await requestJson<SafetyReportListItem[]>(
    baseUrl,
    `/reports?site_id=${encodeURIComponent(siteId)}&active_only=true&limit=50`,
    {
      headers: authHeaders(accessToken),
    }
  );
  const report = reports.find((item) => Boolean(item.document_kind));
  if (!report) {
    throw new Error(
      `No ERP report with document_kind was found for site ${siteId}. Live document page verification requires at least one ERP report.`
    );
  }

  const createdSession = await requestJson<WorkerMobileSession>(
    baseUrl,
    `/site-workers/${workerId}/mobile-session`,
    {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({}),
    },
    201
  );

  const activeSessionDetail = await requestJson<{ session: WorkerMobileSession }>(
    baseUrl,
    `/mobile/session/${createdSession.token}`
  );
  if (activeSessionDetail.session.status !== 'active') {
    throw new Error(
      `Expected active mobile session before UI revoke, got ${activeSessionDetail.session.status}`
    );
  }

  await verifyUiFlow({
    baseUrl,
    email,
    password,
    siteId,
    siteName: dashboard.site.site_name,
    workerName: worker.name,
    reportId: report.id,
    session: createdSession,
  });

  const sessionListAfter = await requestJson<WorkerMobileSession[]>(
    baseUrl,
    `/site-workers/${workerId}/mobile-sessions?limit=30`,
    {
      headers: authHeaders(accessToken),
    }
  );
  const revokedSession = sessionListAfter.find((item) => item.id === createdSession.id);
  if (!revokedSession || revokedSession.status !== 'revoked') {
    throw new Error('Revoked session was not returned as revoked in the worker session list.');
  }

  const revokedAccess = await fetch(buildProxyUrl(baseUrl, `/mobile/session/${createdSession.token}`));
  const revokedPayload = (await revokedAccess.json()) as WorkerMobileSessionDetailError;
  if (revokedAccess.status !== 401) {
    throw new Error(`Expected revoked mobile access to return 401, got ${revokedAccess.status}`);
  }
  if (!String(revokedPayload.detail || '').includes('관리자에 의해 만료')) {
    throw new Error(`Unexpected revoked mobile detail: ${revokedPayload.detail || 'missing detail'}`);
  }

  await delay(50);

  console.log('verify:erp-live completed successfully.');
  console.log(
    [
      `dashboard ok: ${siteId}`,
      `worker list ok: ${worker.name} (${workerId})`,
      `draft-context ok: tbm`,
      `document page ok: ${report.id}`,
      `workers page revoke ok: ${createdSession.id}`,
      `revoked mobile access: 401`,
    ].join('\n')
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
