import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { createInspectionSite } from '../../../constants/inspectionSession/sessionFactory';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { clone, getTokenForUser, NOW } from '../../../tooling/internal/smokeClient_impl';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

const REPORT_KEY = 'report-tech-1';
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
        value: {},
      },
    },
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
    await new Promise((resolve) => setTimeout(resolve, 850));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

export async function runSiteReportListSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('site-report-list', config);

  try {
    const { page, requestCounts } = harness;
    const reportReadsBefore = requestCounts.get('GET /reports') || 0;
    const seedReadsBefore =
      requestCounts.get('GET /reports/site/:id/technical-guidance-seed') || 0;
    const dispatchWritesBefore = requestCounts.get('PATCH /api/reports/:id/dispatch') || 0;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);

    const cachedUser = clone(
      harness.state.users.find((user) => String(user.id) === USER_ID) ?? null,
    );
    assert.ok(cachedUser, 'Missing cached user fixture for stale bootstrap.');

    await seedCachedBootstrap(page, cachedUser, [createStaleCachedSite()]);
    await installDelayedAssignedSitesRoute(
      page,
      requestCounts,
      clone(harness.helpers.assignedSitesForUser(USER_ID)),
    );

    const assignmentsBeforeReload = requestCounts.get('GET /assignments/me/sites') || 0;

    await page.goto(`${harness.baseURL}/sites/${SITE_ID}`, { waitUntil: 'load' });
    await page.getByRole('heading', { name: /기술지도\s*보고서/ }).waitFor({
      state: 'visible',
    });

    const createButton = page.getByRole('button', { name: '보고서 추가' });
    await createButton.waitFor({ state: 'visible' });
    await page.getByText('사업장 정보를 확인하는 중입니다.').waitFor({ state: 'visible' });
    assert.equal(await createButton.isDisabled(), true, 'Create button should stay disabled while resolving site info.');

    await harness.waitForRequestCount(
      'GET /assignments/me/sites',
      assignmentsBeforeReload + 1,
    );
    await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);
    await harness.waitForCondition(
      async () => !(await createButton.isDisabled()),
      'Create button did not re-enable after site resolution completed.',
    );

    const firstRow = page
      .locator('article')
      .filter({ has: page.locator(`a[href="/sessions/${REPORT_KEY}"]`) })
      .first();
    await firstRow.waitFor({ state: 'visible' });

    const toggledReportTitle = (await firstRow.getByRole('link').textContent())?.trim();
    if (!toggledReportTitle) {
      throw new Error('Unable to resolve the seeded technical guidance report title.');
    }

    const searchField = page.locator('[role="search"]').first();
    await searchField.locator('input').fill('ZZ-no-match-123');
    await page.waitForTimeout(250);
    await firstRow.waitFor({ state: 'visible' });
    await searchField.getByRole('button').click();
    await page.getByText('검색 조건에 맞는 보고서가 없습니다.').waitFor({ state: 'visible' });
    await searchField.locator('input').fill(toggledReportTitle);
    await page.waitForTimeout(250);
    await page.getByText('검색 조건에 맞는 보고서가 없습니다.').waitFor({ state: 'visible' });
    await searchField.locator('input').press('Enter');
    await firstRow.waitFor({ state: 'visible' });

    await firstRow.getByRole('button', { name: `${toggledReportTitle} 작업 메뉴 열기` }).click();
    await page.getByRole('menu').waitFor({ state: 'visible' });
    await page.getByRole('menuitem', { name: '발송으로 변경' }).click();
    await harness.waitForRequestCount(
      'PATCH /api/reports/:id/dispatch',
      dispatchWritesBefore + 1,
    );

    await page
      .locator('article')
      .filter({ hasText: toggledReportTitle })
      .getByText('발송완료')
      .waitFor({ state: 'visible' });

    await createButton.click();
    const createDialog = page.getByRole('dialog', { name: '기술지도 보고서 생성' });
    await createDialog.waitFor({ state: 'visible' });
    await createDialog.getByLabel('제목').fill('테스트 보고서 목록 이동');
    await createDialog.getByRole('button', { name: '생성' }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/technical-guidance-seed',
      seedReadsBefore + 1,
    );
    await page.waitForURL(/\/sessions\/[^/]+/);
    await page.getByText(HEADQUARTER_NUMBER, { exact: true }).waitFor({ state: 'visible' });
    await page.getByText(HEADQUARTER_NAME, { exact: true }).waitFor({ state: 'visible' });
    await page.getByText(HEADQUARTER_ADDRESS, { exact: true }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
