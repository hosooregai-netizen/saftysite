import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runMobileSiteHomeSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-site-home', config);

  try {
    const { page, requestCounts } = harness;
    const assignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports') || 0;
    const operationalReadsBefore = requestCounts.get('GET /reports/site/:id/operational-index') || 0;
    const reportDetailReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;

    await page.goto(`${harness.baseURL}/mobile/sites/site-1`, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');

    await harness.waitForRequestCount('GET /assignments/me/sites', assignmentsBefore + 1);
    await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);
    await harness.waitForRequestCount(
      'GET /reports/site/:id/operational-index',
      operationalReadsBefore + 1,
    );

    await page.getByRole('heading', { name: '현장 정보' }).waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: '기술지도 보고서' }).waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: '분기보고서' }).waitFor({ state: 'visible' });

    // Pointer clicks here can land on the sticky mobile chrome instead of the anchor in CI/dev.
    await page
      .locator('a[href="/mobile/sites/site-1/quarterly"]')
      .first()
      .evaluate((element) => (element as HTMLAnchorElement).click());
    await page.waitForURL(/\/mobile\/sites\/site-1\/quarterly$/);
    await page.getByRole('heading', { name: '분기 보고 목록' }).waitFor({ state: 'visible' });

    await page.goto(`${harness.baseURL}/mobile/sites/site-1`, { waitUntil: 'load' });
    const reportSection = page.locator('section', {
      has: page.getByRole('heading', { name: '기술지도 보고서' }),
    });
    await reportSection.getByRole('link').first().click();
    await harness.waitForRequestCount('GET /reports/by-key/:id', reportDetailReadsBefore + 1);
    await page.waitForURL(/\/mobile\/sessions\/[^/]+/);
    await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
