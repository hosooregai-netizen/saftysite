import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminUsersSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-users', config);

  try {
    const { page, requestCounts } = harness;
    const listReadsBefore = requestCounts.get('GET /api/admin/users/list') || 0;

    await page.goto(`${harness.baseURL}/admin?section=users`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/users/list', listReadsBefore + 1);
    await page.getByRole('heading', { level: 2, name: '사용자' }).waitFor({ state: 'visible' });
    await page.getByPlaceholder('이름, 이메일, 직책, 소속으로 검색').fill('김요원');
    await harness.waitForRequestCount('GET /api/admin/users/list', listReadsBefore + 2);
    await page.getByRole('button', { name: '사용자 추가' }).click();
    await page.getByRole('dialog', { name: '사용자 추가' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '취소' }).click();

    const menuButton = page.locator('tbody tr button[aria-haspopup="menu"]').first();
    await menuButton.click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    await page.getByRole('dialog', { name: '사용자 수정' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '취소' }).click();

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
