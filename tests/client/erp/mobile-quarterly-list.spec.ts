import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runMobileQuarterlyListSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-quarterly-list', config);

  try {
    const { page, requestCounts } = harness;
    const assignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
    const indexReadsBefore = requestCounts.get('GET /reports/site/:id/operational-index') || 0;
    const seedReadsBefore = requestCounts.get('GET /reports/site/:id/quarterly-summary-seed') || 0;
    const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;

    await page.goto(`${harness.baseURL}/mobile/sites/site-1/quarterly`, {
      waitUntil: 'load',
    });
    await harness.loginAs('agent@example.com');

    await harness.waitForRequestCount('GET /assignments/me/sites', assignmentsBefore + 1);
    await harness.waitForRequestCount(
      'GET /reports/site/:id/operational-index',
      indexReadsBefore + 1,
    );

    await page.getByRole('heading', { name: '분기 보고 목록' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /분기 보고 만들기/ }).waitFor({
      state: 'visible',
    });

    await page.getByRole('button', { name: /분기 보고 만들기/ }).first().click();
    const createDialog = page.getByRole('dialog', { name: '분기 보고 만들기' });
    await createDialog.waitFor({ state: 'visible' });

    await createDialog.getByLabel('분기').selectOption('3');
    await createDialog.getByLabel('제목').fill('모바일 분기 목록 자동화');
    await createDialog.getByRole('button', { name: '생성' }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/quarterly-summary-seed',
      seedReadsBefore + 1,
    );
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);
    await harness.waitForRequestCount('GET /reports/by-key/:id', reportReadsBefore + 1);
    await page.waitForURL(/\/mobile\/sites\/site-1\/quarterly\/[^/]+$/);
    await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
