import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { createInspectionSite } from '../../../constants/inspectionSession/sessionFactory';
import { mapSafetyReportListItem } from '../../../lib/safetyApiMappers';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { clone, getTokenForUser, NOW, toReportListItem } from '../../../tooling/internal/smokeClient_impl';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

const SITE_ID = 'site-1';
const USER_ID = 'field-1';
const HEADQUARTER_NAME = '기존 본사';
const HEADQUARTER_NUMBER = 'HQ-001';
const HEADQUARTER_ADDRESS = '서울시 중구 테스트로 1';

function createStaleCachedSite() {
  const site = createInspectionSite({
    customerName: HEADQUARTER_NAME,
    siteName: '기존 현장',
    assigneeName: '김요원',
    siteManagementNumber: '',
    businessStartNumber: '',
    constructionPeriod: '2026-01-01 ~ 2026-06-30',
    constructionAmount: '',
    isHighRiskSite: true,
    siteManagerName: '박소장',
    siteManagerPhone: '',
    siteContactEmail: 'site-manager@example.com',
    siteAddress: '서울시 강남구 현장로 1',
    companyName: '',
    corporationRegistrationNumber: '',
    businessRegistrationNumber: '',
    licenseNumber: '',
    headquartersContact: '',
    headquartersAddress: '',
  });

  site.id = SITE_ID;
  site.headquarterId = 'hq-1';
  site.createdAt = NOW;
  site.updatedAt = NOW;
  return site;
}

async function seedCachedBootstrap(
  page: Page,
  cachedUser: Record<string, unknown>,
  cachedSites: unknown[],
  reportIndexValue: Record<string, unknown> = {},
) {
  await page.evaluate(
    async ({ token, nextUser, nextSites, nextReportIndex }) => {
      const DB_NAME = 'inspection-session-storage';
      const STORE_NAME = 'keyValue';
      const persistedEntries = [
        ['inspection-user-v1', nextUser],
        ['inspection-sites-v8', nextSites],
        ['inspection-sessions-v8', []],
        ['inspection-report-index-v2', nextReportIndex],
      ] as const;

      window.localStorage.setItem('safety-api-access-token', token);
      for (const [key, value] of persistedEntries) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }

      if (typeof window.indexedDB === 'undefined') {
        return;
      }

      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const request = window.indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });

      if (!db) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const [key, value] of persistedEntries) {
          store.put({ key, value });
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });

      db.close();
    },
    {
      token: getTokenForUser(USER_ID),
      nextUser: cachedUser,
      nextSites: cachedSites,
      nextReportIndex: {
        ownerId: USER_ID,
        savedAt: NOW,
        value: reportIndexValue,
      },
    },
  );
}

function createCachedReportIndexValue(report: Record<string, unknown>) {
  return {
    [SITE_ID]: {
      status: 'loaded',
      items: [
        mapSafetyReportListItem(
          toReportListItem(report) as Parameters<typeof mapSafetyReportListItem>[0],
        ),
      ],
      fetchedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      error: null,
    },
  };
}

async function installDelayedStaleReportListRoute(
  harness: Awaited<ReturnType<typeof createErpSmokeHarness>>,
) {
  let intercepted = false;
  let resolveStaleResponse: () => void = () => {};
  const staleResponseSettled = new Promise<void>((resolve) => {
    resolveStaleResponse = resolve;
  });
  const staleSnapshot = clone(
    harness.helpers.visibleReportsForSite(SITE_ID).map((report) => toReportListItem(report)),
  );

  await harness.page.route(/\/api\/(?:safety|v1)\/reports(?:\?.*)?$/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      intercepted ||
      request.method() !== 'GET' ||
      url.searchParams.get('site_id') !== SITE_ID
    ) {
      await route.fallback();
      return;
    }

    intercepted = true;
    harness.delayedReportListRequests.add(`${USER_ID}:${SITE_ID}`);
    harness.requestCounts.set(
      'GET /reports',
      (harness.requestCounts.get('GET /reports') || 0) + 1,
    );
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(staleSnapshot),
    });
    resolveStaleResponse();
  });

  return staleResponseSettled;
}

async function readPersistedReportDispatchCompleted(page: Page, reportKey: string) {
  return page.evaluate(
    async ({ siteId, targetReportKey }) => {
      const key = 'inspection-report-index-v2';
      let stored: unknown = null;
      if (typeof window.indexedDB !== 'undefined') {
        stored = await new Promise<unknown | null>((resolve) => {
          const request = window.indexedDB.open('inspection-session-storage', 1);
          request.onerror = () => resolve(null);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('keyValue', 'readonly');
            const store = transaction.objectStore('keyValue');
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
              const result = getRequest.result;
              db.close();
              resolve(result?.value ?? null);
            };
            getRequest.onerror = () => {
              db.close();
              resolve(null);
            };
          };
        });
      }

      if (stored == null) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          try {
            stored = JSON.parse(raw);
          } catch {
            stored = null;
          }
        }
      }
      const record = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
      const value = record.value && typeof record.value === 'object'
        ? (record.value as Record<string, unknown>)
        : {};
      const siteState =
        value[siteId] && typeof value[siteId] === 'object'
          ? (value[siteId] as Record<string, unknown>)
          : {};
      const items = Array.isArray(siteState.items) ? siteState.items : [];
      const item = items.find((candidate) => {
        return (
          candidate &&
          typeof candidate === 'object' &&
          (candidate as Record<string, unknown>).reportKey === targetReportKey
        );
      });
      if (!item || typeof item !== 'object') {
        return null;
      }
      return Boolean((item as Record<string, unknown>).dispatchCompleted);
    },
    { siteId: SITE_ID, targetReportKey: reportKey },
  );
}

