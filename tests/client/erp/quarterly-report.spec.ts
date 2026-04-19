import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { createInspectionSite } from '../../../constants/inspectionSession/sessionFactory';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { clone, getTokenForUser, NOW } from '../../../tooling/internal/smokeClient_impl';
import {
  createErpSmokeHarness,
  getQuarterlySmokeQuarterKey,
} from '../fixtures/erpSmokeHarness';

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

export async function runQuarterlyReportSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('quarterly-report', config);

  try {
    const { page, requestCounts } = harness;
    const indexReadsBefore = requestCounts.get('GET /reports/site/:id/operational-index') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;
    const seedReadsBefore =
      requestCounts.get('GET /reports/site/:id/quarterly-summary-seed') || 0;
    const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
    const dispatchWritesBefore = requestCounts.get('PATCH /api/reports/:id/dispatch') || 0;
    const hwpxReadsBefore = requestCounts.get('POST /api/documents/quarterly/hwpx') || 0;
    const pdfReadsBefore = requestCounts.get('POST /api/documents/quarterly/pdf') || 0;

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

    await page.goto(`${harness.baseURL}/sites/${SITE_ID}/quarterly`, { waitUntil: 'load' });

    const createButton = page.getByRole('button', { name: '보고서 작성' });
    await createButton.waitFor({ state: 'visible' });
    await page.getByText('사업장 정보를 확인하는 중입니다.').waitFor({ state: 'visible' });
    assert.equal(await createButton.isDisabled(), true, 'Quarterly create button should stay disabled while resolving site info.');

    await harness.waitForRequestCount(
      'GET /assignments/me/sites',
      assignmentsBeforeReload + 1,
    );
    await harness.waitForRequestCount(
      'GET /reports/site/:id/operational-index',
      indexReadsBefore + 1,
    );
    await harness.waitForCondition(
      async () => !(await createButton.isDisabled()),
      'Quarterly create button did not re-enable after site resolution completed.',
    );

    await createButton.click();
    await page.getByRole('dialog', { name: '분기 종합 보고서 생성' }).waitFor({
      state: 'visible',
    });

    const quarterKey = getQuarterlySmokeQuarterKey();
    const [yearValue = '2026', quarterValue = '2'] = quarterKey.split('-Q');
    const year = Number.parseInt(yearValue, 10);
    const quarter = Number.parseInt(quarterValue, 10);
    const quarterStartDate =
      quarter === 1
        ? `${year}-01-01`
        : quarter === 2
          ? `${year}-04-01`
          : quarter === 3
            ? `${year}-07-01`
            : `${year}-10-01`;
    const quarterEndDate =
      quarter === 1
        ? `${year}-03-31`
        : quarter === 2
          ? `${year}-06-30`
          : quarter === 3
            ? `${year}-09-30`
            : `${year}-12-31`;
    const createdTitle = `${year}년 ${quarter}분기 종합보고서 자동화`;

    await page.getByLabel('제목').fill(createdTitle);
    await page.getByLabel('시작일').fill(quarterStartDate);
    await page.getByLabel('종료일').fill(quarterEndDate);
    await page.getByRole('button', { name: '생성' }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/quarterly-summary-seed',
      seedReadsBefore + 1,
    );
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);
    await page.waitForURL(/\/sites\/site-1\/quarterly(?:\/[^/]+)?$/);
    if (!/\/sites\/site-1\/quarterly\/[^/]+$/.test(page.url())) {
      const createdRow = page.locator('article').filter({ hasText: createdTitle }).first();
      await createdRow.waitFor({ state: 'visible' });
      await createdRow.getByRole('link', { name: createdTitle }).click();
      await page.waitForURL(/\/sites\/site-1\/quarterly\/[^/]+$/);
    }
    await harness.waitForRequestCount('GET /reports/by-key/:id', reportReadsBefore + 1);

    await harness.waitForCondition(
      async () =>
        (await page.getByLabel('사업장관리번호').inputValue()) === HEADQUARTER_NUMBER,
      'Quarterly site snapshot did not populate the management number.',
    );
    assert.equal(await page.getByLabel('회사명').inputValue(), HEADQUARTER_NAME);
    assert.equal(await page.getByLabel('본사 주소').inputValue(), HEADQUARTER_ADDRESS);
    await page.getByText('1. 원본 보고서 선택').waitFor({ state: 'visible' });
    await page.getByText('1. 기술지도 사업장 개요').waitFor({ state: 'visible' });
    await page.getByText('2. 재해유형 분석').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '문서 다운로드 (.hwpx)' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('button', { name: '문서 다운로드 (.pdf)' }).waitFor({
      state: 'visible',
    });

    await page.getByRole('button', { name: '보고서 선택' }).click();
    const sourceSelectionDialog = page.getByRole('dialog', { name: '원본 보고서 선택' });
    await sourceSelectionDialog.waitFor({ state: 'visible' });
    await page.getByText(/1차 기술지도 보고서/).waitFor({ state: 'visible' });
    await sourceSelectionDialog.getByRole('button', { name: '선택 해제' }).click();
    await sourceSelectionDialog.getByRole('button', { name: '다시 계산' }).click();
    await sourceSelectionDialog.waitFor({ state: 'hidden' });

    const siteManagerInput = page.getByLabel('책임자');
    await siteManagerInput.fill('박소장 수정');
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 2);

    await page.getByRole('button', { name: '문서 다운로드 (.hwpx)' }).click();
    await harness.waitForRequestCount('POST /api/documents/quarterly/hwpx', hwpxReadsBefore + 1);

    await page.getByRole('button', { name: '문서 다운로드 (.pdf)' }).click();
    await harness.waitForRequestCount('POST /api/documents/quarterly/pdf', pdfReadsBefore + 1);

    await page.goto(`${harness.baseURL}/sites/${SITE_ID}/quarterly`, { waitUntil: 'load' });
    await createButton.waitFor({ state: 'visible' });
    await page.getByRole('button', { name: `${createdTitle} 작업 메뉴 열기` }).click();
    await page.getByRole('menuitem', { name: '발송으로 변경' }).click();
    await harness.waitForRequestCount(
      'PATCH /api/reports/:id/dispatch',
      dispatchWritesBefore + 1,
    );
    await page
      .locator('article')
      .filter({ hasText: createdTitle })
      .getByText('발송완료')
      .waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
