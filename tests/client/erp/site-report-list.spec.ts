import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runSiteReportListSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('site-report-list', config);

  try {
    const { page, requestCounts } = harness;
    const assignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports') || 0;
    const seedReadsBefore =
      requestCounts.get('GET /reports/site/:id/technical-guidance-seed') || 0;
    const dispatchWritesBefore = requestCounts.get('PATCH /api/reports/:id/dispatch') || 0;

    await page.goto(`${harness.baseURL}/sites/site-1`, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');

    await harness.waitForRequestCount('GET /assignments/me/sites', assignmentsBefore + 1);
    await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);
    await page.getByRole('heading', { name: /기술지도\s*보고서/ }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '보고서 추가' }).waitFor({ state: 'visible' });

    const firstRow = page.locator('article').filter({ hasText: '1차 기술지도 보고서' }).first();
    await firstRow.waitFor({ state: 'visible' });
    const toggledReportTitle = (await firstRow.getByRole('link').textContent())?.trim();
    await firstRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menu').locator('[role="menuitem"]').nth(1).click();
    await harness.waitForRequestCount(
      'PATCH /api/reports/:id/dispatch',
      dispatchWritesBefore + 1,
    );

    if (!toggledReportTitle) {
      throw new Error('토글한 기술지도 보고서 제목을 찾지 못했습니다.');
    }

    await page
      .locator('article')
      .filter({ hasText: toggledReportTitle })
      .getByText('발송완료')
      .waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '보고서 추가' }).click();
    const createDialog = page.getByRole('dialog', { name: /기술지도\s*보고서 생성/ });
    await createDialog.waitFor({ state: 'visible' });
    await createDialog.getByLabel('제목').fill('테스트 보고서 목록 연동');
    await createDialog.getByRole('button', { name: '생성' }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/technical-guidance-seed',
      seedReadsBefore + 1,
    );
    await page.waitForURL(/\/sessions\/[^/]+/);
    await page.getByRole('heading', { name: /^기술 지도/ }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
