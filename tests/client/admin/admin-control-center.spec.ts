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
    await page.getByText('관리 중인 현장').first().waitFor();

    const priorityQuarterlyHeading = page.getByRole('heading', { name: /20억 이상 분기보고/ }).first();
    const priorityQuarterlySection = priorityQuarterlyHeading.locator('xpath=ancestor::section[1]');
    await priorityQuarterlyHeading.waitFor();
    await priorityQuarterlySection.getByText(/\d{4}년 \d분기/).first().waitFor();
    const hasPriorityQuarterlyRows =
      (await priorityQuarterlySection.locator('tbody tr').count()) > 0;
    if (hasPriorityQuarterlyRows) {
      await priorityQuarterlySection.locator('tbody tr').first().waitFor();
      await Promise.all([
        page.waitForURL(/\/sites\/[^/?#]+\/quarterly(?:[?#]|$)/),
        priorityQuarterlySection.locator('tbody tr').first().click(),
      ]);
      await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    } else {
      await priorityQuarterlySection.getByText(
        '현재 관리가 필요한 20억 이상 활성 현장이 없습니다.',
      ).waitFor();
    }

    const unsentHeading = page.getByRole('heading', { name: /발송 관리 대상/ }).first();
    const unsentSection = unsentHeading.locator('xpath=ancestor::section[1]');
    await unsentHeading.waitFor();
    await unsentSection.locator('tbody tr').first().waitFor();

    const unsentNavigation = page
      .waitForURL(/\/sites\/[^/?#]+(?:[?#]|$)/, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    await unsentSection.locator('tbody tr').first().click();
    if (await unsentNavigation) {
      await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    }
    await page.getByRole('button', { name: '엑셀 내보내기' }).click();
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
      throw new Error('직원별 표에서 전기 대비 열이 제거되어야 합니다.');
    }
    if ((await page.getByRole('columnheader', { name: '실적률' }).count()) > 0) {
      throw new Error('직원별 표에서 실적률 열이 제거되어야 합니다.');
    }

    await page.getByRole('heading', { name: '직원별 월별 매출' }).waitFor();
    if ((await page.getByRole('button', { name: '현장별' }).count()) > 0) {
      throw new Error('현장별 탭은 제거되어야 합니다.');
    }
    if ((await page.getByRole('button', { name: '필터' }).count()) > 0) {
      throw new Error('analytics 헤더의 필터 버튼은 제거되어야 합니다.');
    }
    if ((await page.getByRole('button', { name: '엑셀 내보내기' }).count()) > 0) {
      throw new Error('analytics 헤더의 엑셀 내보내기 버튼은 제거되어야 합니다.');
    }
    if ((await page.locator('input[type="month"]').count()) > 0) {
      throw new Error('analytics month input은 제거되어야 합니다.');
    }
    if ((await page.getByRole('button', { name: '이번 달' }).count()) > 0) {
      throw new Error('analytics month toolbar의 이번 달 버튼은 제거되어야 합니다.');
    }

    const monthBadge = page.getByText(/\d{4}년 \d{1,2}월/).first();
    const basisMonthBefore = await monthBadge.textContent();
    const analyticsSummaryReadsAtMonthBack =
      requestCounts.get('GET /api/admin/dashboard/analytics') || 0;
    const analyticsTableDetailReadsAtMonthBack =
      requestCounts.get('GET /api/admin/dashboard/analytics/month-detail') || 0;
    await page.getByRole('button', { name: '이전 달' }).click();
    await harness.waitForRequestCount(
      'GET /api/admin/dashboard/analytics/month-detail',
      analyticsTableDetailReadsAtMonthBack + 1,
    );
    const basisMonthAfterBack = await monthBadge.textContent();
    if (!basisMonthBefore || !basisMonthAfterBack || basisMonthBefore === basisMonthAfterBack) {
      throw new Error('이전 달 버튼은 기준월 배지를 바꿔야 합니다.');
    }
    if ((requestCounts.get('GET /api/admin/dashboard/analytics') || 0) !== analyticsSummaryReadsAtMonthBack) {
      throw new Error('기준월 이전 이동은 analytics summary를 다시 요청하지 않아야 합니다.');
    }

    const analyticsSummaryReadsAtMonthForward =
      requestCounts.get('GET /api/admin/dashboard/analytics') || 0;
    const analyticsTableDetailReadsAtMonthForward =
      requestCounts.get('GET /api/admin/dashboard/analytics/month-detail') || 0;
    await page.getByRole('button', { name: '다음 달' }).click();
    await page.waitForTimeout(300);
    const basisMonthAfterForward = await monthBadge.textContent();
    if (basisMonthAfterForward !== basisMonthBefore) {
      throw new Error('다음 달 버튼은 기준월 배지를 원래 값으로 되돌려야 합니다.');
    }
    if ((requestCounts.get('GET /api/admin/dashboard/analytics') || 0) !== analyticsSummaryReadsAtMonthForward) {
      throw new Error('기준월 다음 이동도 analytics summary를 다시 요청하지 않아야 합니다.');
    }
    const analyticsTableDetailReadsAfterForward =
      requestCounts.get('GET /api/admin/dashboard/analytics/month-detail') || 0;
    if (
      analyticsTableDetailReadsAfterForward !== analyticsTableDetailReadsAtMonthForward &&
      analyticsTableDetailReadsAfterForward !== analyticsTableDetailReadsAtMonthForward + 1
    ) {
      throw new Error('기준월 다음 이동은 month-detail cache hit 또는 단일 재요청만 허용해야 합니다.');
    }

    await page.getByText(/1 \/ \d+ 페이지/).first().waitFor();
    if ((await page.getByRole('button', { name: '누적' }).count()) > 0) {
      throw new Error('상세표 범위 전환 버튼은 제거되어야 합니다.');
    }

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
