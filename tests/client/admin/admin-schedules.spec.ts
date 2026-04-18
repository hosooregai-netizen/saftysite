import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { createAdminSmokeHarness } from '../fixtures/adminSmokeHarness';

export async function runAdminSchedulesSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createAdminSmokeHarness('admin-schedules', config);

  try {
    const { page, requestCounts } = harness;
    const calendarReadsBefore = requestCounts.get('GET /api/admin/schedules/calendar') || 0;
    const queueReadsBefore = requestCounts.get('GET /api/admin/schedules/queue') || 0;
    const lookupReadsBefore = requestCounts.get('GET /api/admin/schedules/lookups') || 0;
    const scheduleUpdatesBefore = requestCounts.get('PATCH /api/admin/schedules/:id') || 0;

    await page.goto(`${harness.baseURL}/admin?section=schedules&month=2026-04`, {
      waitUntil: 'load',
    });
    await harness.loginAs('admin@example.com');

    await harness.waitForRequestCount('GET /api/admin/schedules/calendar', calendarReadsBefore + 1);
    await harness.waitForRequestCount('GET /api/admin/schedules/queue', queueReadsBefore + 1);
    await harness.waitForRequestCount('GET /api/admin/schedules/lookups', lookupReadsBefore + 1);
    await page.getByRole('heading', { level: 2, name: '일정/캘린더' }).waitFor({ state: 'visible' });
    await page.getByRole('tab', { name: '달력으로 보기' }).waitFor({ state: 'visible' });
    await page.getByRole('tab', { name: '목록으로 보기' }).waitFor({ state: 'visible' });
    await page.getByText('2026년 4월').first().waitFor();
    await page.getByRole('button', { name: '오늘' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '[김요원] 1/9 - 기존 현장' }).waitFor({
      state: 'visible',
    });
    if ((await page.getByText('Legacy InSEF import / legacy_site_id=legacy-1 round=1').count()) !== 0) {
      throw new Error('Expected legacy placeholder selection reason to be hidden in controller schedule board.');
    }

    const scopeToggleCount = await page
      .getByRole('button', { name: /^(전체 일정|내 일정)$/ })
      .count();
    if (scopeToggleCount !== 0) {
      throw new Error(`Expected controller scope buttons to be removed, received ${scopeToggleCount}.`);
    }

    await page.getByRole('tab', { name: '목록으로 보기' }).click();
    await page.getByRole('heading', { level: 2, name: '미선택 일정 큐' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('heading', { level: 2, name: '방문 일정 목록' }).waitFor({
      state: 'visible',
    });
    await page.getByRole('tab', { name: '달력으로 보기' }).click();
    await page.getByRole('button', { name: '[김요원] 1/9 - 기존 현장' }).waitFor({
      state: 'visible',
    });

    await page.getByRole('button', { name: '[김요원] 1/9 - 기존 현장' }).click();
    const scheduleDialog = page.getByRole('dialog', { name: '방문 일정 선택' });
    await scheduleDialog.waitFor({ state: 'visible' });
    await scheduleDialog.getByText('선택 사유').waitFor();
    if ((await scheduleDialog.getByLabel('사유 분류').inputValue()) !== '') {
      throw new Error('Expected legacy placeholder reason label to be cleared in controller dialog.');
    }
    if ((await scheduleDialog.getByLabel('상세 메모').inputValue()) !== '') {
      throw new Error('Expected legacy placeholder reason memo to be cleared in controller dialog.');
    }
    if ((await scheduleDialog.getByText('예외 사유코드').count()) !== 0) {
      throw new Error('Expected exception reason code field to be removed from controller schedule dialog.');
    }
    if ((await scheduleDialog.getByText('예외 메모').count()) !== 0) {
      throw new Error('Expected exception memo field to be removed from controller schedule dialog.');
    }
    await scheduleDialog.getByLabel('방문일').fill('2026-04-18');
    await scheduleDialog.getByLabel('변경 사유 기록').check();
    await scheduleDialog.getByLabel('사유 분류').fill('현장 요청');
    await scheduleDialog.getByLabel('상세 메모').fill('관제 일정 smoke 이동');
    await scheduleDialog.getByRole('button', { name: '저장' }).click();
    await harness.waitForRequestCount('PATCH /api/admin/schedules/:id', scheduleUpdatesBefore + 1);
    await page.getByRole('button', { name: '[김요원] 1/9 - 기존 현장' }).waitFor({
      state: 'visible',
    });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
