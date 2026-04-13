import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness, getQuarterlySmokeQuarterKey } from '../fixtures/erpSmokeHarness';

export async function runQuarterlyReportSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('quarterly-report', config);

  try {
    const { page, requestCounts } = harness;
    const indexReadsBefore =
      requestCounts.get('GET /reports/site/:id/operational-index') || 0;
    const reportReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;
    const seedReadsBefore =
      requestCounts.get('GET /reports/site/:id/quarterly-summary-seed') || 0;
    const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
    const hwpxReadsBefore = requestCounts.get('POST /api/documents/quarterly/hwpx') || 0;
    const pdfReadsBefore = requestCounts.get('POST /api/documents/quarterly/pdf') || 0;

    await page.goto(harness.baseURL, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /assignments/me/sites', 1);

    await page.goto(`${harness.baseURL}/sites/site-1/quarterly`, { waitUntil: 'load' });
    await harness.waitForRequestCount(
      'GET /reports/site/:id/operational-index',
      indexReadsBefore + 1,
    );
    await page.getByRole('heading', { name: '분기 종합 보고서 목록' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('button', { name: '보고서 작성' }).click();
    await page.getByRole('heading', { name: '분기 종합 보고서 생성' }).waitFor({
      state: 'visible',
    });

    const quarterKey = getQuarterlySmokeQuarterKey();
    const [yearValue = '2026', quarterValue = '2'] = quarterKey.split('-Q');
    const year = Number.parseInt(yearValue, 10);
    const quarter = Number.parseInt(quarterValue, 10);
    const quarterStartDate =
      quarter === 1
        ? `${year}-01-01`
        : quarter === 2
          ? `${year}-04-01`
          : quarter === 3
            ? `${year}-07-01`
            : `${year}-10-01`;
    const quarterEndDate =
      quarter === 1
        ? `${year}-03-31`
        : quarter === 2
          ? `${year}-06-30`
          : quarter === 3
            ? `${year}-09-30`
            : `${year}-12-31`;

    await page
      .getByLabel('제목')
      .fill(`${year}년 ${quarter}분기 종합보고서 자동화`);
    await page.getByLabel('시작일').fill(quarterStartDate);
    await page.getByLabel('종료일').fill(quarterEndDate);
    await page.getByRole('button', { name: '생성' }).click();

    await harness.waitForRequestCount(
      'GET /reports/site/:id/quarterly-summary-seed',
      seedReadsBefore + 1,
    );
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);
    await page.waitForURL(/\/sites\/site-1\/quarterly\/[^/]+$/);
    await harness.waitForRequestCount('GET /reports/by-key/:id', reportReadsBefore + 1);

    await page.getByText('1. 원본 보고서 선택').waitFor({ state: 'visible' });
    await page.getByText('1. 기술지도 사업장 개요').waitFor({ state: 'visible' });
    await page.getByText('2. 재해유형 분석').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '문서 다운로드 (.hwpx)' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '문서 다운로드 (.pdf)' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '보고서 선택' }).click();
    const sourceSelectionDialog = page.getByRole('dialog', { name: '원본 보고서 선택' });
    await sourceSelectionDialog.waitFor({ state: 'visible' });
    await page.getByText('1차 기술지도 보고서').waitFor({ state: 'visible' });
    await sourceSelectionDialog.getByRole('button', { name: '선택 해제' }).click();
    await sourceSelectionDialog.getByRole('button', { name: '다시 계산' }).click();
    await sourceSelectionDialog.waitFor({ state: 'hidden' });

    const siteManagerInput = page.getByLabel('책임자');
    await siteManagerInput.fill('박소장 수정');
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 2);

    await page.getByRole('button', { name: '문서 다운로드 (.hwpx)' }).click();
    await harness.waitForRequestCount('POST /api/documents/quarterly/hwpx', hwpxReadsBefore + 1);

    await page.getByRole('button', { name: '문서 다운로드 (.pdf)' }).click();
    await harness.waitForRequestCount('POST /api/documents/quarterly/pdf', pdfReadsBefore + 1);

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
