import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveClientSmokePlaywrightConfig } from '../playwright.config';
import { createAdminSmokeHarness } from '../tests/client/fixtures/adminSmokeHarness';
import { createErpSmokeHarness } from '../tests/client/fixtures/erpSmokeHarness';
import { adminScreens, workerCalendarRows } from './clientScreenFixtures';

const OUTPUT_DIR = path.join(process.cwd(), '.artifacts', 'client-screens');

async function ensureDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function captureAdminScreens() {
  const config = resolveClientSmokePlaywrightConfig({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100',
    headless: true,
    viewport: { width: 1600, height: 1100 },
  });
  const harness = await createAdminSmokeHarness('admin-control-center', config);

  try {
    const { page } = harness;
    await page.goto(`${harness.baseURL}/admin?section=overview`, { waitUntil: 'load' });
    await harness.loginAs('admin@example.com');

    for (const screen of adminScreens) {
      await page.goto(`${harness.baseURL}${screen.path}`, { waitUntil: 'load' });
      await page.getByText(screen.readyText).first().waitFor();
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, screen.name),
        fullPage: false,
      });
    }

    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}

async function captureWorkerScreen() {
  const config = resolveClientSmokePlaywrightConfig({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100',
    headless: true,
    viewport: { width: 1440, height: 1100 },
  });
  const harness = await createErpSmokeHarness('worker-calendar', config);

  try {
    const { context, page, requestCounts } = harness;

    await context.route(/\/api\/me\/schedules(?:\/[^/?#]+)?(?:\?.*)?$/, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const requestKey =
        request.method() === 'PATCH' && /^\/api\/me\/schedules\/[^/]+$/.test(pathname)
          ? 'PATCH /api/me/schedules/:id'
          : 'GET /api/me/schedules';
      requestCounts.set(requestKey, (requestCounts.get(requestKey) || 0) + 1);

      if (request.method() === 'GET' && pathname === '/api/me/schedules') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            limit: 200,
            month: '2026-04',
            offset: 0,
            total: workerCalendarRows.length,
            rows: workerCalendarRows,
          }),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto(`${harness.baseURL}/calendar`, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await page.getByText('내 일정').first().waitFor();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06-worker-calendar.png'),
      fullPage: false,
    });

    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}

async function main() {
  await ensureDir();
  await captureAdminScreens();
  await captureWorkerScreen();
  console.log(OUTPUT_DIR);
}

void main();
