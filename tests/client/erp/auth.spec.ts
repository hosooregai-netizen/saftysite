import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runAuthSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('auth', config);

  try {
    const { page } = harness;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.waitForLoginPanel();
    await page.getByText('현장 목록 로그인').waitFor({ state: 'visible' });

    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);
    await page.getByRole('heading', { name: '현장 목록' }).waitFor({ state: 'visible' });
    await page.getByText('기존 현장').first().waitFor({ state: 'visible' });

    await harness.logoutToLoginPanel();
    await page.getByText('현장 목록 로그인').waitFor({ state: 'visible' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('POST /auth/token', 2);
    await page.getByRole('heading', { name: '현장 목록' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
