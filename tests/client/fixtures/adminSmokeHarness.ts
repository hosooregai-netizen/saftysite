import type { Route } from 'playwright';
import {
  buildAdminAnalyticsModel,
  buildAdminOverviewModel,
} from '../../../features/admin/lib/buildAdminControlCenterModel';
import { buildSiteMemoWithContractProfile } from '../../../lib/admin/siteContractProfile';
import { buildControllerReportRows } from '../../../lib/admin/controllerReports';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import type {
  ReportControllerReview,
  ReportDispatchMeta,
  SafetyAdminAnalyticsResponse,
  SafetyAdminOverviewResponse,
  SafetyAdminReportsResponse,
} from '../../../types/admin';
import type {
  ControllerDashboardData,
  SafetyAssignment,
  SafetyHeadquarter,
} from '../../../types/controller';
import type {
  SafetyContentItem,
  SafetyReportListItem,
  SafetySite,
  SafetyUser,
} from '../../../types/backend';
import {
  clone,
  NOW,
  toReportListItem,
} from '../../../tooling/internal/smokeClient_impl';
import { createErpSmokeHarness, type ErpSmokeHarness } from './erpSmokeHarness';

type AdminFeatureId = 'admin-control-center' | 'admin-reports' | 'admin-sites';
type JsonRecord = Record<string, unknown>;

function buildEmptyReview(): ReportControllerReview {
  return {
    checkedAt: '',
    checkerUserId: '',
    note: '',
    ownerUserId: '',
    qualityStatus: 'unchecked',
  };
}

function buildEmptyDispatch(overrides: Partial<ReportDispatchMeta> = {}): ReportDispatchMeta {
  return {
    actualRecipient: '',
    actualSentAt: '',
    deadlineDate: '',
    dispatchStatus: '',
    mailThreadId: '',
    mailboxAccountId: '',
    messageId: '',
    readAt: '',
    recipient: '',
    replyAt: '',
    replySummary: '',
    sentCompletedAt: '',
    sentHistory: [],
    ...overrides,
  };
}

function normalizeAdminApiPath(pathname: string) {
  return pathname
    .replace(/^\/api\/admin\/exports\/[^/]+$/, '/api/admin/exports/:section')
    .replace(/^\/api\/admin\/reports\/[^/]+\/review$/, '/api/admin/reports/:id/review')
    .replace(/^\/api\/admin\/reports\/[^/]+\/dispatch$/, '/api/admin/reports/:id/dispatch')
    .replace(/^\/api\/admin\/reports\/[^/]+\/dispatch-events$/, '/api/admin/reports/:id/dispatch-events');
}

function buildAdminDashboardData(harness: ErpSmokeHarness): ControllerDashboardData {
  return {
    assignments: clone(harness.helpers.hydratedAssignments()) as SafetyAssignment[],
    contentItems: clone(harness.state.contentItems) as unknown as SafetyContentItem[],
    headquarters: clone(harness.state.headquarters) as unknown as SafetyHeadquarter[],
    sites: clone(harness.helpers.hydratedSites()) as SafetySite[],
    users: clone(harness.state.users) as unknown as SafetyUser[],
  };
}

function toAdminReportListItem(report: JsonRecord): SafetyReportListItem {
  const base = toReportListItem(report) as unknown as SafetyReportListItem;
  return {
    ...base,
    dispatch: (report.dispatch ?? null) as SafetyReportListItem['dispatch'],
    report_type: (report.report_type ?? null) as SafetyReportListItem['report_type'],
    review: (report.review ?? null) as SafetyReportListItem['review'],
  };
}

function buildAdminReportRows(harness: ErpSmokeHarness) {
  return buildControllerReportRows(
    harness.state.reports.map((report) => toAdminReportListItem(report)),
    harness.helpers.hydratedSites() as SafetySite[],
    harness.state.users as unknown as SafetyUser[],
  );
}

function buildOverviewResponse(harness: ErpSmokeHarness): SafetyAdminOverviewResponse {
  return {
    alerts: [],
    completionRows: [],
    scheduleRows: [],
    ...buildAdminOverviewModel(
      buildAdminDashboardData(harness),
      harness.state.reports.map((report) => toAdminReportListItem(report)),
    ),
  };
}

function buildAnalyticsResponse(
  harness: ErpSmokeHarness,
  url: URL,
): SafetyAdminAnalyticsResponse {
  const period = url.searchParams.get('period');
  return buildAdminAnalyticsModel(
    buildAdminDashboardData(harness),
    harness.state.reports.map((report) => toAdminReportListItem(report)),
    {
      contractType: url.searchParams.get('contract_type') || '',
      headquarterId: url.searchParams.get('headquarter_id') || '',
      period:
        period === 'month' || period === 'quarter' || period === 'year' || period === 'all'
          ? period
          : 'month',
      query: url.searchParams.get('query') || '',
      userId: url.searchParams.get('user_id') || '',
    },
  );
}

