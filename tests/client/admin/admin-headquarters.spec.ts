import assert from 'node:assert/strict';
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
    const headquarterDeletesBefore = requestCounts.get('DELETE /headquarters/:id') || 0;
    const seededTimestampBase = Date.UTC(2026, 11, 1, 0, 0, 0);

    for (let index = 0; index < 35; index += 1) {
      const padded = String(index).padStart(2, '0');
      const timestamp = new Date(seededTimestampBase + index * 86_400_000).toISOString();
      const headquarterId = `seed-hq-${padded}`;
      harness.state.headquarters.push({
        id: headquarterId,
        name: `Pagination HQ ${padded}`,
        management_number: `HQ-${padded}`,
        opening_number: `OPEN-${padded}`,
        business_registration_no: `123-45-${String(10000 + index)}`,
        corporate_registration_no: null,
        license_no: `LIC-${padded}`,
        contact_name: `Owner ${padded}`,
        contact_phone: `02-1000-${String(1000 + index)}`,
        address: `Seoul ${padded}`,
        memo: `seeded headquarter ${padded}`,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      });
      harness.state.sites.push({
        id: `seed-site-${padded}`,
        headquarter_id: headquarterId,
        site_name: `Seed Site ${padded}`,
        site_code: null,
        management_number: null,
        labor_office: null,
        guidance_officer_name: null,
        project_start_date: null,
        project_end_date: null,
        project_amount: null,
        project_scale: null,
        project_kind: 'seeded',
        client_management_number: null,
        client_business_name: null,
        client_representative_name: null,
        client_corporate_registration_no: null,
        client_business_registration_no: null,
        order_type_division: null,
        technical_guidance_kind: null,
        manager_name: null,
        inspector_name: null,
        contract_contact_name: null,
        manager_phone: null,
        site_contact_email: null,
        is_high_risk_site: false,
        site_address: `Seoul ${padded}`,
        contract_start_date: null,
        contract_end_date: null,
        contract_signed_date: null,
        contract_type: null,
        contract_status: null,
        total_rounds: null,
        per_visit_amount: null,
        total_contract_amount: null,
        status: 'active',
        memo: null,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    await page.goto(`${harness.baseURL}/admin?section=headquarters`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/headquarters/list', headquarterReadsBefore + 1);
    await page.getByRole('heading', { level: 2, name: '건설사 목록' }).waitFor({ state: 'visible' });

    const firstRowName = page.locator('tbody tr').first().locator('td').nth(1);
    await firstRowName.waitFor({ state: 'visible' });
    assert.equal((await firstRowName.textContent())?.trim(), 'Pagination HQ 34');

    await page.getByRole('button', { name: '다음' }).click();
    await harness.waitForRequestCount('GET /api/admin/headquarters/list', headquarterReadsBefore + 2);
    await page.waitForFunction(
      () =>
        document.querySelector('tbody tr td:nth-child(2)')?.textContent?.trim() ===
        'Pagination HQ 24',
    );
    assert.equal((await firstRowName.textContent())?.trim(), 'Pagination HQ 24');

    const exportedRows = await page.evaluate(async () => {
      const response = await fetch(
        '/api/admin/headquarters/list?limit=5000&offset=0&sort_by=created_at&sort_dir=desc',
      );
      const payload = (await response.json()) as {
        rows: Array<{ name: string; site_count?: number | null }>;
      };
      return payload.rows;
    });
    assert.equal(
      exportedRows.find((row) => row.name === 'Pagination HQ 34')?.site_count ?? null,
      1,
    );

    await page.getByRole('button', { name: '건설사 추가' }).click();
    const createDialog = page.getByRole('dialog', { name: '건설사 추가' });
    await createDialog.getByLabel('건설사명').fill('mocked headquarter');
    await createDialog.getByLabel('사업장관리번호').fill('HQ-NEW-001');
    await createDialog.getByLabel('사업개시번호').fill('OPEN-NEW-001');
    await createDialog.getByLabel('건설사 대표자명').fill('김담당');
    await createDialog.getByLabel('대표 전화').fill('02-9999-1111');
    await createDialog
      .locator('label')
      .filter({ hasText: '건설사 주소' })
      .locator('input')
      .fill('서울시 서초구 테스트로 99');
    await createDialog.getByRole('button', { name: '생성' }).click();
    await harness.waitForRequestCount('POST /headquarters', headquarterCreatesBefore + 1);
    await page.goto(`${harness.baseURL}/admin?section=headquarters`, { waitUntil: 'load' });
    await page.getByRole('heading', { level: 2, name: '건설사 목록' }).waitFor({ state: 'visible' });
    await page
      .getByPlaceholder('건설사명, 관리번호, 담당자, 등록번호, 주소로 검색')
      .fill('mocked headquarter');
    await page.getByRole('button', { name: '검색' }).click();

    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    const editDialog = page.getByRole('dialog', { name: '건설사 수정' });
    await editDialog.getByLabel('건설업면허/등록번호').fill('면허-NEW-001');
    await editDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /headquarters/:id', headquarterUpdatesBefore + 1);

    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '현장 보기' }).click();
    await harness.waitForRequestCount('GET /api/admin/sites/list', siteReadsBefore + 1);
    await page.getByRole('button', { name: '건설사 정보 수정' }).waitFor({ state: 'visible' });

    await page.goto(`${harness.baseURL}/admin?section=headquarters`, { waitUntil: 'load' });
    await page.getByRole('heading', { level: 2, name: '건설사 목록' }).waitFor({ state: 'visible' });
    await page
      .getByPlaceholder('건설사명, 관리번호, 담당자, 등록번호, 주소로 검색')
      .fill('mocked headquarter');
    await page.getByRole('button', { name: '검색' }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /mocked headquarter 작업 메뉴 열기/ }).click();
    await page.getByRole('menuitem', { name: '삭제' }).click();
    await harness.waitForRequestCount('DELETE /headquarters/:id', headquarterDeletesBefore + 1);
    await page.getByText('mocked headquarter', { exact: true }).waitFor({ state: 'hidden' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
