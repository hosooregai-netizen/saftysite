import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runMobileSiteReportsSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-site-reports', config);

  try {
    const { page, requestCounts } = harness;
    const assignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports') || 0;
    const seedReadsBefore = requestCounts.get('GET /reports/site/:id/technical-guidance-seed') || 0;

    await page.goto(`${harness.baseURL}/mobile/sites/site-1/reports`, {
      waitUntil: 'load',
    });
    await harness.loginAs('agent@example.com');

    await harness.waitForRequestCount('GET /assignments/me/sites', assignmentsBefore + 1);
    await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);

    await page.getByRole('heading', { name: '현장 보고서 요약' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /\+ 보고서 추가|첫 보고서 추가/ }).first().waitFor({
      state: 'visible',
    });

    await page.getByRole('button', { name: /\+ 보고서 추가|첫 보고서 추가/ }).first().click();
    const createDialog = page.getByRole('dialog', { name: '기술지도 보고서 추가' });
    await createDialog.waitFor({ state: 'visible' });
    await createDialog.getByLabel('제목').fill('모바일 보고서 목록 자동화');
    await createDialog.getByRole('button', { name: '추가' }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/technical-guidance-seed',
      seedReadsBefore + 1,
    );
    await page.waitForURL(/\/mobile\/sessions\/[^/]+/);
    await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
