import type { Page } from 'playwright';

import { baseUrl } from '../config';
import { dismissImportantModalIfPresent, waitHeading } from '../helpers';

export async function runAdminControlCenterSection(page: Page) {
  await page.goto(`${baseUrl}/admin?section=overview`, { waitUntil: 'load' });
  await waitHeading(page, '관제 대시보드');
  await page.getByText('현장 상태').first().waitFor();
  await page.getByText('발송 관리 대상').first().waitFor();
  await page.getByRole('button', { name: '엑셀 내보내기' }).waitFor();
  await dismissImportantModalIfPresent(page);
  await page.waitForTimeout(2_000);
  await dismissImportantModalIfPresent(page);
  await page.locator('button[aria-label^="알림 열기"]').first().click();
  await page.getByText('중요 알림').first().waitFor();
  await dismissImportantModalIfPresent(page);

  await page.goto(`${baseUrl}/admin?section=analytics`, { waitUntil: 'load' });
  await page.getByText('매출/실적 집계').first().waitFor();
  await page.getByText('계약 예정 매출').first().waitFor();
  await page.getByText('월별 매출 추이').first().waitFor();
  await page.getByText('직원별 매출 기여도 Top 10').first().waitFor();
  await page.getByText('현장별 매출 상위 Top 10').first().waitFor();
  await page.getByText('상세 표').first().waitFor();
  await page.getByRole('button', { name: '엑셀 내보내기' }).waitFor();
  await page.getByRole('button', { name: '필터' }).click();
  await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes('/api/admin/dashboard/analytics') && response.ok();
    }),
    page.locator('#analytics-filter-period').selectOption('year'),
  ]);
}