function matchesQuery(row: ReturnType<typeof buildAdminReportRows>[number], query: string) {
  if (!query.trim()) return true;
  const haystack = [
    row.reportTitle,
    row.periodLabel,
    row.reportKey,
    row.siteName,
    row.headquarterName,
    row.assigneeName,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function buildReportsResponse(harness: ErpSmokeHarness, url: URL): SafetyAdminReportsResponse {
  const limit = Number(url.searchParams.get('limit') || '100');
  const offset = Number(url.searchParams.get('offset') || '0');
  const reportType = url.searchParams.get('report_type') || '';
  const siteId = url.searchParams.get('site_id') || '';
  const headquarterId = url.searchParams.get('headquarter_id') || '';
  const assigneeUserId = url.searchParams.get('assignee_user_id') || '';
  const qualityStatus = url.searchParams.get('quality_status') || '';
  const query = url.searchParams.get('query') || '';
  const filtered = buildAdminReportRows(harness).filter((row) => {
    if (reportType && row.reportType !== reportType) return false;
    if (siteId && row.siteId !== siteId) return false;
    if (headquarterId && row.headquarterId !== headquarterId) return false;
    if (assigneeUserId && row.assigneeUserId !== assigneeUserId) return false;
    if (qualityStatus && row.qualityStatus !== qualityStatus) return false;
    return matchesQuery(row, query);
  });
  return {
    limit,
    offset,
    rows: clone(filtered.slice(offset, offset + limit)),
    total: filtered.length,
  };
}

function updateReportState(
  harness: ErpSmokeHarness,
  reportKey: string,
  updater: (current: JsonRecord, meta: JsonRecord) => JsonRecord,
) {
  const reportIndex = harness.state.reports.findIndex((report) => String(report.report_key) === reportKey);
  if (reportIndex < 0) return;
  const current = harness.state.reports[reportIndex] as JsonRecord;
  const meta =
    current.meta && typeof current.meta === 'object'
      ? ({ ...(current.meta as JsonRecord) } satisfies JsonRecord)
      : {};
  harness.state.reports[reportIndex] = updater(current, meta);
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function installAdminRoutes(harness: ErpSmokeHarness) {
  await harness.context.route('**/api/messages/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === '/api/messages/providers/status' && request.method() === 'GET') {
      await fulfillJson(route, {
        rows: [
          {
            message: '알리고 정상',
            provider: 'alimtalk',
            sendEnabled: true,
          },
        ],
      });
      return;
    }

    if (pathname === '/api/messages/sms/send' && request.method() === 'POST') {
      await fulfillJson(route, {
        message: '문자를 발송했습니다.',
        provider: 'alimtalk',
        status: 'sent',
      });
      return;
    }

    await route.fallback();
  });

  await harness.context.route('**/api/admin/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const requestKey = `${request.method()} ${normalizeAdminApiPath(pathname)}`;
    harness.requestCounts.set(requestKey, (harness.requestCounts.get(requestKey) || 0) + 1);

    if (pathname === '/api/admin/dashboard/overview' && request.method() === 'GET') {
      await fulfillJson(route, buildOverviewResponse(harness));
      return;
    }

    if (pathname === '/api/admin/dashboard/analytics' && request.method() === 'GET') {
      await fulfillJson(route, buildAnalyticsResponse(harness, url));
      return;
    }

    if (pathname === '/api/admin/dashboard/analytics/refresh' && request.method() === 'POST') {
      await fulfillJson(route, { ok: true, refreshedAt: NOW });
      return;
    }

    if (/^\/api\/admin\/exports\/[^/]+$/.test(pathname) && request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: 'mock-admin-export',
      });
      return;
    }

    if (pathname === '/api/admin/reports' && request.method() === 'GET') {
      await fulfillJson(route, buildReportsResponse(harness, url));
      return;
    }

    if (/^\/api\/admin\/reports\/[^/]+\/review$/.test(pathname) && request.method() === 'PATCH') {
      const reportKey = decodeURIComponent(pathname.split('/')[4] || '');
      const review = JSON.parse(request.postData() || '{}') as JsonRecord;
      updateReportState(harness, reportKey, (current, meta) => ({
        ...current,
        review,
        meta: {
          ...meta,
          controllerReview: review,
        },
      }));
      await fulfillJson(route, { ok: true });
      return;
    }

    if (/^\/api\/admin\/reports\/[^/]+\/dispatch$/.test(pathname) && request.method() === 'PATCH') {
      const reportKey = decodeURIComponent(pathname.split('/')[4] || '');
      const dispatch = JSON.parse(request.postData() || '{}') as JsonRecord;
      updateReportState(harness, reportKey, (current, meta) => ({
        ...current,
        dispatch,
        meta: {
          ...meta,
          dispatch,
        },
      }));
      await fulfillJson(route, { ok: true });
      return;
    }

    if (/^\/api\/admin\/reports\/[^/]+\/dispatch-events$/.test(pathname) && request.method() === 'POST') {
      const reportKey = decodeURIComponent(pathname.split('/')[4] || '');
      const event = JSON.parse(request.postData() || '{}') as JsonRecord;
      updateReportState(harness, reportKey, (current, meta) => {
        const existingDispatch =
          current.dispatch && typeof current.dispatch === 'object'
            ? { ...(current.dispatch as JsonRecord) }
            : meta.dispatch && typeof meta.dispatch === 'object'
              ? { ...(meta.dispatch as JsonRecord) }
              : {};
        const sentHistory = Array.isArray(existingDispatch.sentHistory)
          ? [...existingDispatch.sentHistory, event]
          : [event];
        const nextDispatch = {
          ...existingDispatch,
          sentHistory,
        };
        return {
          ...current,
          dispatch: nextDispatch,
          updated_at: NOW,
          meta: {
            ...meta,
            dispatch: nextDispatch,
          },
        };
      });
      await fulfillJson(route, { ok: true });
      return;
    }

    await route.fallback();
  });
}

