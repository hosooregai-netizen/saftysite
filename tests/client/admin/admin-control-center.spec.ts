import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminControlCenterSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-control-center', config);

  try {
    const { page } = harness;
    await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/dashboard/overview', 1);
    await page.getByRole('heading', { name: '운영 개요' }).waitFor({ state: 'visible' });
    await page.getByText('현장 상태').first().waitFor();
    await page.getByText('발송 관리 대상').first().waitFor();

    await page.goto(`${harness.baseURL}/admin?section=analytics`, { waitUntil: 'load' });
    await harness.waitForRequestCount('GET /api/admin/dashboard/analytics', 1);
    await page.getByText('매출/실적 집계').first().waitFor();
    await page.getByText('월별 매출 추이').first().waitFor();

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
