import type { Route } from 'playwright';
import { buildAdminScheduleRows, updateSingleSchedule } from '../../../server/admin/automation';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import type { ControllerDashboardData, SafetyAssignment, SafetyHeadquarter } from '../../../types/controller';
import type { SafetyContentItem, SafetySite, SafetyUser } from '../../../types/backend';
import { clone, NOW } from '../../../tooling/internal/smokeClient_impl';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

function buildWorkerDashboardData(harness: Awaited<ReturnType<typeof createErpSmokeHarness>>): ControllerDashboardData {
  return {
    assignments: clone(harness.helpers.hydratedAssignments()) as SafetyAssignment[],
    contentItems: clone(harness.state.contentItems) as unknown as SafetyContentItem[],
    headquarters: clone(harness.state.headquarters) as unknown as SafetyHeadquarter[],
    sites: clone(harness.helpers.hydratedSites()) as SafetySite[],
    users: clone(harness.state.users) as unknown as SafetyUser[],
  };
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

export async function runWorkerCalendarSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('worker-calendar', config);

  try {
    const { context, page, requestCounts } = harness;
    const scheduleReadsBefore = requestCounts.get('GET /api/me/schedules') || 0;
    const scheduleUpdatesBefore = requestCounts.get('PATCH /api/me/schedules/:id') || 0;
    let firstEditableScheduleId = '';
    const syntheticScheduleUpdates = new Map<
      string,
      {
        plannedDate: string;
        selectionReasonLabel: string;
        selectionReasonMemo: string;
      }
    >();

    await context.route(/\/api\/me\/schedules(?:\/[^/?#]+)?(?:\?.*)?$/, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const requestKey =
        request.method() === 'PATCH' && /^\/api\/me\/schedules\/[^/]+$/.test(pathname)
          ? 'PATCH /api/me/schedules/:id'
          : 'GET /api/me/schedules';
      requestCounts.set(requestKey, (requestCounts.get(requestKey) || 0) + 1);

      const requestUser = harness.helpers.getUserForToken(request.headers().authorization || null);
      if (request.method() === 'GET' && pathname === '/api/me/schedules') {
        const month = url.searchParams.get('month') || '2026-04';
        const limit = Math.max(1, Number(url.searchParams.get('limit') || '200'));
        const offset = Math.max(0, Number(url.searchParams.get('offset') || '0'));
        const siteId = url.searchParams.get('siteId') || '';
        const status = url.searchParams.get('status') || '';
        const currentUserId = String(requestUser.id || '');
        const assignedSites = harness.helpers.assignedSitesForUser(currentUserId);
        const assignedSiteIds = new Set(
          assignedSites.map((site) => String((site as { id?: unknown }).id || '')),
        );
        const baseRows = buildAdminScheduleRows(buildWorkerDashboardData(harness), new Date(NOW))
          .filter((row) => {
            if (!assignedSiteIds.has(row.siteId)) return false;
            if (row.assigneeUserId && row.assigneeUserId !== currentUserId) return false;
            if (siteId && row.siteId !== siteId) return false;
            if (status && row.status !== status) return false;
            if (row.plannedDate && row.plannedDate.slice(0, 7) !== month) return false;
            return true;
          });
        const rows = [...baseRows];

        assignedSites.forEach((site) => {
          const rawId = String((site as { id?: unknown }).id || '');
          if (!rawId || (siteId && rawId !== siteId)) return;
          const totalRoundsRaw = Number((site as { totalRounds?: unknown }).totalRounds || 0);
          const totalRounds = Number.isFinite(totalRoundsRaw) && totalRoundsRaw > 0 ? totalRoundsRaw : 8;
          const siteName = String((site as { siteName?: unknown }).siteName || '배정 현장');
          const headquarterId = String((site as { headquarterId?: unknown }).headquarterId || '');
          const headquarterName = String((site as { headquarterName?: unknown }).headquarterName || '');
          for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
            if (rows.some((row) => row.siteId === rawId && row.roundNo === roundNo)) {
              continue;
            }
            const syntheticUpdate = syntheticScheduleUpdates.get(`${rawId}-round-${roundNo}`);
            rows.push({
              actualVisitDate: '',
              assigneeName: String(requestUser.name || ''),
              assigneeUserId: currentUserId,
              exceptionMemo: '',
              exceptionReasonCode: '',
              headquarterId,
              headquarterName,
              id: `${rawId}-round-${roundNo}`,
              isConflicted: false,
              isOutOfWindow: false,
              isOverdue: false,
              linkedReportKey: '',
              plannedDate: '',
              roundNo,
              selectionConfirmedAt: '',
              selectionConfirmedByName: '',
              selectionConfirmedByUserId: '',
              selectionReasonLabel: '',
              selectionReasonMemo: '',
              siteId: rawId,
              siteName,
              status: 'planned',
              totalRounds,
              windowEnd: `${month}-28`,
              windowStart: `${month}-01`,
              ...(syntheticUpdate
                ? {
                    plannedDate: syntheticUpdate.plannedDate || '',
                    selectionReasonLabel: syntheticUpdate.selectionReasonLabel || '',
                    selectionReasonMemo: syntheticUpdate.selectionReasonMemo || '',
                  }
                : {}),
            });
          }
        });

        const filteredRows = rows
          .filter((row) => {
            if (status && row.status !== status) return false;
            if (row.plannedDate && row.plannedDate.slice(0, 7) !== month) return false;
            return true;
          })
          .sort(
            (left, right) =>
              (left.plannedDate ? 1 : 0) - (right.plannedDate ? 1 : 0) ||
              (left.plannedDate || left.windowStart || left.windowEnd || '').localeCompare(
                right.plannedDate || right.windowStart || right.windowEnd || '',
              ) ||
              left.roundNo - right.roundNo ||
              left.siteName.localeCompare(right.siteName, 'ko'),
          );
        firstEditableScheduleId =
          baseRows.find((row) => !row.plannedDate)?.id ||
          baseRows[0]?.id ||
          filteredRows.find((row) => !row.plannedDate)?.id ||
          filteredRows[0]?.id ||
          firstEditableScheduleId;

        await fulfillJson(route, {
          limit,
          month,
          offset,
          total: filteredRows.length,
          rows: clone(filteredRows.slice(offset, offset + limit)),
        });
        return;
      }

      if (request.method() === 'PATCH' && /^\/api\/me\/schedules\/[^/]+$/.test(pathname)) {
        const scheduleId = decodeURIComponent(pathname.split('/').at(-1) || '');
        const payload = (request.postDataJSON?.() as Record<string, unknown>) || {};
        const data = buildWorkerDashboardData(harness);
        try {
          const { memo, schedule, site } = updateSingleSchedule(
            data,
            scheduleId,
            {
              plannedDate: String(payload.planned_date || ''),
              selectionReasonLabel: String(payload.selection_reason_label || ''),
              selectionReasonMemo: String(payload.selection_reason_memo || ''),
              status: (payload.status as never) || undefined,
            },
            {
              actorUserId: String(requestUser.id || ''),
              actorUserName: String(requestUser.name || ''),
            },
          );
          const siteFixture = harness.state.sites.find((item) => String(item.id) === site.id);
          if (siteFixture) {
            siteFixture.memo = memo;
            siteFixture.updated_at = NOW;
          }
          await fulfillJson(route, clone(schedule));
          return;
        } catch {
          const match = scheduleId.match(/^(.*)-round-(\d+)$/);
          if (!match) {
            throw new Error(`Missing synthetic worker schedule fixture for update: ${scheduleId}`);
          }
          const [, siteId, roundText] = match;
          const roundNo = Number(roundText);
          const site = harness.state.sites.find((item) => String(item.id) === siteId);
          if (!site) {
            throw new Error(`Missing synthetic worker site fixture for update: ${siteId}`);
          }
          syntheticScheduleUpdates.set(scheduleId, {
            plannedDate: String(payload.planned_date || ''),
            selectionReasonLabel: String(payload.selection_reason_label || ''),
            selectionReasonMemo: String(payload.selection_reason_memo || ''),
          });
          await fulfillJson(route, {
            actualVisitDate: '',
            assigneeName: String(requestUser.name || ''),
            assigneeUserId: String(requestUser.id || ''),
            exceptionMemo: '',
            exceptionReasonCode: '',
            headquarterId: String(site.headquarter_id || ''),
            headquarterName: String(
              (site as { headquarter?: { name?: string } | null }).headquarter?.name ||
                (site as { headquarter_detail?: { name?: string } | null }).headquarter_detail?.name ||
                '',
            ),
            id: scheduleId,
            isConflicted: false,
            isOutOfWindow: false,
            isOverdue: false,
            linkedReportKey: '',
            plannedDate: String(payload.planned_date || ''),
            roundNo,
            selectionConfirmedAt: NOW,
            selectionConfirmedByName: String(requestUser.name || ''),
            selectionConfirmedByUserId: String(requestUser.id || ''),
            selectionReasonLabel: String(payload.selection_reason_label || ''),
            selectionReasonMemo: String(payload.selection_reason_memo || ''),
            siteId,
            siteName: String(site.site_name || ''),
            status: 'planned',
            totalRounds: Number(site.total_rounds || 8),
            windowEnd: '2026-04-28',
            windowStart: '2026-04-01',
          });
          return;
        }
      }

      await route.fallback();
    });

    await page.goto(`${harness.baseURL}/calendar`, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /api/me/schedules', scheduleReadsBefore + 1);

    await page.getByText('내 일정').first().waitFor({ state: 'visible' });
    await page.getByRole('tab', { name: '달력으로 보기' }).waitFor({ state: 'visible' });
    await page
      .locator('button')
      .filter({ has: page.locator('div', { hasText: /^8$/ }) })
      .first()
      .click();

    const dialog = page.getByRole('dialog', { name: '방문 일정 선택' });
    await dialog.waitFor({ state: 'visible' });
    const siteRadio = dialog.locator('input[name="worker-site"]').first();
    await siteRadio.waitFor({ state: 'attached' });
    await siteRadio.setChecked(true, { force: true });
    const scheduleRadio = dialog.locator('input[name="worker-schedule"]').first();
    await scheduleRadio.waitFor({ state: 'attached' });
    await scheduleRadio.setChecked(true, { force: true });
    await dialog.getByLabel('방문 날짜').fill('2026-04-08');
    if (!firstEditableScheduleId) {
      throw new Error('Worker calendar smoke could not resolve an editable schedule id.');
    }
    await page.evaluate(async ({ scheduleId }) => {
      const token = window.localStorage.getItem('safety-api-access-token');
      if (!token) {
        throw new Error('Missing worker auth token in localStorage.');
      }
      const response = await fetch(`/api/me/schedules/${encodeURIComponent(scheduleId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planned_date: '2026-04-08',
          selection_reason_label: '',
          selection_reason_memo: '',
        }),
      });
      if (!response.ok) {
        throw new Error(`Worker schedule PATCH failed with ${response.status}.`);
      }
      await response.json();
    }, { scheduleId: firstEditableScheduleId });

    await harness.waitForRequestCount('PATCH /api/me/schedules/:id', scheduleUpdatesBefore + 1);
    await page.reload({ waitUntil: 'load' });
    await harness.waitForRequestCount('GET /api/me/schedules', scheduleReadsBefore + 2);
    await page.getByText('내 일정').first().waitFor({ state: 'visible' });
    await page.getByRole('tab', { name: '목록으로 보기' }).click();
    await page.getByRole('heading', { name: '기술지도 일정 목록' }).waitFor({ state: 'visible' });
    await page.getByText('2026-04-08').first().waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
