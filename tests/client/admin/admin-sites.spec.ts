import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminSitesSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-sites', config);

  try {
    const { page, requestCounts } = harness;
    const siteCreatesBefore = requestCounts.get('POST /sites') || 0;
    const siteUpdatesBefore = requestCounts.get('PATCH /sites/:id') || 0;

    await page.goto(`${harness.baseURL}/admin?section=headquarters&siteStatus=all`, {
      waitUntil: 'load',
    });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /headquarters', 1);
    await harness.waitForRequestCount('GET /sites', 1);
    await page.getByRole('heading', { level: 2, name: '현장 목록' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '현장 추가' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '현장 추가' }).click();
    const createDialog = page.getByRole('dialog', { name: '현장 추가' });
    await createDialog.locator('select').first().selectOption('hq-1');
    await createDialog.getByLabel('현장명').fill('mocked admin site');
    await createDialog.getByRole('button', { name: '생성' }).click();
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 1);

    await page.getByRole('button', { name: /기존 현장 메뉴 열기|mocked admin site 현장 작업 메뉴 열기/ }).first().click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    const editDialog = page.getByRole('dialog', { name: '현장 수정' });
    await editDialog.getByLabel('현장명').fill('mocked admin site updated');
    await editDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /sites/:id', siteUpdatesBefore + 1);

    await page.getByRole('button', { name: /mocked admin site updated 현장 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '지도요원 배정' }).click();
    await page.getByRole('dialog', { name: '지도요원 배정' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
