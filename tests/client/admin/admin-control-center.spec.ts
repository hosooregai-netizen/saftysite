import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminControlCenterSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-control-center', config);

  try {
    const { page, requestCounts } = harness;
    const overviewExportsBefore = requestCounts.get('POST /api/admin/exports/:section') || 0;
    const analyticsReadsBefore = requestCounts.get('GET /api/admin/dashboard/analytics') || 0;
    await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/dashboard/overview', 1);
    await page.getByRole('heading', { name: '운영 개요' }).waitFor({ state: 'visible' });
    await page.getByText('현장 상태').first().waitFor();
    await page.getByText('발송 관리 대상').first().waitFor();
    await page.getByRole('button', { name: '엑셀 내보내기' }).click();
    await harness.waitForRequestCount('POST /api/admin/exports/:section', overviewExportsBefore + 1);

    await page.goto(`${harness.baseURL}/admin?section=analytics`, { waitUntil: 'load' });
    await harness.waitForRequestCount('GET /api/admin/dashboard/analytics', 1);
    await page.getByText('매출/실적 집계').first().waitFor();
    await page.getByText('월별 매출 추이').first().waitFor();
    await page.getByRole('button', { name: '필터' }).click();
    await page.locator('#analytics-filter-period').selectOption('year');
    await harness.waitForRequestCount(
      'GET /api/admin/dashboard/analytics',
      analyticsReadsBefore + 2,
    );
    await page.getByText('집계 기간').first().waitFor();
    await page.getByRole('button', { name: '엑셀 내보내기' }).click();
    await harness.waitForRequestCount('POST /api/admin/exports/:section', overviewExportsBefore + 2);

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
