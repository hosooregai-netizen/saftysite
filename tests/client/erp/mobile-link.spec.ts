import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runMobileLinkSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-link', config);

  try {
    const { page, requestCounts } = harness;
    const authWritesBefore = requestCounts.get('POST /auth/token') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;
    const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;

    await page.goto(`${harness.baseURL}/mobile/sessions/report-tech-1`, {
      waitUntil: 'load',
    });
    await page.getByRole('heading', { name: '모바일 보고서 로그인' }).waitFor({
      state: 'visible',
    });
    await page.waitForTimeout(500);
    if ((requestCounts.get('POST /auth/token') || 0) !== authWritesBefore) {
      throw new Error('모바일 로그인 화면이 자동으로 로그인 요청을 보냈습니다.');
    }

    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);
    await harness.waitForRequestCount('GET /reports/by-key/:id', reportReadsBefore + 1);

    await page.getByRole('heading', { name: '기술지도 개요' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' });

    const progressRateInput = page
      .locator('label', { hasText: '공정률 (%)' })
      .locator('input');
    await progressRateInput.fill('52');

    await page.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
