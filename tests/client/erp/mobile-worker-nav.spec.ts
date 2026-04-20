import type { Route } from 'playwright';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

export async function runMobileWorkerNavSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('mobile-worker-nav', config);

  try {
    const { context, page, requestCounts } = harness;
    const scheduleReadsBefore = requestCounts.get('GET /api/me/schedules') || 0;

    await context.route(/\/api\/me\/schedules(?:\?.*)?$/, async (route) => {
      requestCounts.set(
        'GET /api/me/schedules',
        (requestCounts.get('GET /api/me/schedules') || 0) + 1,
      );
      await fulfillJson(route, {
        limit: 200,
        month: '2026-04',
        offset: 0,
        total: 1,
        rows: [
          {
            actualVisitDate: '',
            assigneeName: '조식',
            assigneeUserId: 'user-agent',
            exceptionMemo: '',
            exceptionReasonCode: '',
            headquarterId: 'hq-1',
            headquarterName: '목양건설',
            id: 'schedule-1',
            isConflicted: false,
            isOutOfWindow: false,
            isOverdue: false,
            linkedReportKey: '',
            plannedDate: '2026-04-08',
            roundNo: 1,
            selectionConfirmedAt: '',
            selectionConfirmedByName: '',
            selectionConfirmedByUserId: '',
            selectionReasonLabel: '',
            selectionReasonMemo: '',
            siteId: 'site-1',
            siteName: '기존 현장',
            status: 'planned',
            totalRounds: 8,
            windowEnd: '2026-04-28',
            windowStart: '2026-04-01',
          },
        ],
      });
    });

    await page.goto(`${harness.baseURL}/mobile`, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await page.getByRole('heading', { name: '배정 현장' }).waitFor({ state: 'visible' });

    await page.getByRole('link', { name: '일정' }).click();
    await page.waitForURL(/\/mobile\/calendar$/);
    await harness.waitForRequestCount('GET /api/me/schedules', scheduleReadsBefore + 1);
    await page.getByRole('heading', { name: '일정', exact: true }).waitFor({ state: 'visible' });

    await page.getByRole('link', { name: '메일함' }).click();
    await page.waitForURL(/\/mobile\/mailbox(?:\?.*)?$/);
    await page.getByRole('heading', { name: '메일함', exact: true }).waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
