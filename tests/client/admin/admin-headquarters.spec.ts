import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminHeadquartersSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-headquarters', config);

  try {
    const { page, requestCounts } = harness;
    const headquarterReadsBefore = requestCounts.get('GET /api/admin/headquarters/list') || 0;
    const siteReadsBefore = requestCounts.get('GET /api/admin/sites/list') || 0;
    const headquarterCreatesBefore = requestCounts.get('POST /headquarters') || 0;
    const headquarterUpdatesBefore = requestCounts.get('PATCH /headquarters/:id') || 0;

    await page.goto(`${harness.baseURL}/admin?section=headquarters`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/headquarters/list', headquarterReadsBefore + 1);
    await page.getByRole('heading', { level: 2, name: '사업장 목록' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '사업장 추가' }).click();
    const createDialog = page.getByRole('dialog', { name: '사업장 추가' });
    await createDialog.getByLabel('회사명').fill('mocked headquarter');
    await createDialog.getByLabel('사업장관리번호').fill('HQ-NEW-001');
    await createDialog.getByLabel('사업장개시번호').fill('OPEN-NEW-001');
    await createDialog.getByLabel('본사 대표자명').fill('김담당');
    await createDialog.getByLabel('대표 전화').fill('02-9999-1111');
    await createDialog
      .locator('label')
      .filter({ hasText: '본사 주소' })
      .locator('input')
      .fill('서울시 서초구 테스트로 99');
    await createDialog.getByRole('button', { name: '생성' }).click();
    await harness.waitForRequestCount('POST /headquarters', headquarterCreatesBefore + 1);

    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    const editDialog = page.getByRole('dialog', { name: '사업장 수정' });
    await editDialog.getByLabel('건설업면허/등록번호').fill('면허-NEW-001');
    await editDialog.getByLabel('운영 메모').fill('사업장 등록정보 smoke 확인');
    await editDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /headquarters/:id', headquarterUpdatesBefore + 1);

    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '현장 보기' }).click();
    await harness.waitForRequestCount('GET /api/admin/sites/list', siteReadsBefore + 1);
    await page.getByRole('button', { name: '사업장 정보 수정' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
