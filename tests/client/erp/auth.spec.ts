import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runAuthSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('auth', config);

  try {
    const { page, requestCounts } = harness;
    const authWritesBefore = requestCounts.get('POST /auth/token') || 0;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.waitForLoginPanel();
    await page.getByRole('button', { name: '로그인' }).waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    if ((requestCounts.get('POST /auth/token') || 0) !== authWritesBefore) {
      throw new Error('로그인 버튼을 누르기 전에 자동 로그인 요청이 발생했습니다.');
    }

    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);
    await page.waitForURL(/\/calendar(?:\?.*)?$/);
    await page.getByRole('heading', { name: '내 일정' }).waitFor({ state: 'visible' });

    await harness.logoutToLoginPanel();
    await page.getByRole('button', { name: '로그인' }).waitFor({ state: 'visible' });
    const authWritesAfterLogout = requestCounts.get('POST /auth/token') || 0;
    await page.waitForTimeout(500);
    if ((requestCounts.get('POST /auth/token') || 0) !== authWritesAfterLogout) {
      throw new Error('로그아웃 후 로그인 버튼 없이 자동 로그인 요청이 다시 발생했습니다.');
    }
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('POST /auth/token', 2);
    await page.waitForURL(/\/calendar(?:\?.*)?$/);
    await page.getByRole('heading', { name: '내 일정' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
