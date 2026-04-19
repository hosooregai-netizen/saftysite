import type { Page } from 'playwright';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

async function assertSiteTableColumnCount(page: Page) {
  await page.locator('table thead th').first().waitFor({ state: 'visible' });
  const columnCount = await page.locator('table thead th').count();
  if (columnCount !== 8) {
    throw new Error(`Expected 8 site table columns, received ${columnCount}.`);
  }
}

function getSiteTableRow(page: Page, siteName: string) {
  return page.locator('tbody tr').filter({ hasText: siteName }).first();
}

async function createSite(
  page: Page,
  input: {
    managerEmail: string;
    managerName: string;
    managerPhone: string;
    managementNumber: string;
    siteCode: string;
    siteName: string;
  },
) {
  await page.getByRole('button', { name: '현장 추가' }).click();
  const siteCreateDialog = page.getByRole('dialog', { name: '현장 추가' });
  await siteCreateDialog.getByLabel('현장명').fill(input.siteName);
  await siteCreateDialog.getByLabel('현장코드').fill(input.siteCode);
  await siteCreateDialog.getByLabel('현장관리번호').fill(input.managementNumber);
  await siteCreateDialog.getByLabel('현장소장명').fill(input.managerName);
  await siteCreateDialog.getByLabel('현장소장 연락처').fill(input.managerPhone);
  await siteCreateDialog.getByLabel('현장대리인/소장 메일').fill(input.managerEmail);
  await siteCreateDialog.getByLabel('계약유형').selectOption('private');
  await siteCreateDialog.getByLabel('계약상태').selectOption('active');
  await siteCreateDialog.getByLabel(/기술지도.*대가/).fill('1200000');
  await siteCreateDialog.getByLabel(/기술지도.*횟수/).fill('12');
  await siteCreateDialog.getByLabel(/회차당/).fill('100000');
  await siteCreateDialog.getByRole('button', { name: '생성' }).click();
}

async function installDelayedSiteDetailRoute(page: Page, siteId: string, delayMs = 1200) {
  let intercepted = false;

  await page.route('**/api/admin/sites/list**', async (route) => {
    const url = new URL(route.request().url());
    if (intercepted || url.searchParams.get('site_id') !== siteId) {
      await route.fallback();
      return;
    }

    intercepted = true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fallback();
  });
}

