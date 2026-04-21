import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminControlCenterSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-control-center', config);

  try {
    const { page, requestCounts } = harness;
    const overviewExportsBefore = requestCounts.get('POST /api/admin/exports/:section') || 0;
    const analyticsSummaryReadsBefore =
      requestCounts.get('GET /api/admin/dashboard/analytics') || 0;
    const analyticsTableDetailReadsBefore =
      requestCounts.get('GET /api/admin/dashboard/analytics/month-detail') || 0;

    await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/dashboard/overview', 1);
    await page.waitForTimeout(600);

    for (const requestKey of [
      'GET /users',
      'GET /headquarters',
      'GET /sites',
      'GET /assignments',
      'GET /reports',
      'GET /api/admin/reports',
    ]) {
      if ((requestCounts.get(requestKey) || 0) > 0) {
        throw new Error(`Overview first load should not prefetch bulk admin data: ${requestKey}`);
      }
    }

    await page.getByRole('heading', { name: '운영 개요' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '엑셀 내보내기' }).first().click();
    await harness.waitForRequestCount('POST /api/admin/exports/:section', overviewExportsBefore + 1);

    await page.goto(`${harness.baseURL}/admin?section=analytics`, { waitUntil: 'load' });
    await page.getByText('매출/실적 집계').first().waitFor();
    await harness.waitForRequestCount(
      'GET /api/admin/dashboard/analytics',
      analyticsSummaryReadsBefore + 1,
    );
    await harness.waitForRequestCount(
      'GET /api/admin/dashboard/analytics/month-detail',
      analyticsTableDetailReadsBefore + 1,
    );
    await page.getByRole('columnheader', { name: '지도요원명' }).waitFor();
    if ((await page.getByText('직원별 매출 기여도 Top 10').count()) > 0) {
      throw new Error('직원별 매출 기여도 Top 10 카드는 제거되어야 합니다.');
    }
    if ((await page.getByText('상위 매출 사업장 Top 10').count()) > 0) {
      throw new Error('상위 매출 사업장 Top 10 카드는 제거되어야 합니다.');
    }
    if ((await page.getByRole('columnheader', { name: '전기 대비' }).count()) > 0) {
      throw new Error('직원별 표에는 전기 대비 컬럼이 제거되어야 합니다.');
    }
    if ((await page.getByRole('columnheader', { name: '실적률' }).count()) > 0) {
      throw new Error('직원별 표에는 실적률 컬럼이 제거되어야 합니다.');
    }
    if ((await page.getByRole('button', { name: '현장별' }).count()) > 0) {
      throw new Error('현장별 상세 탭은 더 이상 보이면 안 됩니다.');
    }
    if ((await page.locator('input[type="month"]').count()) > 0) {
      throw new Error('analytics 월 입력 필드는 제거되어야 합니다.');
    }
    await page.getByText(/1 \/ \d+ 페이지/).first().waitFor();
    if ((await page.getByRole('button', { name: '누적' }).count()) > 0) {
      throw new Error('상세표 범위 전환 버튼은 제거되어야 합니다.');
    }
    if ((await page.getByRole('button', { name: '필터' }).count()) > 0) {
      throw new Error('analytics 필터 메뉴는 제거되어야 합니다.');
    }
    if ((await page.getByRole('button', { name: '엑셀 내보내기' }).count()) > 1) {
      throw new Error('analytics 화면에는 별도 엑셀 내보내기 버튼이 남아 있으면 안 됩니다.');
    }
    if ((requestCounts.get('POST /api/admin/exports/:section') || 0) !== overviewExportsBefore + 1) {
      throw new Error('analytics 화면은 추가 export 요청을 만들지 않아야 합니다.');
    }

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