function ensureAdminFixtureSchedules(harness: ErpSmokeHarness) {
  const site = harness.state.sites.find((item) => String(item.id) === 'site-1');
  if (!site) return;
  const buildSchedule = (input: {
    id: string;
    plannedDate: string;
    roundNo: number;
    status: 'completed' | 'planned';
    windowEnd: string;
    windowStart: string;
  }) => ({
    assigneeName: '김요원',
    assigneeUserId: 'field-1',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: 'hq-1',
    headquarterName: '기존 본사',
    id: input.id,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: '',
    plannedDate: input.plannedDate,
    roundNo: input.roundNo,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: 'site-1',
    siteName: '기존 현장',
    status: input.status,
    windowEnd: input.windowEnd,
    windowStart: input.windowStart,
  });

  site.memo = buildSiteMemoWithContractProfile(
    '',
    {
      contractDate: '2026-01-02',
      contractStatus: 'active',
      contractType: 'private',
      technicalGuidanceKind: 'construction',
      totalContractAmount: 900000,
      totalRounds: 9,
    },
    {
      existingMemo: typeof site.memo === 'string' ? site.memo : '',
      schedules: [
        buildSchedule({
          id: 'schedule-site-1-round-1',
          plannedDate: '2026-01-12',
          roundNo: 1,
          status: 'completed',
          windowEnd: '2026-01-31',
          windowStart: '2026-01-01',
        }),
        buildSchedule({
          id: 'schedule-site-1-round-2',
          plannedDate: '2026-02-16',
          roundNo: 2,
          status: 'completed',
          windowEnd: '2026-02-28',
          windowStart: '2026-02-01',
        }),
        buildSchedule({
          id: 'schedule-site-1-round-3',
          plannedDate: '2026-03-10',
          roundNo: 3,
          status: 'completed',
          windowEnd: '2026-03-31',
          windowStart: '2026-03-01',
        }),
        buildSchedule({
          id: 'schedule-site-1-round-4',
          plannedDate: '2026-03-24',
          roundNo: 4,
          status: 'planned',
          windowEnd: '2026-03-31',
          windowStart: '2026-03-01',
        }),
      ],
    },
  );
}

