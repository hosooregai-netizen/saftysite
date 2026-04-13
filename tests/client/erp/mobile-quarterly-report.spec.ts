import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness, getQuarterlySmokeQuarterKey } from '../fixtures/erpSmokeHarness';

export async function runMobileQuarterlyReportSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-quarterly-report', config);

  try {
    const { page, requestCounts } = harness;
    const quarterKey = getQuarterlySmokeQuarterKey();
    const reportReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;
    const seedReadsBefore = requestCounts.get('GET /reports/site/:id/quarterly-summary-seed') || 0;
    const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
    const hwpxReadsBefore = requestCounts.get('POST /api/documents/quarterly/hwpx') || 0;
    const pdfReadsBefore = requestCounts.get('POST /api/documents/quarterly/pdf') || 0;

    await page.goto(`${harness.baseURL}/mobile/sites/site-1/quarterly/${quarterKey}`, {
      waitUntil: 'load',
    });
    await harness.loginAs('agent@example.com');

    await harness.waitForRequestCount('GET /reports/by-key/:id', reportReadsBefore + 1);
    await harness.waitForRequestCount(
      'GET /reports/site/:id/quarterly-summary-seed',
      seedReadsBefore + 1,
    );

    await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '보고서 선택' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '기본' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '사업장' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '보고서 선택' }).click();
    const sourceDialog = page.getByRole('dialog', { name: '원본 보고서 선택' });
    await sourceDialog.waitFor({ state: 'visible' });
    await sourceDialog.locator('input[type="checkbox"]').first().waitFor({ state: 'visible' });
    await sourceDialog.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: '선택 반영' }).click();
    await harness.waitForRequestCount(
      'GET /reports/site/:id/quarterly-summary-seed',
      seedReadsBefore + 2,
    );

    await page.locator('input.app-input').first().fill('모바일 분기 보고서 자동화');
    await page.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);

    await page.getByRole('button', { name: '한글' }).click();
    await harness.waitForRequestCount('POST /api/documents/quarterly/hwpx', hwpxReadsBefore + 1);

    await page.getByRole('button', { name: 'PDF' }).click();
    await harness.waitForRequestCount('POST /api/documents/quarterly/pdf', pdfReadsBefore + 1);

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
