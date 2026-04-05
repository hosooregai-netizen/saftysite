import type { Page } from 'playwright';

import {
  baseUrl,
  k2bHeadquarterName,
  k2bManagementNumber,
  k2bSiteName,
  k2bWorkbookBuffer,
} from './config';
import { dismissImportantModalIfPresent, waitHeading } from './helpers';

export async function runAdminFlow(page: Page) {
  await page.goto(`${baseUrl}/admin?section=overview`, { waitUntil: 'load' });
  await waitHeading(page, '관제 대시보드');
  await page.getByText('전체 현장 수').first().waitFor();
  await page.getByText('분기 보고 발송 지연').first().waitFor();
  await dismissImportantModalIfPresent(page);
  await page.waitForTimeout(2_000);
  await dismissImportantModalIfPresent(page);
  await page.locator('button[aria-label^="알림 열기"]').first().click();
  await page.getByText('중요 알림').first().waitFor();
  await dismissImportantModalIfPresent(page);

  await page.goto(`${baseUrl}/admin?section=analytics`, { waitUntil: 'load' });
  await page.getByText('실적/매출 요약').first().waitFor();
  await page.getByText('직원별 회차 매출').first().waitFor();
  await page.getByText('현장별 매출').first().waitFor();
  await page.getByText('계약유형별 계약금액').first().waitFor();
  await page.getByText('운영 지표 시각화').first().waitFor();
  await page.getByText('직원별 실적/매출').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=mailbox`, { waitUntil: 'load' });
  await waitHeading(page, '메일함');
  await page.getByRole('button', { name: '연결 계정' }).click();
  await page.getByRole('button', { name: /구글 로그인으로 연결/ }).first().waitFor();
  await page.getByRole('button', { name: /네이버 로그인으로 연결/ }).first().waitFor();
  await page.getByRole('button', { name: '상태 새로고침' }).click();
  await page.getByText('메일 계정과 공급자 상태를 새로고침했습니다.').first().waitFor();

  await page.goto(`${baseUrl}/admin?section=k2b`, { waitUntil: 'load' });
  let k2bDialog = page.getByRole('dialog', { name: '업로드' });
  await k2bDialog.waitFor();
  await k2bDialog.getByRole('button', { name: '닫기' }).click();
  await k2bDialog.waitFor({ state: 'hidden' });
  await page.waitForURL(/section=headquarters/);
  await waitHeading(page, '사업장 목록');
  await page.getByRole('button', { name: '업로드' }).first().click();
  k2bDialog = page.getByRole('dialog', { name: '업로드' });
  await k2bDialog.waitFor();
  await k2bDialog.locator('input[type="file"]').first().setInputFiles({
    buffer: k2bWorkbookBuffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    name: 'k2b-smoke.xlsx',
  });
  await k2bDialog.getByText('엑셀 미리보기').first().waitFor();
  await k2bDialog.getByRole('button', { name: '업데이트' }).click();
  await k2bDialog.getByText('반영이 완료되었습니다.').first().waitFor({ timeout: 30_000 });
  await k2bDialog.getByRole('button', { name: '닫기' }).click();

  await page.goto(`${baseUrl}/admin?section=headquarters`, { waitUntil: 'load' });
  await page.getByPlaceholder('사업장명, 연락처, 주소로 검색').fill(k2bHeadquarterName);
  await page.locator('tbody tr', { hasText: k2bHeadquarterName }).first().click();
  await page.getByText('현장 목록').first().waitFor();
  await page.getByPlaceholder('현장명, 사업장명, 책임자, 배정 요원으로 검색').fill(k2bManagementNumber);
  await page.getByText(k2bSiteName).first().waitFor({ timeout: 30_000 });
  await page.getByText('보완 필요').first().waitFor({ timeout: 30_000 });

  await page.goto(`${baseUrl}/admin?section=reports`, { waitUntil: 'load' });
  await waitHeading(page, '전체 보고서');
  await page.getByRole('button', { name: '업로드' }).first().click();
  k2bDialog = page.getByRole('dialog', { name: '업로드' });
  await k2bDialog.waitFor();
  await k2bDialog.getByRole('button', { name: '닫기' }).click();
  await page.getByText('1차 기술지도 보고서').first().waitFor();
  await page.getByText('2026년 1분기 종합 보고서').first().waitFor();

  await page.getByRole('button', { name: /1차 기술지도 보고서 메뉴 열기/ }).click();
  await page.getByRole('menuitem', { name: '품질 체크' }).click();
  await page.getByRole('dialog').locator('select').first().selectOption('ok');
  await page.getByRole('dialog').locator('textarea').fill('클라이언트 E2E 확인 완료');
  await page.getByRole('dialog').getByRole('button', { name: '저장' }).click();
  await page.getByText('보고서 품질 체크를 저장했습니다.').first().waitFor();

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
  await page.getByRole('menuitem', { name: '발송이력 보기' }).click();
  const dispatchDialog = page.getByRole('dialog');
  await dispatchDialog.locator('textarea').first().fill('클라이언트 E2E 발송');
  await dispatchDialog.getByRole('button', { name: /(저장|추가|발송완료)/ }).first().click();

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
