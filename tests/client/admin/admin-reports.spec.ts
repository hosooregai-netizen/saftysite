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
    await page.getByRole('heading', { level: 1, name: /전체 보고서/ }).waitFor({
      state: 'visible',
    });
    await page.getByText(/1차 기술지도 보고서/).first().waitFor();
    await page.getByText(/2026년 1분기 종합 보고서/).first().waitFor();

    await page.getByRole('button', { name: /1차 기술지도 보고서.*메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '검토 체크' }).click();
    const reviewDialog = page.getByRole('dialog', { name: /보고서 (검토|품질) 체크/ });
    await reviewDialog.locator('select').first().selectOption('ok');
    await reviewDialog.locator('textarea').fill('mocked admin smoke review');
    await reviewDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount(
      'PATCH /api/admin/reports/:id/review',
      reviewWritesBefore + 1,
    );
    await page.getByText('보고서 검토 체크를 저장했습니다.').first().waitFor();

    await page.getByRole('button', { name: /2026년 1분기 종합 보고서.*메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '발송이력 보기' }).click();
    const dispatchDialog = page.getByRole('dialog', { name: '분기 보고서 발송 이력' });
    await dispatchDialog.getByRole('button', { name: /수동 완료 처리/ }).click();
    await harness.waitForRequestCount(
      'PATCH /api/admin/reports/:id/dispatch',
      dispatchWritesBefore + 1,
    );
    await page.getByText('분기 보고서 발송 정보를 저장했습니다.').first().waitFor();

    await page.getByRole('button', { name: /2026년 3월 불량사업장 신고서.*메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '발송으로 변경' }).waitFor({ state: 'hidden' });
    await page.getByRole('menuitem', { name: '미발송으로 변경' }).waitFor({ state: 'hidden' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
