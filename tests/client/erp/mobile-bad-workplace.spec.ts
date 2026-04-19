import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

export async function runMobileBadWorkplaceSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-bad-workplace', config);

  try {
    const { page, requestCounts } = harness;
    const reportReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;
    const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
    const hwpxReadsBefore = requestCounts.get('POST /api/documents/bad-workplace/hwpx') || 0;
    const pdfReadsBefore = requestCounts.get('POST /api/documents/bad-workplace/pdf') || 0;

    await page.goto(`${harness.baseURL}/mobile/sites/site-1/bad-workplace/2026-03`, {
      waitUntil: 'load',
    });
    await harness.loginAs('agent@example.com');

    await harness.waitForRequestCount('GET /reports/by-key/:id', reportReadsBefore + 1);

    await page.getByRole('button', { name: '저장' }).waitFor({ state: 'visible' });
    await page.getByText('1. 원본 보고서 선택').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'HWPX' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'PDF' }).waitFor({ state: 'visible' });

    const sourceButton = page.getByRole('button', { name: '보고서 선택' });
    if ((await sourceButton.count()) > 0) {
      await sourceButton.click();
      const sourceDialog = page.getByRole('dialog', { name: '원본 기술지도 보고서 선택' });
      await sourceDialog.waitFor({ state: 'visible' });
      const sourceLoadButtons = sourceDialog.getByRole('button', { name: '불러오기' });
      if ((await sourceLoadButtons.count()) > 0) {
        await sourceLoadButtons.first().click();
      } else {
        await sourceDialog.getByRole('button', { name: '닫기' }).click();
      }
    }

    await page.getByRole('button', { name: '행 추가' }).click();
    await page.getByLabel('해당 요원').fill('모바일 불량사업장 자동화');

    const deleteButtons = page.getByRole('button', { name: '삭제' });
    if ((await deleteButtons.count()) > 0) {
      await deleteButtons.last().click();
    }

    const reloadButton = page.getByRole('button', { name: '기본 항목 다시 불러오기' });
    if ((await reloadButton.count()) > 0) {
      await reloadButton.click();
    }
    await page.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);

    await page.getByRole('button', { name: 'HWPX' }).click();
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 2);
    await harness.waitForRequestCount(
      'POST /api/documents/bad-workplace/hwpx',
      hwpxReadsBefore + 1,
    );

    await page.getByRole('button', { name: 'PDF' }).click();
    await harness.waitForRequestCount('POST /reports/upsert', reportWritesBefore + 3);
    await harness.waitForRequestCount(
      'POST /api/documents/bad-workplace/pdf',
      pdfReadsBefore + 1,
    );

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
