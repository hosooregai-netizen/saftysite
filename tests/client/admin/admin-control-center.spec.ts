import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminControlCenterSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-control-center', config);

  try {
    const { page, requestCounts } = harness;
    const overviewExportsBefore = requestCounts.get('POST /api/admin/exports/:section') || 0;
    const analyticsReadsBefore = requestCounts.get('GET /api/admin/dashboard/analytics') || 0;
    const siteUpdatesBefore = requestCounts.get('PATCH /sites/:id') || 0;
    await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    await page.getByText('현장 안전 점검 시스템').first().waitFor();
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/dashboard/overview', 1);
    await page.getByRole('heading', { name: '운영 개요' }).waitFor({ state: 'visible' });
    await page.getByText('현장 상태').first().waitFor();
    await page.getByText('발송 관리 대상').first().waitFor();
    await page.getByRole('button', { name: '엑셀 내보내기' }).click();
    await harness.waitForRequestCount('POST /api/admin/exports/:section', overviewExportsBefore + 1);

    await page.goto(`${harness.baseURL}/admin?section=headquarters&siteStatus=all`, {
      waitUntil: 'load',
    });
    await page.getByRole('heading', { level: 2, name: '현장 목록' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /기존 현장 .*메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    const editDialog = page.getByRole('dialog', { name: '현장 수정' });
    await editDialog.getByLabel('기술지도 대가').fill('1200000');
    await editDialog.getByLabel('기술지도 횟수').fill('12');
    await editDialog.getByLabel('회차당 단가').fill('');
    await editDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /sites/:id', siteUpdatesBefore + 1);

    await page.goto(`${harness.baseURL}/admin?section=analytics`, { waitUntil: 'load' });
    await page.getByText('매출/실적 집계').first().waitFor();
    await page.getByText('집계 기준').first().waitFor();
    await page.getByText('방문 일정 경과 기준').first().waitFor();
    await harness.waitForRequestCount('GET /api/admin/dashboard/analytics', analyticsReadsBefore + 1);
    await page.getByText('월별 매출 추이').first().waitFor();
    await page.getByRole('button', { name: '필터' }).click();
    await page.locator('#analytics-filter-period').selectOption('year');
    await page.getByText('매출/실적 집계').first().waitFor();
    await harness.waitForRequestCount(
      'GET /api/admin/dashboard/analytics',
      analyticsReadsBefore + 2,
    );
    await page.getByText('집계 기간').first().waitFor();
    await page.getByText('계약 예정 매출').first().waitFor();
    await page.getByText('1,200,000원').first().waitFor();
    await page.getByText('400,000원').first().waitFor();
    await page.getByText('100,000원').first().waitFor();
    await page.getByRole('button', { name: '엑셀 내보내기' }).click();
    await harness.waitForRequestCount('POST /api/admin/exports/:section', overviewExportsBefore + 2);

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
