import type { Page } from 'playwright';

import { baseUrl } from '../config';
import { waitHeading } from '../helpers';

export async function runAdminReportsSection(page: Page) {
  await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });
  await waitHeading(page, '전체 보고서');
  await page.getByText('1차 기술지도 보고서').first().waitFor();
  await page.getByText('2026년 1분기 종합 보고서').first().waitFor();

  await page.getByRole('button', { name: /1차 기술지도 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '검토 체크' }).click();
  await page.getByRole('dialog').locator('select').first().selectOption('ok');
  await page.getByRole('dialog').locator('textarea').fill('클라이언트 E2E 확인 완료');
  await page.getByRole('dialog').getByRole('button', { name: '저장' }).click();
  await page.getByText('보고서 검토 상태를 저장했습니다.').first().waitFor();

  await page.getByRole('button', { name: /1차 기술지도 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '사진첩 열기' }).click();
  await page.waitForURL(/section=photos/);
  await page.getByText('보고서 컨텍스트: 1차 기술지도 보고서').first().waitFor();
  await page.getByRole('link', { name: '보고서로 돌아가기' }).click();
  await page.waitForURL(/\/sessions\//);
  await page.getByRole('link', { name: '사진첩 열기' }).first().click();
  await page.waitForURL(/\/sites\/.*\/photos/);
  await page.getByText('보고서 컨텍스트: 1차 기술지도 보고서').first().waitFor();
  await page.getByRole('link', { name: '보고서로 돌아가기' }).first().click();
  await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });

  await page.getByRole('button', { name: /2026년 1분기 종합 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '발송 상태 관리' }).click();
  const dispatchDialog = page.getByRole('dialog', { name: '보고서 발송 상태' });
  await dispatchDialog.locator('textarea').first().fill('클라이언트 E2E 발송');
  await dispatchDialog.getByRole('button', { name: '발송 완료 처리' }).click();
  await page.getByText('발송 완료 상태로 저장했습니다.').first().waitFor();
}
