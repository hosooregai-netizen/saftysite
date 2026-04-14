import type { Page } from 'playwright';

import { baseUrl } from '../config';
import { waitHeading } from '../helpers';

export async function runAdminSitesSection(page: Page) {
  await page.goto(`${baseUrl}/admin?section=headquarters`, {
    waitUntil: 'load',
  });
  await waitHeading(page, '사업장 목록');
  await page.getByRole('button', { name: '사업장 추가' }).first().waitFor();
  await page
    .getByPlaceholder('회사명, 관리번호, 담당자, 등록번호, 주소로 검색')
    .fill('');

  await page.getByRole('button', { name: /작업 메뉴 열기/ }).first().click();
  await page.getByRole('menuitem', { name: '현장 보기' }).click();
  await waitHeading(page, '현장 목록');

  await page
    .getByPlaceholder('현장명, 코드, 사업장명, 현장소장, 계약유형, 발주자명으로 검색')
    .fill('');
  await page.getByRole('button', { name: /현장 작업 메뉴 열기/ }).first().click();
  await page.getByRole('menuitem', { name: '수정' }).click();
  const editDialog = page.getByRole('dialog', { name: '현장 수정' });
  await editDialog.getByLabel('계약유형').waitFor();
  await editDialog.getByLabel('현장소장 연락처').waitFor();
  await editDialog.getByLabel('운영 메모').waitFor();
  await page.getByRole('button', { name: '취소' }).click();

  await page.getByRole('button', { name: /현장 작업 메뉴 열기/ }).first().click();
  await page.getByRole('menuitem', { name: '현장 메인' }).click();
  await page.getByRole('link', { name: '현장 정보 수정' }).waitFor();
  await page.getByText('연락 및 발송 기준').waitFor();
}
