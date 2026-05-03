import assert from 'node:assert/strict';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runSiteHubSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('site-hub', config);

  try {
    const { page } = harness;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);
    await page.getByRole('heading', { name: '내 일정' }).waitFor({ state: 'visible' });

    await page.goto(`${harness.baseURL}/sites/site-1/entry`, { waitUntil: 'load' });
    await page.waitForURL(/\/sites\/site-1\/entry$/);
    await page.getByRole('heading', { name: '현장 개요' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('heading', { name: '담당 정보' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('heading', { name: '공사 정보' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('heading', { name: '계약 정보' }).waitFor({
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
