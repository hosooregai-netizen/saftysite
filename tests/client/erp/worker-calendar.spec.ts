import assert from 'node:assert/strict';
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

function buildCreatedWorkerSchedule(input: {
  currentUserId: string;
  requestUserName: string;
  site: SafetySite;
  roundNo: number;
  payload: Record<string, unknown>;
}): SafetyInspectionSchedule {
  const contractWindowStart = String(
    input.site.contract_start_date || input.site.contract_date || String(input.payload.planned_date || '').slice(0, 7) + '-01',
  );
  const contractWindowEnd = String(
    input.site.contract_end_date || input.site.project_end_date || contractWindowStart,
  );
  return {
    actualVisitDate: String(input.payload.actual_visit_date || ''),
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
    id: `created:${input.site.id}:${input.roundNo}`,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: String(input.payload.linked_report_key || ''),
    plannedDate: String(input.payload.planned_date || ''),
    roundNo: input.roundNo,
    selectionConfirmedAt: NOW,
    selectionConfirmedByName: input.requestUserName,
    selectionConfirmedByUserId: input.currentUserId,
    selectionReasonLabel: String(input.payload.selection_reason_label || ''),
    selectionReasonMemo: String(input.payload.selection_reason_memo || ''),
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
    const scheduleCreatesBefore = requestCounts.get('POST /api/me/schedules') || 0;
    const scheduleReadsBefore = requestCounts.get('GET /api/me/schedules') || 0;
    const scheduleUpdatesBefore = requestCounts.get('PATCH /api/me/schedules/:id') || 0;
    let firstEditableScheduleId = '';
    const createdSchedulesBySiteRound = new Map<string, SafetyInspectionSchedule>();
    let lastCreatedSchedulePayload: Record<string, unknown> | null = null;
    const seededReport = clone(harness.state.reports.find((report) => String(report.report_key) === 'report-tech-1'));
    if (seededReport) {
      harness.state.reports.push({
        ...seededReport,
        id: 'report-tech-7',
        report_key: 'report-tech-7',
        report_title: '7차 기술지도 보고서',
        visit_date: '2026-04-01',
        visit_round: 7,
        updated_at: NOW,
      });
    }

    await context.route(/\/api\/me\/schedules(?:\/[^/?#]+)?(?:\?.*)?$/, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const requestKey =
        request.method() === 'POST' && pathname === '/api/me/schedules'
          ? 'POST /api/me/schedules'
          : request.method() === 'PATCH' && /^\/api\/me\/schedules\/[^/]+$/.test(pathname)
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
        const primaryAssignedSiteId = String(
          (assignedSites[0] as { id?: unknown } | undefined)?.id || '',
        );
        const allAssignedRows = buildAdminScheduleRows(buildWorkerDashboardData(harness), new Date(NOW))
          .filter((row) => {
            if (!assignedSiteIds.has(row.siteId)) return false;
            if (row.assigneeUserId && row.assigneeUserId !== currentUserId) return false;
            return true;
          });
        const baseRows = allAssignedRows
          .filter((row) => {
            if (siteId && row.siteId !== siteId) return false;
            if (status && row.status !== status) return false;
            if (row.plannedDate && row.plannedDate.slice(0, 7) !== month) return false;
            if (row.siteId === primaryAssignedSiteId && row.roundNo > 6) return false;
            return true;
          });
        const rows = [...baseRows];

        createdSchedulesBySiteRound.forEach((row) => {
          if (siteId && row.siteId !== siteId) return;
          if (status && row.status !== status) return;
          if (row.plannedDate && row.plannedDate.slice(0, 7) !== month) return;
          rows.push(clone(row));
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
          allAssignedRows.find((row) => !row.plannedDate)?.id ||
          allAssignedRows[0]?.id ||
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

      if (request.method() === 'POST' && pathname === '/api/me/schedules') {
        const payload = (request.postDataJSON?.() as Record<string, unknown>) || {};
        lastCreatedSchedulePayload = payload;
        const siteId = String(payload.site_id || '');
        const roundNo = Number(payload.round_no || 0);
        const site = harness.state.sites.find((item) => String(item.id) === siteId) as
          | SafetySite
          | undefined;
        if (!site || !Number.isFinite(roundNo) || roundNo <= 0) {
          await fulfillJson(route, { error: 'Invalid worker schedule create request.' }, 400);
          return;
        }
        const created = buildCreatedWorkerSchedule({
          currentUserId: String(requestUser.id || ''),
          payload,
          requestUserName: String(requestUser.name || ''),
          roundNo: Math.trunc(roundNo),
          site,
        });
        createdSchedulesBySiteRound.set(`${siteId}:${Math.trunc(roundNo)}`, created);
        await fulfillJson(route, clone(created));
        return;
      }

      if (request.method() === 'PATCH' && /^\/api\/me\/schedules\/[^/]+$/.test(pathname)) {
        const scheduleId = decodeURIComponent(pathname.split('/').at(-1) || '');
        const payload = (request.postDataJSON?.() as Record<string, unknown>) || {};
        const createdScheduleEntry = Array.from(createdSchedulesBySiteRound.entries()).find(
          ([, row]) => row.id === scheduleId,
        );
        if (createdScheduleEntry) {
          const [key, current] = createdScheduleEntry;
          const updated: SafetyInspectionSchedule = {
            ...current,
            actualVisitDate: String(payload.actual_visit_date || current.actualVisitDate || ''),
            linkedReportKey: String(payload.linked_report_key || current.linkedReportKey || ''),
            plannedDate: String(payload.planned_date || current.plannedDate || ''),
            selectionConfirmedAt: NOW,
            selectionConfirmedByName: String(requestUser.name || ''),
            selectionConfirmedByUserId: String(requestUser.id || ''),
            selectionReasonLabel: String(payload.selection_reason_label || ''),
            selectionReasonMemo: String(payload.selection_reason_memo || ''),
          };
          createdSchedulesBySiteRound.set(key, updated);
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
    await page.locator('[role="tab"]').first().waitFor({ state: 'visible' });
    await page
      .locator('button')
      .filter({ has: page.locator('div', { hasText: /^8$/ }) })
      .first()
      .click();

    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('input[name="worker-site"]').first().setChecked(true, { force: true });
    await dialog.getByText('보고서 있음 · 일정 연결 필요').first().waitFor({ state: 'visible' });
    await dialog.getByText('계약 기간 2026-01-01 ~ 2026-06-30').first().waitFor({ state: 'visible' });
    await dialog.getByText(/^7 \/ 12회차$/).first().click();
    await dialog.locator('input[type="date"]').fill('2026-04-08');
    await dialog.locator('button').last().click();

    await harness.waitForRequestCount('POST /api/me/schedules', scheduleCreatesBefore + 1);
    assert.equal(String(lastCreatedSchedulePayload?.['linked_report_key'] || ''), 'report-tech-7');
    assert.equal(String(lastCreatedSchedulePayload?.['actual_visit_date'] || ''), '2026-04-01');
    await dialog.waitFor({ state: 'hidden' });

    await page.locator('[role="tab"]').nth(1).click();
    await page.locator('table').waitFor({ state: 'visible' });
    await page.getByText('2026-04-08').first().waitFor({ state: 'visible' });

    const patchScheduleId =
      Array.from(createdSchedulesBySiteRound.values())[0]?.id || firstEditableScheduleId;
    if (patchScheduleId) {
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
            planned_date: '2026-04-09',
            selection_reason_label: '',
            selection_reason_memo: '',
          }),
        });
        if (!response.ok) {
          throw new Error(`Worker schedule PATCH failed with ${response.status}.`);
        }
        await response.json();
      }, { scheduleId: patchScheduleId });

      await harness.waitForRequestCount('PATCH /api/me/schedules/:id', scheduleUpdatesBefore + 1);
    }

    harness.assertContractApisObserved();
    harness.assertNoClientErrors();
  } finally {
    await harness.close();
  }
}