async function assertDispatchStaleReportListRaceIsGuarded(
  harness: Awaited<ReturnType<typeof createErpSmokeHarness>>,
  staleResponseSettled: Promise<void>,
  reportReadsBefore: number,
) {
  const { page, requestCounts } = harness;
  const dispatchWritesBefore = requestCounts.get('PATCH /api/reports/:id/dispatch') || 0;
  const reportRow = page.locator('article').filter({
    has: page.locator('a[href="/sessions/report-tech-1"]'),
  }).first();
  const dispatchStatusCell = reportRow.locator('[class*="dispatchStatusCell"]');

  await reportRow.waitFor({ state: 'visible' });
  const pendingDispatchText = await dispatchStatusCell.textContent();
  await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);
  await reportRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem').nth(1).click();

  await harness.waitForRequestCount(
    'PATCH /api/reports/:id/dispatch',
    dispatchWritesBefore + 1,
  );
  await harness.waitForRequestCount('GET /reports', reportReadsBefore + 2);
  await staleResponseSettled;

  await harness.waitForCondition(
    async () => (await readPersistedReportDispatchCompleted(page, 'report-tech-1')) === true,
    'Late stale /reports response overwrote persisted dispatchCompleted=true.',
  );
  await harness.waitForCondition(
    async () => {
      const text = await dispatchStatusCell.textContent();
      return Boolean(text && pendingDispatchText && text !== pendingDispatchText);
    },
    'Report list did not keep dispatch completed after late stale /reports response.',
  );
  assert.equal(
    harness.state.reports.find((report) => report.report_key === 'report-tech-1')
      ?.dispatch_completed,
    true,
  );
}

async function installDelayedAssignedSitesRoute(
  page: Page,
  requestCounts: Map<string, number>,
  responseBody: unknown,
) {
  let intercepted = false;

  await page.route('**/assignments/me/sites*', async (route) => {
    if (intercepted) {
      await route.fallback();
      return;
    }

    intercepted = true;
    requestCounts.set(
      'GET /assignments/me/sites',
      (requestCounts.get('GET /assignments/me/sites') || 0) + 1,
    );
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

async function installDelayedSiteDetailRoute(page: Page) {
  let intercepted = false;

  await page.route(new RegExp(`/api/(?:safety|v1)/sites/${SITE_ID}(?:\\?.*)?$`), async (route) => {
    if (intercepted) {
      await route.fallback();
      return;
    }

    intercepted = true;
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.fallback();
  });
}

export async function runSiteReportListSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('site-report-list', config);

  try {
    const { page, requestCounts } = harness;
    const reportReadsBefore = requestCounts.get('GET /reports') || 0;
    const seedReadsBefore =
      requestCounts.get('GET /reports/site/:id/technical-guidance-seed') || 0;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);

    const cachedUser = clone(
      harness.state.users.find((user) => String(user.id) === USER_ID) ?? null,
    );
    assert.ok(cachedUser, 'Missing cached user fixture for stale bootstrap.');
    const cachedReport = clone(
      harness.state.reports.find((report) => String(report.report_key) === 'report-tech-1') ?? null,
    );
    assert.ok(cachedReport, 'Missing cached report fixture for stale dispatch regression.');

    await seedCachedBootstrap(
      page,
      cachedUser,
      [createStaleCachedSite()],
      createCachedReportIndexValue(cachedReport),
    );
    const staleResponseSettled = installDelayedStaleReportListRoute(harness);
    await installDelayedAssignedSitesRoute(
      page,
      requestCounts,
      clone(harness.helpers.assignedSitesForUser(USER_ID)),
    );
    await installDelayedSiteDetailRoute(page);

    const assignmentsBeforeReload = requestCounts.get('GET /assignments/me/sites') || 0;

    await page.goto(`${harness.baseURL}/sites/${SITE_ID}`, { waitUntil: 'load' });
    await page.getByRole('heading', { name: /기술지도\s*보고서/ }).waitFor({
      state: 'visible',
    });

    const createButton = page.getByRole('button', { name: '보고서 추가' });
    await createButton.waitFor({ state: 'visible' });
    await page.getByText('현장 정보를 확인하는 중입니다.').waitFor({ state: 'visible' });
    assert.equal(await createButton.isDisabled(), true, 'Create button should stay disabled while resolving site info.');
    await assertDispatchStaleReportListRaceIsGuarded(
      harness,
      staleResponseSettled,
      reportReadsBefore,
    );

    await harness.waitForRequestCount(
      'GET /assignments/me/sites',
      assignmentsBeforeReload + 1,
    );
    await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);
    await harness.waitForCondition(
      async () => !(await createButton.isDisabled()),
      'Create button did not re-enable after site resolution completed.',
    );

    await createButton.click();
    const createDialog = page.getByRole('dialog', { name: /기술지도 보고서 (?:추가|생성)/ });
    await createDialog.waitFor({ state: 'visible' });
    await createDialog.getByLabel('지도일').fill('2026-04-09');
    await createDialog.getByLabel('제목').fill('테스트 보고서 목록 이동');
    await createDialog.getByRole('button', { name: /추가|생성/ }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/technical-guidance-seed',
      seedReadsBefore + 1,
    );
    await page.waitForURL(/\/sessions\/[^/]+/);
    await page.getByText(HEADQUARTER_NUMBER, { exact: true }).waitFor({ state: 'visible' });
    await page.getByText(HEADQUARTER_NAME, { exact: true }).waitFor({ state: 'visible' });
    await page.getByText(HEADQUARTER_ADDRESS, { exact: true }).waitFor({ state: 'visible' });
    assert.equal(
      requestCounts.get('GET /api/admin/reports') || 0,
      0,
      'Field-agent site report lists must not call the admin reports API.',
    );

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
