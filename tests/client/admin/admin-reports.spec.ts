import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminReportsSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-reports', config);

  try {
    const { page, requestCounts } = harness;
    const reviewWritesBefore = requestCounts.get('PATCH /api/admin/reports/:id/review') || 0;
    const dispatchWritesBefore = requestCounts.get('PATCH /api/admin/reports/:id/dispatch') || 0;

    await page.goto(`${harness.baseURL}/admin?section=reports`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/reports', 1);
    await page.getByRole('heading', { level: 1, name: /전체 보고서|蹂닿퀬/ }).waitFor({ state: 'visible' });
    await page.getByText(/1차 기술지도 보고서|湲곗닠/).first().waitFor();
    await page.getByText(/2026년 1분기 종합 보고서|1遺꾧린/).first().waitFor();

    await page.getByRole('button', { name: /1차 기술지도 보고서|湲곗닠/ }).click();
    await page.getByRole('menuitem', { name: /검토 체크|寃/ }).click();
    const reviewDialog = page.getByRole('dialog');
    await reviewDialog.locator('select').first().selectOption('ok');
    await reviewDialog.locator('textarea').fill('mocked admin smoke review');
    await reviewDialog.getByRole('button').last().click();
    await harness.waitForRequestCount('PATCH /api/admin/reports/:id/review', reviewWritesBefore + 1);
    await page.getByText(/검토 상태를 저장했습니다|寃/).first().waitFor();

    await page.getByRole('button', { name: /2026년 1분기 종합 보고서|1遺꾧린/ }).click();
    await page.getByRole('menuitem', { name: /발송 상태 관리|諛쒖넚/ }).click();
    const dispatchDialog = page.getByRole('dialog');
    await dispatchDialog.getByRole('button').last().click();
    await harness.waitForRequestCount('PATCH /api/admin/reports/:id/dispatch', dispatchWritesBefore + 1);
    await page.getByText(/발송 완료 상태로 저장했습니다|諛쒖넚/).first().waitFor();

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