export async function runAdminSitesSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-sites', config);

  try {
    const { page, requestCounts } = harness;
    const siteListReadsBefore = requestCounts.get('GET /api/admin/sites/list') || 0;
    const lookupReadsBefore = requestCounts.get('GET /api/admin/directory/lookups') || 0;
    const siteCreatesBefore = requestCounts.get('POST /sites') || 0;
    const siteUpdatesBefore = requestCounts.get('PATCH /sites/:id') || 0;
    const siteDeletesBefore = requestCounts.get('DELETE /sites/:id') || 0;
    const assignmentCreatesBefore = requestCounts.get('POST /assignments') || 0;
    const assignmentDeletesBefore = requestCounts.get('DELETE /assignments/:id') || 0;
    const adminSiteReadsBefore = requestCounts.get('GET /api/admin/sites/:id') || 0;
    const siteAName = 'mocked admin site a';
    const siteAId = 'site-mocked-admin-site-a';
    const siteBName = 'mocked admin site b';
    const siteBId = 'site-mocked-admin-site-b';

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/sites/list', siteListReadsBefore + 1);
    await harness.waitForRequestCount('GET /api/admin/directory/lookups', lookupReadsBefore + 1);
    await page.getByRole('button', { name: '사업장 정보 수정' }).waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    const settledSiteListReads = requestCounts.get('GET /api/admin/sites/list') || 0;

    const siteSearch = page.locator('[role="search"]').first();
    const siteSearchInput = siteSearch.locator('input');
    await siteSearchInput.fill('ZZ-no-match-123');
    await page.waitForTimeout(250);
    if ((requestCounts.get('GET /api/admin/sites/list') || 0) !== settledSiteListReads) {
      throw new Error('Site search should wait for an explicit submit before refetching.');
    }
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });
    await Promise.all([
      harness.waitForRequestCount('GET /api/admin/sites/list', settledSiteListReads + 1),
      siteSearch.getByRole('button').click(),
    ]);
    await page.getByText('등록된 현장이 없습니다.', { exact: true }).waitFor({ state: 'visible' });

    await siteSearchInput.fill('김요원');
    await page.waitForTimeout(250);
    if ((requestCounts.get('GET /api/admin/sites/list') || 0) !== settledSiteListReads + 1) {
      throw new Error('Site search should keep the submitted query until the next submit.');
    }
    await Promise.all([
      harness.waitForRequestCount('GET /api/admin/sites/list', settledSiteListReads + 2),
      siteSearch.getByRole('button').click(),
    ]);
    await page.getByText('등록된 현장이 없습니다.', { exact: true }).waitFor({ state: 'hidden' });
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });

    await siteSearchInput.fill('');
    await siteSearch.getByRole('button').click();
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });

    const headquarterBackLabelCount = await page.getByText('사업장 목록', { exact: true }).count();
    if (headquarterBackLabelCount !== 1) {
      throw new Error(
        `Expected a single shell back label for the headquarter drilldown, received ${headquarterBackLabelCount}.`,
      );
    }

    await createSite(page, {
      managerEmail: 'hong.manager.a@example.com',
      managerName: 'Test Manager A',
      managerPhone: '010-5555-1111',
      managementNumber: 'M-NEW-001',
      siteCode: 'SITE-NEW-001',
      siteName: siteAName,
    });
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 1);
    await createSite(page, {
      managerEmail: 'hong.manager.b@example.com',
      managerName: 'Test Manager B',
      managerPhone: '010-5555-3333',
      managementNumber: 'M-NEW-002',
      siteCode: 'SITE-NEW-002',
      siteName: siteBName,
    });
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 2);
    await assertSiteTableColumnCount(page);

    await getSiteTableRow(page, siteAName).click();
    await page.waitForURL(new RegExp(`siteId=${siteAId}`));
    await page
      .locator(`a[href="/admin?section=headquarters&editSiteId=${siteAId}&headquarterId=hq-1"]`)
      .waitFor({ state: 'visible' });
    const siteBackLabelCount = await page.getByText('현장 목록', { exact: true }).count();
    if (siteBackLabelCount !== 1) {
      throw new Error(
        `Expected a single shell back label for the site main view, received ${siteBackLabelCount}.`,
      );
    }

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await getSiteTableRow(page, siteBName).waitFor({ state: 'visible' });
    const siteReadsBeforeDelayedSelection = requestCounts.get('GET /api/admin/sites/list') || 0;
    await installDelayedSiteDetailRoute(page, siteBId);
    await getSiteTableRow(page, siteBName).click();
    await page.waitForURL(new RegExp(`siteId=${siteBId}`));

    const reportLink = page.locator(`a[href="/sites/${siteBId}"]`).first();
    await reportLink.waitFor({ state: 'visible' });
    await page.locator(`a[href="/sites/${siteBId}/quarterly"]`).first().waitFor({ state: 'visible' });
    await page.locator(`a[href="/sites/${siteBId}/photos"]`).first().waitFor({ state: 'visible' });
    await page.locator(`a[href^="/sites/${siteBId}/bad-workplace/"]`).first().waitFor({
      state: 'visible',
    });
    await reportLink.click();
    await page.waitForURL(new RegExp(`/sites/${siteBId}$`));
    await harness.waitForRequestCount('GET /api/admin/sites/:id', adminSiteReadsBefore + 1);
    await harness.waitForRequestCount(
      'GET /api/admin/sites/list',
      siteReadsBeforeDelayedSelection + 1,
    );

    await page.goto(
      `${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1&siteId=${siteAId}`,
      { waitUntil: 'load' },
    );
    await page
      .locator(`a[href="/admin?section=headquarters&editSiteId=${siteAId}&headquarterId=hq-1"]`)
      .click();
    const siteEditDialog = page.getByRole('dialog', { name: '현장 수정' });
    await siteEditDialog.getByLabel('현장소장 연락처').fill('010-5555-2222');
    await siteEditDialog.getByLabel('계약유형').selectOption('bid');
    await siteEditDialog.getByLabel('운영 메모').fill('현장 메인 quick edit smoke');
    await siteEditDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /sites/:id', siteUpdatesBefore + 1);

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await getSiteTableRow(page, siteAName).waitFor({ state: 'visible' });
    await getSiteTableRow(page, siteAName).getByRole('button').click();
    await page.getByRole('menuitem', { name: '지도요원 배정' }).click();
    const assignmentDialog = page.getByRole('dialog', { name: `${siteAName} 지도요원 배정` });
    await assignmentDialog.waitFor({ state: 'visible' });
    await assignmentDialog.getByRole('button', { name: '배정' }).first().click();
    await harness.waitForRequestCount('POST /assignments', assignmentCreatesBefore + 1);
    await assignmentDialog.getByRole('button', { name: '해제' }).first().click();
    await harness.waitForRequestCount('DELETE /assignments/:id', assignmentDeletesBefore + 1);
    await assignmentDialog.getByRole('button', { name: '닫기' }).click();

    page.once('dialog', (dialog) => dialog.accept());
    await getSiteTableRow(page, siteAName).getByRole('button').click();
    await page.getByRole('menuitem', { name: '삭제' }).click();
    await harness.waitForRequestCount('DELETE /sites/:id', siteDeletesBefore + 1);
    await page.getByText(siteAName, { exact: true }).waitFor({ state: 'hidden' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
