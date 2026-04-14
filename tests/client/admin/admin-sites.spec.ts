import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminSitesSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-sites', config);

  try {
    const { page, requestCounts } = harness;
    const headquarterCreatesBefore = requestCounts.get('POST /headquarters') || 0;
    const headquarterUpdatesBefore = requestCounts.get('PATCH /headquarters/:id') || 0;
    const siteCreatesBefore = requestCounts.get('POST /sites') || 0;
    const siteUpdatesBefore = requestCounts.get('PATCH /sites/:id') || 0;

    await page.goto(`${harness.baseURL}/admin?section=headquarters`, {
      waitUntil: 'load',
    });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /headquarters', 1);
    await page.getByRole('heading', { level: 2, name: '사업장 목록' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '사업장 추가' }).click();
    const headquarterCreateDialog = page.getByRole('dialog', { name: '사업장 추가' });
    await headquarterCreateDialog.getByLabel('회사명').fill('mocked headquarter');
    await headquarterCreateDialog.getByLabel('사업장관리번호').fill('HQ-NEW-001');
    await headquarterCreateDialog.getByLabel('사업장개시번호').fill('OPEN-NEW-001');
    await headquarterCreateDialog.getByLabel('본사 담당자명').fill('김담당');
    await headquarterCreateDialog.getByLabel('대표 전화').fill('02-9999-1111');
    await headquarterCreateDialog.getByLabel('본사 주소').fill('서울시 서초구 테스트로 99');
    await headquarterCreateDialog.getByRole('button', { name: '생성' }).click();
    await harness.waitForRequestCount('POST /headquarters', headquarterCreatesBefore + 1);

    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    const headquarterEditDialog = page.getByRole('dialog', { name: '사업장 수정' });
    await headquarterEditDialog.getByLabel('건설업면허/등록번호').fill('면허-NEW-001');
    await headquarterEditDialog.getByLabel('운영 메모').fill('사업장 등록정보 smoke 확인');
    await headquarterEditDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /headquarters/:id', headquarterUpdatesBefore + 1);

    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '현장 보기' }).click();
    await page.getByRole('button', { name: '사업장 정보 수정' }).waitFor({ state: 'visible' });
    await page.getByRole('heading', { level: 2, name: '현장 목록' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: '현장 추가' }).click();
    const siteCreateDialog = page.getByRole('dialog', { name: '현장 추가' });
    await siteCreateDialog.getByLabel('현장명').fill('mocked admin site');
    await siteCreateDialog.getByLabel('현장코드').fill('SITE-NEW-001');
    await siteCreateDialog.getByLabel('현장관리번호').fill('M-NEW-001');
    await siteCreateDialog.getByLabel('현장소장명').fill('홍소장');
    await siteCreateDialog.getByLabel('현장소장 연락처').fill('010-5555-1111');
    await siteCreateDialog.getByLabel('현장대리인/소장 메일').fill('hong.manager@example.com');
    await siteCreateDialog.getByLabel('계약유형').selectOption('private');
    await siteCreateDialog.getByLabel('계약상태').selectOption('active');
    await siteCreateDialog.getByLabel('기술지도 대가').fill('1200000');
    await siteCreateDialog.getByLabel('기술지도 횟수').fill('12');
    await siteCreateDialog.getByLabel('회차당 단가').fill('100000');
    await siteCreateDialog.getByRole('button', { name: '생성' }).click();
    await harness.waitForRequestCount('POST /sites', siteCreatesBefore + 1);

    await page.getByRole('button', { name: /mocked admin site 현장 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '현장 메인' }).click();
    await page.getByRole('link', { name: '현장 정보 수정' }).waitFor({ state: 'visible' });
    await page.getByText('연락 및 발송 기준').waitFor({ state: 'visible' });

    await page.getByRole('link', { name: '현장 정보 수정' }).click();
    const siteEditDialog = page.getByRole('dialog', { name: '현장 수정' });
    await siteEditDialog.getByLabel('현장소장 연락처').fill('010-5555-2222');
    await siteEditDialog.getByLabel('계약유형').selectOption('bid');
    await siteEditDialog.getByLabel('운영 메모').fill('현장 메인 quick edit smoke');
    await siteEditDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /sites/:id', siteUpdatesBefore + 1);

    await page.getByRole('button', { name: /mocked admin site 현장 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '지도요원 배정' }).click();
    await page.getByRole('dialog', { name: '지도요원 배정' }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