function ensureAdminFixtureReports(harness: ErpSmokeHarness) {
  const firstTechnicalGuidance = harness.state.reports.find(
    (report) => String(report.report_key) === 'report-tech-1',
  );
  if (firstTechnicalGuidance) {
    Object.assign(firstTechnicalGuidance, {
      progress_rate: 100,
      status: 'submitted',
      workflow_status: 'submitted',
      submitted_at: NOW,
      updated_at: NOW,
      visit_date: '2026-03-10',
      visit_round: 1,
      report_type: 'technical_guidance',
    });
  }

  const technicalGuidanceFixtures = [
    {
      id: 'report-tech-2',
      report_key: 'report-tech-2',
      report_title: '2차 기술지도 보고서',
      site_id: 'site-1',
      headquarter_id: 'hq-1',
      assigned_user_id: 'field-1',
      visit_date: '2026-03-17',
      visit_round: 2,
    },
    {
      id: 'report-tech-3',
      report_key: 'report-tech-3',
      report_title: '3차 기술지도 보고서',
      site_id: 'site-1',
      headquarter_id: 'hq-1',
      assigned_user_id: 'field-1',
      visit_date: '2026-03-24',
      visit_round: 3,
    },
  ];

  technicalGuidanceFixtures.forEach((fixture) => {
    if (harness.state.reports.some((report) => String(report.report_key) === fixture.report_key)) {
      return;
    }

    const isPracticalCompletionFixture = fixture.report_key === 'report-tech-3';
    harness.state.reports.push({
      ...fixture,
      total_round: 12,
      progress_rate: isPracticalCompletionFixture ? 40 : 100,
      status: isPracticalCompletionFixture ? 'draft' : 'submitted',
      workflow_status: isPracticalCompletionFixture ? 'draft' : 'submitted',
      payload_version: 1,
      latest_revision_no: 1,
      submitted_at: isPracticalCompletionFixture ? null : NOW,
      published_at: null,
      last_autosaved_at: NOW,
      report_type: 'technical_guidance',
      review: buildEmptyReview(),
      dispatch: buildEmptyDispatch(),
      meta: {
        reportKind: 'technical_guidance',
        reportNumber: fixture.visit_round,
        siteName: '기존 현장',
      },
      created_at: NOW,
      updated_at: NOW,
      payload: {
        reportKind: 'technical_guidance',
        reportNumber: fixture.visit_round,
      },
    });
  });

  if (!harness.state.reports.some((report) => String(report.report_key) === 'quarterly-2026-q1')) {
    harness.state.reports.push({
      id: 'quarterly-2026-q1',
      report_key: 'quarterly-2026-q1',
      report_title: '2026년 1분기 종합 보고서',
      site_id: 'site-1',
      headquarter_id: 'hq-1',
      assigned_user_id: 'field-1',
      visit_date: '2026-03-29',
      visit_round: null,
      total_round: null,
      progress_rate: null,
      status: 'submitted',
      workflow_status: 'submitted',
      payload_version: 1,
      latest_revision_no: 1,
      submitted_at: NOW,
      published_at: null,
      last_autosaved_at: NOW,
      report_type: 'quarterly_report',
      review: buildEmptyReview(),
      dispatch: buildEmptyDispatch({
        deadlineDate: '2026-04-05',
        dispatchStatus: 'warning',
        recipient: 'manager@example.com',
      }),
      meta: {
        quarter: 1,
        quarterKey: '2026-Q1',
        reportKind: 'quarterly_report',
        siteName: '기존 현장',
        year: 2026,
        periodStartDate: '2026-01-01',
        periodEndDate: '2026-03-31',
      },
      created_at: NOW,
      updated_at: NOW,
      payload: {
        quarterKey: '2026-Q1',
        reportKind: 'quarterly_report',
      },
    });
  }

  if (!harness.state.reports.some((report) => String(report.report_key) === 'bad-workplace-2026-03')) {
    harness.state.reports.push({
      id: 'bad-workplace-2026-03',
      report_key: 'bad-workplace-2026-03',
      report_title: '2026년 3월 불량사업장 신고서',
      site_id: 'site-1',
      headquarter_id: 'hq-1',
      assigned_user_id: 'field-1',
      visit_date: '2026-03-24',
      visit_round: null,
      total_round: null,
      progress_rate: null,
      status: 'submitted',
      workflow_status: 'submitted',
      payload_version: 1,
      latest_revision_no: 1,
      submitted_at: NOW,
      published_at: null,
      last_autosaved_at: NOW,
      report_type: 'bad_workplace',
      review: buildEmptyReview(),
      dispatch: buildEmptyDispatch(),
      meta: {
        reportKind: 'bad_workplace',
        reportMonth: '2026-03',
        siteName: '기존 현장',
      },
      created_at: NOW,
      updated_at: NOW,
      payload: {
        reportKind: 'bad_workplace',
        reportMonth: '2026-03',
      },
    });
  }
}

export async function createAdminSmokeHarness(
  featureId: AdminFeatureId,
  config: ClientSmokePlaywrightConfig,
) {
  const harness = await createErpSmokeHarness(featureId, config);
  ensureAdminFixtureSchedules(harness);
  ensureAdminFixtureReports(harness);
  await installAdminRoutes(harness);
  return harness;
}
