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
    await page.waitForTimeout(250);
    const settledListReads = requestCounts.get('GET /api/admin/users/list') || 0;

    const searchField = page.locator('[role="search"]').first();
    await searchField.locator('input').fill('김요원');
    await page.waitForTimeout(250);
    if ((requestCounts.get('GET /api/admin/users/list') || 0) !== settledListReads) {
      throw new Error('User search should wait for an explicit submit before refetching.');
    }
    await Promise.all([
      harness.waitForRequestCount('GET /api/admin/users/list', settledListReads + 1),
      searchField.getByRole('button').click(),
    ]);

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
