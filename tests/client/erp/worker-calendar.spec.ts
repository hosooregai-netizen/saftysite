import type { Route } from 'playwright';
import { buildAdminScheduleRows, updateSingleSchedule } from '../../../server/admin/automation';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import type { ControllerDashboardData, SafetyAssignment, SafetyHeadquarter } from '../../../types/controller';
import type { SafetyContentItem, SafetySite, SafetyUser } from '../../../types/backend';
import type { SafetyInspectionSchedule } from '../../../types/admin';
import { clone, NOW } from '../../../tooling/internal/smokeClient_impl';
import { createErpSmokeHarness } from '../fixtures/erpSmokeHarness';

function buildWorkerDashboardData(
  harness: Awaited<ReturnType<typeof createErpSmokeHarness>>,
): ControllerDashboardData {
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

function buildEnsuredWorkerSchedule(input: {
  currentUserId: string;
  requestUserName: string;
  site: SafetySite;
  roundNo: number;
}): SafetyInspectionSchedule {
  const contractWindowStart = String(
    input.site.contract_start_date || input.site.contract_date || '',
  );
  const contractWindowEnd = String(
    input.site.contract_end_date || input.site.project_end_date || contractWindowStart,
  );
  return {
    actualVisitDate: '',
    assigneeName: input.requestUserName,
    assigneeUserId: input.currentUserId,
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: String(input.site.headquarter_id || ''),
    headquarterName: String(
      (input.site as { headquarter?: { name?: string } | null }).headquarter?.name ||
        (input.site as { headquarter_detail?: { name?: string } | null }).headquarter_detail?.name ||
        '',
    ),
    id: `schedule:${input.site.id}:${input.roundNo}`,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: '',
    plannedDate: '',
    roundNo: input.roundNo,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: String(input.site.id || ''),
    siteName: String(input.site.site_name || ''),
    status: 'planned',
    totalRounds: Number(input.site.total_rounds || 8),
    windowEnd: contractWindowEnd,
    windowStart: contractWindowStart,
  };
}

export async function runWorkerCalendarSmoke(config: ClientSmokePlaywrightConfig) {
  const harness = await createErpSmokeHarness('worker-calendar', config);

  try {
    const { context, page, requestCounts } = harness;
    const scheduleReadsBefore = requestCounts.get('GET /api/me/schedules') || 0;
    const scheduleUpdatesBefore = requestCounts.get('PATCH /api/me/schedules/:id') || 0;
    const ensuredSchedulesById = new Map<string, SafetyInspectionSchedule>();

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

        const serverEnsuredRows = assignedSites
          .flatMap((site) => {
            const assignedSiteId = String((site as SafetySite & { id?: unknown }).id || '');
            if (siteId && assignedSiteId !== siteId) return [];
            return [7, 8]
              .filter((roundNo) => !baseRows.some((row) => row.siteId === assignedSiteId && row.roundNo === roundNo))
              .map((roundNo) => {
                const scheduleId = `schedule:${assignedSiteId}:${roundNo}`;
                return (
                  ensuredSchedulesById.get(scheduleId) ??
                  buildEnsuredWorkerSchedule({
                    currentUserId,
                    requestUserName: String(requestUser.name || ''),
                    roundNo,
                    site: site as SafetySite,
                  })
                );
              });
          });
        serverEnsuredRows.forEach((row) => {
          ensuredSchedulesById.set(row.id, row);
        });

        const filteredRows = [...baseRows, ...serverEnsuredRows].sort(
          (left, right) =>
            (left.plannedDate ? 1 : 0) - (right.plannedDate ? 1 : 0) ||
            (left.plannedDate || left.windowStart || left.windowEnd || '').localeCompare(
              right.plannedDate || right.windowStart || right.windowEnd || '',
            ) ||
            left.roundNo - right.roundNo ||
            left.siteName.localeCompare(right.siteName, 'ko'),
        );

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
        const ensuredSchedule = ensuredSchedulesById.get(scheduleId) ?? null;
        if (ensuredSchedule) {
          const updated: SafetyInspectionSchedule = {
            ...ensuredSchedule,
            actualVisitDate: String(payload.actual_visit_date || ensuredSchedule.actualVisitDate || ''),
            linkedReportKey: String(payload.linked_report_key || ensuredSchedule.linkedReportKey || ''),
            plannedDate: String(payload.planned_date || ensuredSchedule.plannedDate || ''),
            selectionConfirmedAt: NOW,
            selectionConfirmedByName: String(requestUser.name || ''),
            selectionConfirmedByUserId: String(requestUser.id || ''),
            selectionReasonLabel: String(payload.selection_reason_label || ''),
            selectionReasonMemo: String(payload.selection_reason_memo || ''),
          };
          ensuredSchedulesById.set(scheduleId, updated);
          await fulfillJson(route, clone(updated));
          return;
        }

        const data = buildWorkerDashboardData(harness);
        const { memo, schedule, site } = updateSingleSchedule(
          data,
          scheduleId,
          {
            actualVisitDate: String(payload.actual_visit_date || ''),
            linkedReportKey: String(payload.linked_report_key || ''),
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
      }

      await route.fallback();
    });

    await page.goto(`${harness.baseURL}/calendar`, { waitUntil: 'load' });
    await harness.loginAs('agent@example.com');
    await harness.waitForRequestCount('GET /api/me/schedules', scheduleReadsBefore + 1);

    await page.locator('input[type="month"]').waitFor({ state: 'visible' });
    await page
      .evaluate(async () => {
        const token = window.localStorage.getItem('safety-api-access-token');
        if (!token) {
          throw new Error('Missing worker auth token in localStorage.');
        }
        const response = await fetch('/api/me/schedules/schedule%3Asite-1%3A8', {
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
      });

    await harness.waitForRequestCount('PATCH /api/me/schedules/:id', scheduleUpdatesBefore + 1);
    await page.reload({ waitUntil: 'load' });
    await harness.waitForRequestCount('GET /api/me/schedules', scheduleReadsBefore + 2);
    await page.evaluate(async () => {
      const token = window.localStorage.getItem('safety-api-access-token');
      if (!token) {
        throw new Error('Missing worker auth token in localStorage.');
      }
      const response = await fetch('/api/safety/reports?site_id=site-1&limit=50', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Worker reports GET failed with ${response.status}.`);
      }
      await response.json();
    });

    await page.locator('[role="tab"]').nth(1).click();
    await page.locator('table').waitFor({ state: 'visible' });
    await page.getByText('2026-04-08').first().waitFor({ state: 'visible' });

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
