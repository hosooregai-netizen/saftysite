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

export async function runAdminSitesSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-sites', config);

  try {
    const { page, requestCounts } = harness;
    const siteListReadsBefore = requestCounts.get('GET /api/admin/sites/list') || 0;
    const lookupReadsBefore = requestCounts.get('GET /api/admin/directory/lookups') || 0;
    const siteCreatesBefore = requestCounts.get('POST /sites') || 0;
    const siteUpdatesBefore = requestCounts.get('PATCH /sites/:id') || 0;

    await page.goto(`${harness.baseURL}/admin?section=headquarters&headquarterId=hq-1`, {
      waitUntil: 'load',
    });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/sites/list', siteListReadsBefore + 1);
    await harness.waitForRequestCount('GET /api/admin/directory/lookups', lookupReadsBefore + 1);
    await page.getByRole('button', { name: '사업장 정보 수정' }).waitFor({ state: 'visible' });

    const siteSearchInput = page.getByPlaceholder('현장명, 사업장 관리번호, 공사 종류, 주소, 점검자·배정 지도요원으로 검색');
    await siteSearchInput.fill('ZZ-no-match-123');
    await page.getByText('등록된 현장이 없습니다.', { exact: true }).waitFor({ state: 'visible' });
    await siteSearchInput.fill('김요원');
    await page.getByText('등록된 현장이 없습니다.', { exact: true }).waitFor({ state: 'hidden' });
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });
    await siteSearchInput.fill('');
    await page.locator('tbody').getByText('기존 현장', { exact: true }).waitFor({ state: 'visible' });

    const headquarterBackLabelCount = await page.getByText('사업장 목록', { exact: true }).count();
    if (headquarterBackLabelCount !== 1) {
      throw new Error(
        `Expected a single shell back label for the headquarter drilldown, received ${headquarterBackLabelCount}.`,
      );
    }

    await page.getByRole('button', { name: '현장 추가' }).click();
    const siteCreateDialog = page.getByRole('dialog', { name: '현장 추가' });
    await siteCreateDialog.getByLabel('현장명').fill('mocked admin site');
    await siteCreateDialog.getByLabel('현장코드').fill('SITE-NEW-001');
    await siteCreateDialog.getByLabel('현장관리번호').fill('M-NEW-001');
    await siteCreateDialog.getByLabel('현장소장명').fill('홍소장');
    await siteCreateDialog.getByLabel('현장소장 연락처').fill('010-5555-1111');
    await siteCreateDialog.getByLabel('현장대리인/소장 메일').fill('hong.manager@example.com');
    await siteCreateDialog.getByLabel('계약유형').selectOption('private');
    await siteCreateDialog.getByLabel('계약상태').selectOption('active');
    await siteCreateDialog.getByLabel('기술지도 대가').fill('1200000');
    await siteCreateDialog.getByLabel('기술지도 횟수').fill('12');
    await siteCreateDialog.getByLabel('회차당 단가').fill('100000');
    await siteCreateDialog.getByRole('button', { name: '생성' }).click();
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 1);
    await assertSiteTableColumnCount(page);

    await page.getByRole('button', { name: /mocked admin site 현장 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '현장 메인' }).click();
    await page.getByRole('link', { name: '현장 정보 수정' }).waitFor({ state: 'visible' });
    await page.getByText('사업장/현장 식별').waitFor({ state: 'visible' });
    const siteBackLabelCount = await page.getByText('현장 목록', { exact: true }).count();
    if (siteBackLabelCount !== 1) {
      throw new Error(
        `Expected a single shell back label for the site main view, received ${siteBackLabelCount}.`,
      );
    }

    await page.getByRole('link', { name: '현장 정보 수정' }).click();
    const siteEditDialog = page.getByRole('dialog', { name: '현장 수정' });
    await siteEditDialog.getByLabel('현장소장 연락처').fill('010-5555-2222');
    await siteEditDialog.getByLabel('계약유형').selectOption('bid');
    await siteEditDialog.getByLabel('운영 메모').fill('현장 메인 quick edit smoke');
    await siteEditDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /sites/:id', siteUpdatesBefore + 1);

    await page.getByRole('button', { name: /mocked admin site 현장 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '지도요원 배정' }).click();
    const assignmentDialog = page.getByRole('dialog', { name: '지도요원 배정' });
    await assignmentDialog.waitFor({ state: 'visible' });
    await assignmentDialog.getByRole('button', { name: '닫기' }).click();

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
