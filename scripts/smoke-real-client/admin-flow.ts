import type { Page } from 'playwright';

import { baseUrl } from './config';
import { waitHeading } from './helpers';
import { runAdminControlCenterSection } from './admin-sections/control-center';
import { runAdminReportsSection } from './admin-sections/reports';
import { runAdminSitesSection } from './admin-sections/sites';

export async function runAdminFlow(page: Page) {
  await runAdminControlCenterSection(page);

  await page.goto(`${baseUrl}/admin?section=mailbox`, { waitUntil: 'load' });
  await waitHeading(page, '메일함');
  await page.getByRole('button', { name: /구글 로그인으로 연결/ }).first().waitFor();
  await page.getByRole('button', { name: /네이버 로그인으로 연결/ }).first().waitFor();
  await page.getByRole('button', { name: '상태 새로고침' }).click();
  await page.getByText('메일 계정과 공급자 상태를 새로고침했습니다.').first().waitFor();

  await runAdminSitesSection(page);
  await runAdminReportsSection(page);

  await page.goto(`${baseUrl}/admin?section=schedules`, { waitUntil: 'load' });
  await page.getByText('일정/캘린더').first().waitFor();
  await page.getByText('미선택 일정 큐').first().waitFor();

  await Promise.all([
    page.waitForResponse((response) => {
      return (
        response.url().includes('/api/photos') &&
        response.url().includes('all=true') &&
        response.ok()
      );
    }),
    page.goto(`${baseUrl}/admin?section=photos`, { waitUntil: 'load' }),
  ]);
  await waitHeading(page, '사진첩');
  await page.getByText(/전체 \d+건/).first().waitFor();
  await page.getByText('현재 필터 범위의 사진을 한 번에 불러오고 아래로 내려가며 이어서 볼 수 있습니다.').first().waitFor();
  const initialPhotoCount = await page.locator('article').count();
  return { initialPhotoCount };
}
