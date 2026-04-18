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
    await page.waitForTimeout(250);
    if ((requestCounts.get('GET /api/admin/reports') || 0) !== 1) {
      throw new Error('Reports section should issue one initial admin reports request.');
    }
    await page.getByRole('heading', { level: 1, name: /전체 보고서/ }).waitFor({
      state: 'visible',
    });

    await page.goto(
      `${harness.baseURL}/sessions/${encodeURIComponent('legacy:technical_guidance:1001')}`,
      { waitUntil: 'load' },
    );
    await page.getByRole('button', { name: 'HWPX 다운로드' }).waitFor({
      state: 'visible',
    });
    await page.getByText('보고서를 찾을 수 없습니다.').waitFor({ state: 'hidden' });

    await page.goto(`${harness.baseURL}/admin?section=reports`, { waitUntil: 'load' });
    await page.getByRole('heading', { level: 1, name: /전체 보고서/ }).waitFor({
      state: 'visible',
    });

    const technicalRow = page.locator('tbody tr').filter({ hasText: '1차 기술지도 보고서' }).first();
    await technicalRow.waitFor({ state: 'visible' });
    await technicalRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menu').locator('[role="menuitem"]').nth(5).click();

    const reviewDialog = page.getByRole('dialog', { name: /보고서 (검토|품질) 체크/ });
    await reviewDialog.locator('select').first().selectOption('ok');
    await reviewDialog.locator('textarea').fill('mocked admin smoke review');
    await reviewDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount(
      'PATCH /api/admin/reports/:id/review',
      reviewWritesBefore + 1,
    );
    await reviewDialog.waitFor({ state: 'hidden' });
    const reportReadsBeforeDispatch = requestCounts.get('GET /api/admin/reports') || 0;

    const quarterlyRow = page
      .locator('tbody tr')
      .filter({ hasText: '2026년 1분기 종합 보고서' })
      .first();
    await quarterlyRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menu').locator('[role="menuitem"]').last().click();

    const dispatchDialog = page.getByRole('dialog', { name: '분기 보고서 발송 이력' });
    await dispatchDialog.getByRole('button', { name: /수동 완료 처리/ }).click();
    await harness.waitForRequestCount(
      'PATCH /api/admin/reports/:id/dispatch',
      dispatchWritesBefore + 1,
    );
    await dispatchDialog.waitFor({ state: 'hidden' });
    await page.waitForTimeout(250);

    if ((requestCounts.get('GET /api/admin/reports') || 0) !== reportReadsBeforeDispatch) {
      throw new Error('Manual dispatch toggle should not force an extra admin reports refetch.');
    }

    const badWorkplaceRow = page
      .locator('tbody tr')
      .filter({ hasText: '2026년 3월 불량사업장 신고' })
      .first();
    await badWorkplaceRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: '발송으로 변경' }).waitFor({ state: 'hidden' });
    await page.getByRole('menuitem', { name: '미발송으로 변경' }).waitFor({ state: 'hidden' });
    await page.keyboard.press('Escape');

    const legacyTechnicalRow = page
      .locator('tbody tr')
      .filter({ hasText: '레거시 5차 기술지도 보고서' })
      .first();
    await legacyTechnicalRow.waitFor({ state: 'visible' });
    await legacyTechnicalRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: '열기', exact: true }).click();
    await page.getByRole('dialog', { name: '원본 PDF 보기' }).waitFor({ state: 'visible' });
    await page.locator('iframe[title*="원본 PDF"]').waitFor({ state: 'visible' });
    if (page.url().includes('/sessions/')) {
      throw new Error('Legacy reports should open as in-app original PDF, not the authoring session screen.');
    }

    await page.goto(
      `${harness.baseURL}/admin/report-open?reportKey=${encodeURIComponent('legacy:technical_guidance:1001')}`,
      { waitUntil: 'load' },
    );
    await page.locator('iframe[title*="PDF"]').waitFor({ state: 'visible' });
    if (!page.url().includes('/admin/report-open')) {
      throw new Error('Direct legacy PDF fallback route should stay on the report-open page.');
    }

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
