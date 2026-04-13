import type { Page } from 'playwright';

import { baseUrl } from '../config';
import { waitHeading } from '../helpers';

export async function runAdminSitesSection(page: Page) {
  await page.goto(`${baseUrl}/admin?section=headquarters&siteStatus=all`, {
    waitUntil: 'load',
  });
  await waitHeading(page, '현장 목록');
  await page.getByRole('button', { name: '현장 추가' }).first().waitFor();
  await page.getByPlaceholder('현장명, 사업장명, 노동관서, 지도원, 발주자명, 계약담당자, 점검자로 검색').fill('');
}
