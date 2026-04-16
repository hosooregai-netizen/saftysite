import assert from 'node:assert/strict';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runSiteHubSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('site-hub', config);

  try {
    const { page } = harness;
    const reportReadsBefore = harness.requestCounts.get('GET /reports') || 0;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);
    await page.getByRole('heading', { name: '현장 목록' }).waitFor({ state: 'visible' });

    await page.getByRole('link', { name: '기존 현장' }).first().click();
    await page.waitForURL(/\/sites\/site-1\/entry$/);
    await harness.waitForRequestCount('GET /reports', reportReadsBefore + 1);
    await page.getByRole('heading', { name: '사업장/현장 식별' }).waitFor({
      state: 'visible',
    });

    await page.getByRole('link', { name: '분기 보고서 목록' }).first().click();
    await page.waitForURL(/\/sites\/site-1\/quarterly/);
    await page.getByRole('heading', { name: '분기 종합 보고서 목록' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('button', { name: '보고서 작성' }).waitFor({
      state: 'visible',
    });
    const quarterlyPageText = await page.locator('body').textContent();
    assert.equal(
      quarterlyPageText?.includes('분기 종합 보고서') ?? false,
      true,
      '분기 종합 보고서 목록 화면으로 이동하지 못했습니다.',
    );

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
