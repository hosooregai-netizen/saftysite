import type { Page } from 'playwright';

import { baseUrl } from '../config';
import { waitHeading } from '../helpers';

async function assertSiteTableHeaders(page: Page) {
  await page.locator('table thead th').first().waitFor({ state: 'visible' });
  const columnCount = await page.locator('table thead th').count();
  if (columnCount !== 8) {
    throw new Error(`Expected 8 site table columns, received ${columnCount}.`);
  }
}

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
  await assertSiteTableHeaders(page);

  const headquarterBackLabelCount = await page.getByText('사업장 목록', { exact: true }).count();
  if (headquarterBackLabelCount !== 1) {
    throw new Error(
      `Expected a single shell back label for the headquarter drilldown, received ${headquarterBackLabelCount}.`,
    );
  }

  await page
    .getByPlaceholder('현장명, 사업장 관리번호, 공사 종류, 주소로 검색')
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
  await page.getByText('사업장/현장 식별').waitFor();
  const siteBackLabelCount = await page.getByText('현장 목록', { exact: true }).count();
  if (siteBackLabelCount !== 1) {
    throw new Error(
      `Expected a single shell back label for the site main view, received ${siteBackLabelCount}.`,
    );
  }
}
