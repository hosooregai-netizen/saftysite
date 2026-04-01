/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createInspectionSession, createInspectionSite } from '../constants/inspectionSession/sessionFactory';
import { buildInitialBadWorkplaceReport } from '../lib/erpReports/badWorkplace';
import { buildInitialQuarterlySummaryReport } from '../lib/erpReports/quarterly';
import {
  BAD_WORKPLACE_REPORT_KIND,
  getQuarterTargetsForConstructionPeriod,
  QUARTERLY_SUMMARY_REPORT_KIND,
  TECHNICAL_GUIDANCE_REPORT_KIND,
} from '../lib/erpReports/shared';

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3100';
const NOW = '2026-03-29T18:00:00+09:00';

type JsonRecord = Record<string, unknown>;

interface RouteState {
  users: JsonRecord[];
  headquarters: JsonRecord[];
  sites: JsonRecord[];
  assignments: JsonRecord[];
  contentItems: JsonRecord[];
  reports: JsonRecord[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSafetyPath(pathname: string): string {
  return pathname
    .replace(/\/users\/[^/]+\/password$/, '/users/:id/password')
    .replace(/\/users\/[^/]+$/, '/users/:id')
    .replace(/\/headquarters\/[^/]+$/, '/headquarters/:id')
    .replace(/\/sites\/[^/]+$/, '/sites/:id')
    .replace(/\/assignments\/me\/sites$/, '/assignments/me/sites')
    .replace(/\/assignments\/[^/]+$/, '/assignments/:id')
    .replace(/\/content-items\/assets\/upload$/, '/content-items/assets/upload')
    .replace(/\/content-items\/[^/]+$/, '/content-items/:id')
    .replace(/\/reports\/site\/[^/]+\/full$/, '/reports/site/:id/full')
    .replace(/\/reports\/by-key\/[^/]+$/, '/reports/by-key/:id');
}

function toReportListItem(report: JsonRecord) {
  return {
    id: report.id,
    report_key: report.report_key,
    report_title: report.report_title,
    site_id: report.site_id,
    headquarter_id: report.headquarter_id ?? null,
    assigned_user_id: report.assigned_user_id ?? null,
    visit_date: report.visit_date ?? null,
    visit_round: report.visit_round ?? null,
    total_round: report.total_round ?? null,
    progress_rate: report.progress_rate ?? null,
    status: report.status,
    payload_version: report.payload_version ?? 1,
    latest_revision_no: report.latest_revision_no ?? 1,
    submitted_at: report.submitted_at ?? null,
    published_at: report.published_at ?? null,
    last_autosaved_at: report.last_autosaved_at ?? null,
    meta: report.meta ?? {},
    created_at: report.created_at,
    updated_at: report.updated_at,
  };
}

function createSeedTechnicalGuidanceReport(siteId = 'site-1'): JsonRecord {
  const site = createInspectionSite({
    customerName: '기존 본사',
    siteName: '기존 현장',
    assigneeName: '김요원',
    constructionPeriod: '2026-01-01 ~ 2026-06-30',
    siteManagerName: '박소장',
    headquartersAddress: '서울시 중구 테스트로 1',
    headquartersContact: '02-111-2222',
    siteAddress: '서울시 강남구 현장로 1',
  });
  site.id = siteId;

  const session = createInspectionSession(
    {
      meta: {
        siteName: site.siteName,
        reportDate: '2026-03-15',
        drafter: '김요원',
      },
      adminSiteSnapshot: site.adminSiteSnapshot,
      document13Cases: [],
      document14SafetyInfos: [],
    },
    site.id,
    1
  );

  session.id = 'report-tech-1';
  session.document2Overview.progressRate = '45';
  session.document2Overview.visitCount = '2';
  session.document2Overview.totalVisitCount = '6';
  session.document7Findings[0].location = '외부 비계 작업구간';
  session.document7Findings[0].emphasis = '추락 위험';
  session.document7Findings[0].improvementPlan = '안전난간 보강 및 작업 전 점검 실시';
  session.document7Findings[0].accidentType = '추락';
  session.document7Findings[0].causativeAgentKey = '4_비계_작업발판';
  session.document7Findings[0].legalReferenceTitle = '산업안전보건기준에 관한 규칙';

  return {
    id: session.id,
    report_key: session.id,
    report_title: '1차 기술지도 보고서',
    site_id: site.id,
    headquarter_id: 'hq-1',
    assigned_user_id: 'field-1',
    visit_date: session.meta.reportDate,
    visit_round: session.reportNumber,
    total_round: 6,
    progress_rate: 45,
    status: 'draft',
    payload_version: 1,
    latest_revision_no: 1,
    submitted_at: null,
    published_at: null,
    last_autosaved_at: NOW,
    meta: {
      reportKind: TECHNICAL_GUIDANCE_REPORT_KIND,
      siteName: session.meta.siteName,
      drafter: session.meta.drafter,
      reportNumber: session.reportNumber,
    },
    created_at: NOW,
    updated_at: NOW,
    payload: {
      ...clone(session),
      reportKind: TECHNICAL_GUIDANCE_REPORT_KIND,
      siteKey: site.id,
      adminSiteSnapshot: site.adminSiteSnapshot,
    },
  };
}

function getTokenForUser(userId: string): string {
  return `token-${userId}`;
}

function createInitialState(): RouteState {
  return {
    users: [
      {
        id: 'admin-1',
        email: 'admin@example.com',
        name: '관리자',
        phone: '010-1111-1111',
        role: 'admin',
        position: '총괄',
        organization_name: '한국종합안전',
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
        last_login_at: NOW,
      },
      {
        id: 'field-1',
        email: 'agent@example.com',
        name: '김요원',
        phone: '010-2222-2222',
        role: 'field_agent',
        position: '지도요원',
        organization_name: '한국종합안전',
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
        last_login_at: NOW,
      },
    ],
    headquarters: [
      {
        id: 'hq-1',
        name: '기존 본사',
        business_registration_no: '123-45-67890',
        corporate_registration_no: '110111-1234567',
        license_no: '면허-001',
        contact_name: '이담당',
        contact_phone: '02-111-2222',
        address: '서울시 중구 테스트로 1',
        memo: '',
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    sites: [
      {
        id: 'site-1',
        headquarter_id: 'hq-1',
        site_name: '기존 현장',
        site_code: 'SITE-001',
        management_number: 'M-001',
        project_start_date: '2026-01-01',
        project_end_date: '2026-06-30',
        project_amount: 100000000,
        manager_name: '박소장',
        manager_phone: '010-3333-3333',
        site_address: '서울시 강남구 현장로 1',
        status: 'active',
        memo: '',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    assignments: [
      {
        id: 'assignment-1',
        user_id: 'field-1',
        site_id: 'site-1',
        role_on_site: '담당 지도요원',
        memo: null,
        is_active: true,
        assigned_by: 'admin-1',
        assigned_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    contentItems: [
      {
        id: 'content-1',
        content_type: 'campaign_template',
        title: '기본 OPS 자료',
        code: null,
        body: {
          body: '기본 OPS 설명',
          imageUrl: '',
          imageName: '',
        },
        tags: [],
        sort_order: 0,
        effective_from: null,
        effective_to: null,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    reports: [createSeedTechnicalGuidanceReport()],
  };
}

function createRouteHelpers(state: RouteState) {
  const userSummaryById = () =>
    new Map(
      state.users.map((user) => [
        String(user.id),
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      ])
    );

  const headquarterById = () =>
    new Map(state.headquarters.map((item) => [String(item.id), item]));

  function getUserForToken(token: string | null | undefined) {
    const normalizedToken = token?.replace(/^Bearer\s+/i, '').trim();
    const userId = normalizedToken?.startsWith('token-')
      ? normalizedToken.slice('token-'.length)
      : null;
    return (
      state.users.find((user) => String(user.id) === userId) ??
      state.users[0]
    );
  }

  function hydratedAssignments() {
    const users = userSummaryById();
    const sites = new Map(
      state.sites.map((site) => [
        String(site.id),
        { id: site.id, name: site.site_name },
      ])
    );

    return state.assignments.map((assignment) => ({
      ...assignment,
      user: users.get(String(assignment.user_id)) || null,
      site: sites.get(String(assignment.site_id)) || null,
    }));
  }

  function hydratedSites() {
    const headquarters = headquarterById();
    const users = userSummaryById();

    return state.sites.map((site) => {
      const activeAssignments = state.assignments.filter(
        (assignment) =>
          assignment.site_id === site.id && assignment.is_active === true
      );
      const assignedUsers = activeAssignments
        .map((assignment) => users.get(String(assignment.user_id)))
        .filter(Boolean);
      const headquarter = headquarters.get(String(site.headquarter_id)) || null;

      return {
        ...site,
        headquarter: headquarter
          ? { id: headquarter.id, name: headquarter.name }
          : null,
        headquarter_detail: headquarter,
        assigned_user: assignedUsers[0] || null,
        assigned_users: assignedUsers,
        active_assignment_count: activeAssignments.length,
      };
    });
  }

  function assignedSitesForUser(userId: string) {
    const siteIds = new Set(
      state.assignments
        .filter(
          (assignment) =>
            assignment.is_active === true && String(assignment.user_id) === userId
        )
        .map((assignment) => String(assignment.site_id))
    );

    return hydratedSites().filter((site) => siteIds.has(String(site.id)));
  }

  function visibleReportsForSite(siteId: string) {
    return state.reports.filter(
      (report) =>
        String(report.site_id) === siteId && String(report.status) !== 'archived'
    );
  }

  function upsertReport(body: JsonRecord) {
    const reportKey = String(body.report_key);
    const existingIndex = state.reports.findIndex(
      (report) => String(report.report_key) === reportKey
    );
    const existing =
      existingIndex >= 0 ? state.reports[existingIndex] : null;
    const siteId = String(body.site_id || existing?.site_id || 'site-1');
    const site =
      state.sites.find((item) => String(item.id) === siteId) ?? state.sites[0];
    const payload =
      body.payload && typeof body.payload === 'object'
        ? clone(body.payload)
        : {};
    const meta =
      body.meta && typeof body.meta === 'object'
        ? clone(body.meta)
        : {};
    const nextStatus = String(body.status || existing?.status || 'draft');
    const nextReport = {
      id: reportKey,
      report_key: reportKey,
      report_title: String(body.report_title || existing?.report_title || '테스트 보고서'),
      site_id: siteId,
      headquarter_id: body.headquarter_id ?? existing?.headquarter_id ?? site?.headquarter_id ?? null,
      assigned_user_id:
        body.assigned_user_id ??
        meta.reporterUserId ??
        existing?.assigned_user_id ??
        'field-1',
      visit_date: body.visit_date ?? existing?.visit_date ?? null,
      visit_round:
        typeof body.visit_round === 'number'
          ? body.visit_round
          : existing?.visit_round ?? null,
      total_round:
        typeof body.total_round === 'number'
          ? body.total_round
          : existing?.total_round ?? null,
      progress_rate:
        typeof body.progress_rate === 'number'
          ? body.progress_rate
          : existing?.progress_rate ?? null,
      status: nextStatus,
      payload_version: 1,
      latest_revision_no: Number(existing?.latest_revision_no ?? 0) + 1,
      submitted_at:
        nextStatus === 'submitted' || nextStatus === 'published'
          ? NOW
          : existing?.submitted_at ?? null,
      published_at:
        nextStatus === 'published' ? NOW : existing?.published_at ?? null,
      last_autosaved_at: NOW,
      meta,
      created_at: existing?.created_at ?? NOW,
      updated_at: NOW,
      payload,
    };

    if (existingIndex >= 0) {
      state.reports[existingIndex] = nextReport;
    } else {
      state.reports.push(nextReport);
    }

    return nextReport;
  }

  function archiveReport(reportKey: string) {
    const report = state.reports.find(
      (item) => String(item.report_key) === reportKey
    );
    assert(report, `삭제 대상 보고서를 찾을 수 없습니다: ${reportKey}`);
    Object.assign(report, {
      status: 'archived',
      updated_at: NOW,
    });
    return report;
  }

  return {
    archiveReport,
    assignedSitesForUser,
    getUserForToken,
    hydratedAssignments,
    hydratedSites,
    upsertReport,
    visibleReportsForSite,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runBrowserCrudSmoke() {
  const state = createInitialState();
  const helpers = createRouteHelpers(state);
  const requestCounts = new Map<string, number>();
  const delayedReportListRequests = new Set<string>();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await context.route('**/api/safety/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace('/api/safety', '') || '/';
    const normalizedPath = normalizeSafetyPath(pathname);
    const key = `${request.method()} ${normalizedPath}`;
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1);

    const json = request.postDataJSON?.bind(request);
    const requestUser = () =>
      helpers.getUserForToken(request.headers().authorization || null);
    const fulfillJson = async (payload: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    };

    if (pathname === '/auth/token' && request.method() === 'POST') {
      const username = new URLSearchParams(request.postData() || '')
        .get('username')
        ?.trim()
        .toLowerCase();
      const matchedUser =
        state.users.find(
          (user) => String(user.email).toLowerCase() === username
        ) ?? state.users[0];
      await fulfillJson({
        access_token: getTokenForUser(String(matchedUser.id)),
        token_type: 'bearer',
      });
      return;
    }

    if (pathname === '/auth/me' && request.method() === 'GET') {
      await fulfillJson(clone(requestUser()));
      return;
    }

    if (pathname === '/users' && request.method() === 'GET') {
      await fulfillJson(clone(state.users));
      return;
    }

    if (pathname === '/users' && request.method() === 'POST') {
      const body = (await json?.()) as JsonRecord;
      const created = {
        id: `user-${slugify(String(body.email || body.name || Date.now()))}`,
        email: body.email,
        name: body.name,
        phone: body.phone ?? null,
        role: body.role ?? 'field_agent',
        position: body.position ?? null,
        organization_name: body.organization_name ?? null,
        is_active: body.is_active ?? true,
        created_at: NOW,
        updated_at: NOW,
        last_login_at: null,
      };
      state.users.push(created);
      await fulfillJson(clone(created), 200);
      return;
    }

    if (normalizedPath === '/users/:id' && request.method() === 'PATCH') {
      const body = (await json?.()) as JsonRecord;
      const user = state.users.find((item) => item.id === pathname.split('/').pop());
      assert(user, `사용자 수정 대상이 없습니다: ${pathname}`);
      Object.assign(user, body, { updated_at: NOW });
      await fulfillJson(clone(user));
      return;
    }

    if (normalizedPath === '/users/:id/password' && request.method() === 'POST') {
      await fulfillJson({ message: 'ok' });
      return;
    }

    if (normalizedPath === '/users/:id' && request.method() === 'DELETE') {
      const user = state.users.find((item) => item.id === pathname.split('/').pop());
      assert(user, `사용자 비활성화 대상이 없습니다: ${pathname}`);
      Object.assign(user, { is_active: false, updated_at: NOW });
      await fulfillJson(clone(user));
      return;
    }

    if (pathname === '/headquarters' && request.method() === 'GET') {
      await fulfillJson(clone(state.headquarters));
      return;
    }

    if (pathname === '/headquarters' && request.method() === 'POST') {
      const body = (await json?.()) as JsonRecord;
      const created = {
        id: `hq-${slugify(String(body.name || Date.now()))}`,
        name: body.name,
        business_registration_no: body.business_registration_no ?? null,
        corporate_registration_no: body.corporate_registration_no ?? null,
        license_no: body.license_no ?? null,
        contact_name: body.contact_name ?? null,
        contact_phone: body.contact_phone ?? null,
        address: body.address ?? null,
        memo: body.memo ?? null,
        is_active: body.is_active ?? true,
        created_at: NOW,
        updated_at: NOW,
      };
      state.headquarters.push(created);
      await fulfillJson(clone(created));
      return;
    }

    if (normalizedPath === '/headquarters/:id' && request.method() === 'PATCH') {
      const body = (await json?.()) as JsonRecord;
      const item = state.headquarters.find((value) => value.id === pathname.split('/').pop());
      assert(item, `사업장 수정 대상이 없습니다: ${pathname}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(clone(item));
      return;
    }

    if (normalizedPath === '/headquarters/:id' && request.method() === 'DELETE') {
      const item = state.headquarters.find((value) => value.id === pathname.split('/').pop());
      assert(item, `사업장 비활성화 대상이 없습니다: ${pathname}`);
      Object.assign(item, { is_active: false, updated_at: NOW });
      await fulfillJson(clone(item));
      return;
    }

    if (pathname === '/sites' && request.method() === 'GET') {
      await fulfillJson(clone(helpers.hydratedSites()));
      return;
    }

    if (pathname === '/assignments/me/sites' && request.method() === 'GET') {
      await fulfillJson(clone(helpers.assignedSitesForUser(String(requestUser().id))));
      return;
    }

    if (pathname === '/sites' && request.method() === 'POST') {
      const body = (await json?.()) as JsonRecord;
      const created = {
        id: `site-${slugify(String(body.site_name || Date.now()))}`,
        headquarter_id: body.headquarter_id,
        site_name: body.site_name,
        site_code: body.site_code ?? null,
        management_number: body.management_number ?? null,
        project_start_date: body.project_start_date ?? null,
        project_end_date: body.project_end_date ?? null,
        project_amount: body.project_amount ?? null,
        manager_name: body.manager_name ?? null,
        manager_phone: body.manager_phone ?? null,
        site_address: body.site_address ?? null,
        status: body.status ?? 'active',
        memo: body.memo ?? null,
        created_at: NOW,
        updated_at: NOW,
      };
      state.sites.push(created);
      await fulfillJson(clone(helpers.hydratedSites().find((item) => item.id === created.id)));
      return;
    }

    if (normalizedPath === '/sites/:id' && request.method() === 'PATCH') {
      const body = (await json?.()) as JsonRecord;
      const item = state.sites.find((value) => value.id === pathname.split('/').pop());
      assert(item, `현장 수정 대상이 없습니다: ${pathname}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(clone(helpers.hydratedSites().find((site) => site.id === item.id)));
      return;
    }

    if (normalizedPath === '/sites/:id' && request.method() === 'DELETE') {
      const item = state.sites.find((value) => value.id === pathname.split('/').pop());
      assert(item, `현장 종료 대상이 없습니다: ${pathname}`);
      Object.assign(item, { status: 'closed', updated_at: NOW });
      await fulfillJson(clone(helpers.hydratedSites().find((site) => site.id === item.id)));
      return;
    }

    if (pathname === '/assignments' && request.method() === 'GET') {
      await fulfillJson(clone(helpers.hydratedAssignments()));
      return;
    }

    if (pathname === '/assignments' && request.method() === 'POST') {
      const body = (await json?.()) as JsonRecord;
      const created = {
        id: `assignment-${slugify(String(body.site_id))}-${slugify(String(body.user_id))}`,
        user_id: body.user_id,
        site_id: body.site_id,
        role_on_site: body.role_on_site ?? '담당 지도요원',
        memo: body.memo ?? null,
        is_active: true,
        assigned_by: 'admin-1',
        assigned_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      };
      state.assignments.push(created);
      await fulfillJson(clone(helpers.hydratedAssignments().find((item) => item.id === created.id)));
      return;
    }

    if (normalizedPath === '/assignments/:id' && request.method() === 'PATCH') {
      const body = (await json?.()) as JsonRecord;
      const item = state.assignments.find((value) => value.id === pathname.split('/').pop());
      assert(item, `배정 수정 대상이 없습니다: ${pathname}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(clone(helpers.hydratedAssignments().find((assignment) => assignment.id === item.id)));
      return;
    }

    if (normalizedPath === '/assignments/:id' && request.method() === 'DELETE') {
      const item = state.assignments.find((value) => value.id === pathname.split('/').pop());
      assert(item, `배정 해제 대상이 없습니다: ${pathname}`);
      Object.assign(item, { is_active: false, updated_at: NOW });
      await fulfillJson(clone(helpers.hydratedAssignments().find((assignment) => assignment.id === item.id)));
      return;
    }

    if (pathname === '/content-items' && request.method() === 'GET') {
      await fulfillJson(clone(state.contentItems));
      return;
    }

    if (normalizedPath === '/content-items/assets/upload' && request.method() === 'POST') {
      await fulfillJson({
        path: '/uploads/mock-guide.pdf',
        file_name: 'guide.pdf',
        content_type: 'application/pdf',
        size: 2048,
      });
      return;
    }

    if (pathname === '/content-items' && request.method() === 'POST') {
      const body = (await json?.()) as JsonRecord;
      const created = {
        id: `content-${slugify(String(body.title || Date.now()))}`,
        content_type: body.content_type,
        title: body.title,
        code: body.code ?? null,
        body: body.body ?? '',
        tags: Array.isArray(body.tags) ? body.tags : [],
        sort_order: body.sort_order ?? 0,
        effective_from: body.effective_from ?? null,
        effective_to: body.effective_to ?? null,
        is_active: body.is_active ?? true,
        created_at: NOW,
        updated_at: NOW,
      };
      state.contentItems.push(created);
      await fulfillJson(clone(created));
      return;
    }

    if (normalizedPath === '/content-items/:id' && request.method() === 'PATCH') {
      const body = (await json?.()) as JsonRecord;
      const item = state.contentItems.find((value) => value.id === pathname.split('/').pop());
      assert(item, `콘텐츠 수정 대상이 없습니다: ${pathname}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(clone(item));
      return;
    }

    if (normalizedPath === '/content-items/:id' && request.method() === 'DELETE') {
      const item = state.contentItems.find((value) => value.id === pathname.split('/').pop());
      assert(item, `콘텐츠 비활성화 대상이 없습니다: ${pathname}`);
      Object.assign(item, { is_active: false, updated_at: NOW });
      await fulfillJson(clone(item));
      return;
    }

    if (normalizedPath === '/reports/site/:id/full' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      await fulfillJson(clone(helpers.visibleReportsForSite(siteId)));
      return;
    }

    if (pathname === '/reports' && request.method() === 'GET') {
      const siteId = url.searchParams.get('site_id');
      const requestUserId = String(requestUser().id);
      const delayKey = `${requestUserId}:${siteId || 'all'}`;
      const shouldDelay =
        requestUserId === 'field-1' &&
        siteId === 'site-1' &&
        !delayedReportListRequests.has(delayKey);

      if (shouldDelay) {
        delayedReportListRequests.add(delayKey);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      const reports = siteId
        ? helpers.visibleReportsForSite(siteId)
        : state.reports.filter((report) => String(report.status) !== 'archived');
      await fulfillJson(clone(reports.map((report) => toReportListItem(report))));
      return;
    }

    if (pathname === '/reports/upsert' && request.method() === 'POST') {
      const body = (await json?.()) as JsonRecord;
      await fulfillJson(clone(helpers.upsertReport(body)));
      return;
    }

    if (normalizedPath === '/reports/by-key/:id' && request.method() === 'GET') {
      const reportKey = pathname.split('/').pop() || '';
      const report = state.reports.find(
        (item) => String(item.report_key) === reportKey && String(item.status) !== 'archived'
      );
      assert(report, `상세 보고서를 찾을 수 없습니다: ${reportKey}`);
      await fulfillJson(clone(report));
      return;
    }

    if (normalizedPath === '/reports/by-key/:id' && request.method() === 'DELETE') {
      const reportKey = pathname.split('/').pop() || '';
      await fulfillJson(clone(helpers.archiveReport(reportKey)));
      return;
    }

    throw new Error(`미처리된 Safety API 요청: ${request.method()} ${pathname}`);
  });

  async function openSection(name: string) {
    console.log(`Open section: ${name}`);
    const button = page.getByRole('button', { name: new RegExp(name) }).first();
    await button.waitFor({ state: 'visible' });
    await button.click();
    await page.waitForTimeout(150);
  }

  async function expectRowText(text: string) {
    await page.locator('tr', { hasText: text }).first().waitFor({ state: 'visible' });
  }

  async function waitForRequestCount(requestKey: string, minimumCount: number) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if ((requestCounts.get(requestKey) || 0) >= minimumCount) {
        return;
      }
      await page.waitForTimeout(100);
    }

    assert.fail(`${requestKey} 요청이 ${minimumCount}회 이상 발생하지 않았습니다.`);
  }

  async function waitForLoginPanel() {
    await page.getByLabel('이메일').waitFor({ state: 'visible' });
    await page.getByLabel('비밀번호').waitFor({ state: 'visible' });
  }

  async function loginAs(email: string, password = 'smoke-password') {
    await waitForLoginPanel();
    await page.getByLabel('이메일').fill(email);
    await page.getByLabel('비밀번호').fill(password);
    await page.getByRole('button', { name: '로그인' }).click();
  }

  async function logoutToLoginPanel() {
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const text = document.body?.innerText || '';
      return text.includes('로그아웃') || text.includes('로그인');
    });
    const logoutButton = page.getByRole('button', { name: '로그아웃' }).first();
    if ((await logoutButton.count()) > 0) {
      await logoutButton.click();
    }
    await waitForLoginPanel();
  }

  console.log('Step: open login page');
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    return text.includes('로그인') || text.includes('관리자 대시보드');
  });
  console.log('Step: submit login');
  await loginAs('admin@example.com');
  console.log('Step: wait for dashboard');
  await page.getByText('관리자 대시보드').waitFor({ state: 'visible' });
  await page.getByText('ERP 운영 현황').waitFor({ state: 'visible' });
  await page.waitForTimeout(1600);

  assert.equal(requestCounts.get('GET /users'), 1, '초기 관리자 로딩에서 사용자 요청이 중복되었습니다.');
  assert.equal(requestCounts.get('GET /headquarters'), 1, '초기 관리자 로딩에서 사업장 요청이 중복되었습니다.');
  assert.equal(requestCounts.get('GET /assignments'), 1, '초기 관리자 로딩에서 배정 요청이 중복되었습니다.');

  console.log('Step: user CRUD');
  await openSection('사용자');
  await page.getByRole('button', { name: '사용자 추가' }).click();
  const userCreateDialog = page.getByRole('dialog', { name: '사용자 추가' });
  await userCreateDialog.getByLabel('이름').fill('테스트 요원');
  await userCreateDialog.getByLabel('이메일').fill('tester@example.com');
  await userCreateDialog.getByLabel('비밀번호').fill('Pass1234!');
  await userCreateDialog.getByLabel('전화번호').fill('010-9999-9999');
  await userCreateDialog.getByLabel('직책').fill('보조요원');
  await userCreateDialog.getByLabel('소속').fill('검증팀');
  await userCreateDialog.getByRole('button', { name: '생성' }).click();
  await expectRowText('테스트 요원');

  let row = page.locator('tr', { hasText: '테스트 요원' }).first();
  await row.getByRole('button', { name: '수정' }).click();
  const userEditDialog = page.getByRole('dialog', { name: '사용자 수정' });
  await userEditDialog.getByLabel('이름').fill('테스트 요원 수정');
  await userEditDialog.getByLabel('새 비밀번호').fill('NextPass123!');
  await userEditDialog.getByRole('button', { name: '저장' }).click();
  await expectRowText('테스트 요원 수정');

  row = page.locator('tr', { hasText: '테스트 요원 수정' }).first();
  await row.getByRole('button', { name: '비활성화' }).click();
  await row.getByText('비활성').waitFor({ state: 'visible' });

  console.log('Step: headquarter CRUD');
  await openSection('사업장');
  await page.getByRole('button', { name: '사업장 추가' }).click();
  const headquarterCreateDialog = page.getByRole('dialog', { name: '사업장 추가' });
  await headquarterCreateDialog.getByLabel('사업장명').fill('테스트 본사');
  await headquarterCreateDialog.getByLabel('담당자').fill('오담당');
  await headquarterCreateDialog.getByLabel('사업자등록번호').fill('555-55-55555');
  await headquarterCreateDialog.getByLabel('주소').fill('부산시 해운대구 본사로 2');
  await headquarterCreateDialog.getByRole('button', { name: '생성' }).click();
  await expectRowText('테스트 본사');

  row = page.locator('tr', { hasText: '테스트 본사' }).first();
  await row.getByRole('button', { name: '수정' }).click();
  const headquarterEditDialog = page.getByRole('dialog', { name: '사업장 수정' });
  await headquarterEditDialog.getByLabel('사업장명').fill('테스트 본사 수정');
  await headquarterEditDialog.getByLabel('담당자').fill('오담당 수정');
  await headquarterEditDialog.getByRole('button', { name: '저장' }).click();
  await expectRowText('테스트 본사 수정');

  row = page.locator('tr', { hasText: '테스트 본사 수정' }).first();
  await row.getByRole('button', { name: '비활성화' }).click();

  console.log('Step: site CRUD');
  await openSection('현장');
  await page.getByRole('button', { name: '현장 추가' }).click();
  const siteCreateDialog = page.getByRole('dialog', { name: '현장 추가' });
  await siteCreateDialog.getByLabel('사업장').selectOption({ label: '기존 본사' });
  await siteCreateDialog.getByLabel('현장명').fill('테스트 현장');
  await siteCreateDialog.getByLabel('관리번호').fill('SITE-M-999');
  await siteCreateDialog.getByLabel('현장 책임자').fill('정소장');
  await siteCreateDialog.getByLabel('책임자 연락처').fill('010-7777-8888');
  await siteCreateDialog.getByLabel('현장 주소').fill('인천시 연수구 현장로 99');
  await siteCreateDialog.getByRole('button', { name: '생성' }).click();
  await expectRowText('테스트 현장');

  row = page.locator('tr', { hasText: '테스트 현장' }).first();
  await row.getByRole('button', { name: '수정' }).click();
  const siteEditDialog = page.getByRole('dialog', { name: '현장 수정' });
  await siteEditDialog.getByLabel('현장 책임자').fill('정소장 수정');
  await siteEditDialog.getByRole('button', { name: '저장' }).click();
  await expectRowText('정소장 수정');

  row = page.locator('tr', { hasText: '테스트 현장' }).first();
  await row.getByRole('button', { name: '지도요원 배정' }).click();
  const assignmentDialog = page.getByRole('dialog', { name: '테스트 현장 지도요원 배정' });
  const fieldRow = assignmentDialog.locator('tr', { hasText: '김요원' }).first();
  await fieldRow.getByRole('button', { name: '배정' }).click();
  await assignmentDialog.getByText('현재 배정: 김요원').waitFor({ state: 'visible' });
  await assignmentDialog.getByRole('button', { name: '닫기' }).click();

  row = page.locator('tr', { hasText: '테스트 현장' }).first();
  await row.getByRole('button', { name: '지도요원 배정' }).click();
  const assignmentDialogSecond = page.getByRole('dialog', { name: '테스트 현장 지도요원 배정' });
  const assignedRow = assignmentDialogSecond.locator('tr', { hasText: '김요원' }).first();
  await assignedRow.getByRole('button', { name: '해제' }).click();
  await assignmentDialogSecond.getByText('현재 배정: 없음').waitFor({ state: 'visible' });
  await assignmentDialogSecond.getByRole('button', { name: '닫기' }).click();

  row = page.locator('tr', { hasText: '테스트 현장' }).first();
  await row.getByRole('button', { name: '종료' }).click();
  await row.getByText('종료').waitFor({ state: 'visible' });

  console.log('Step: admin headquarters drilldown');
  const adminReportListBefore = requestCounts.get('GET /reports') || 0;
  await page.goto(`${BASE_URL}/admin?section=headquarters`, { waitUntil: 'load' });
  await page.locator('table tbody tr').first().locator('button').first().click();
  await page.waitForURL(/headquarterId=/);
  await page.locator('table tbody tr').first().locator('button').first().click();
  await page.waitForURL(/siteId=/);
  await page.getByText('기술지도 보고서').waitFor({ state: 'visible' });
  await page.getByText('분기 종합 보고서').waitFor({ state: 'visible' });
  await page.getByText('불량사업장 신고').waitFor({ state: 'visible' });
  assert.equal(
    requestCounts.get('GET /reports') || 0,
    adminReportListBefore,
    'Admin site selection should stay on the site hub before loading the report list.',
  );
  await page.getByRole('link', { name: '보고서 목록 열기' }).click();
  await waitForRequestCount('GET /reports', adminReportListBefore + 1);
  await page.locator('a[href="/sessions/report-tech-1"]').first().waitFor({ state: 'visible' });

  console.log('Step: content CRUD');
  await openSection('콘텐츠');
  await page.getByRole('button', { name: '콘텐츠 추가' }).click();
  const contentCreateDialog = page.getByRole('dialog', { name: '콘텐츠 추가' });
  await contentCreateDialog.getByLabel('콘텐츠 유형').selectOption('campaign_template');
  await contentCreateDialog.getByLabel('제목').fill('테스트 OPS');
  await contentCreateDialog.getByLabel('OPS 설명').fill('현장 점검용 OPS 설명 테스트');
  await contentCreateDialog
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'ops.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0n8AAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await contentCreateDialog.getByText('ops.png').waitFor({ state: 'visible' });
  await contentCreateDialog.getByRole('button', { name: '생성' }).click();
  await expectRowText('테스트 OPS');

  row = page.locator('tr', { hasText: '테스트 OPS' }).first();
  await row.getByRole('button', { name: '수정' }).click();
  const contentEditDialog = page.getByRole('dialog', { name: '콘텐츠 수정' });
  await contentEditDialog.getByLabel('제목').fill('테스트 OPS 수정');
  await contentEditDialog.getByRole('button', { name: '저장' }).click();
  await expectRowText('테스트 OPS 수정');

  row = page.locator('tr', { hasText: '테스트 OPS 수정' }).first();
  await row.getByRole('button', { name: '비활성화' }).click();

  console.log('Step: admin report archive');
  await page.goto(`${BASE_URL}/sites/site-1`, { waitUntil: 'load' });
  const reportDeleteButton = page
    .locator('table')
    .getByRole('button', { name: '삭제' })
    .first();
  try {
    await reportDeleteButton.waitFor({ state: 'visible', timeout: 6000 });
  } catch {
    await page.reload({ waitUntil: 'load' });
    await reportDeleteButton.waitFor({ state: 'visible', timeout: 10000 });
  }
  const archivedBefore = requestCounts.get('DELETE /reports/by-key/:id') || 0;
  await reportDeleteButton.click();
  await page
    .getByRole('dialog', { name: '보고서 삭제' })
    .getByRole('button', { name: '삭제' })
    .click();
  await waitForRequestCount('DELETE /reports/by-key/:id', archivedBefore + 1);

  console.log('Step: field agent report flows');
  await logoutToLoginPanel();
  const fieldAssignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
  const reportReadsBefore = requestCounts.get('GET /reports/site/:id/full') || 0;
  const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;

  await loginAs('agent@example.com');
  await page.getByText('배정된 고객사 현장').waitFor({ state: 'visible' });
  await waitForRequestCount('GET /assignments/me/sites', fieldAssignmentsBefore + 1);
  await waitForRequestCount('GET /reports/site/:id/full', reportReadsBefore + 1);

  await page.getByRole('link', { name: '보고서 보기' }).first().click();
  await page.getByText('추가 업무 문서').waitFor({ state: 'visible' });

  await page.getByRole('button', { name: '새 보고서 시작' }).click();
  await page.getByText('문서 진행률').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '지금 저장' }).click();
  await waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);

  await page.getByRole('link', { name: '보고서 목록으로' }).click();
  await page.getByText('추가 업무 문서').waitFor({ state: 'visible' });

  const quarterKey = getQuarterTargetsForConstructionPeriod('2026-01-01 ~ 2026-06-30')[0]
    ?.quarterKey;
  assert.ok(quarterKey, '현장 분기 키를 계산하지 못했습니다.');

  await page.goto(
    `${BASE_URL}/sites/site-1/quarterly/${encodeURIComponent(quarterKey)}`,
    { waitUntil: 'load' }
  );
  await page.getByRole('button', { name: '저장' }).click();
  await waitForRequestCount('POST /reports/upsert', reportWritesBefore + 2);
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator('text=운영 보고서를 불러오는 중 오류가 발생했습니다.').count(),
    0,
    '분기 보고서 저장 중 오류 배너가 노출되었습니다.'
  );

  await page.goto(`${BASE_URL}/sites/site-1/bad-workplace/2026-03`, {
    waitUntil: 'load',
  });
  await page.getByRole('button', { name: '저장' }).click();
  await waitForRequestCount('POST /reports/upsert', reportWritesBefore + 3);
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator('text=운영 보고서를 불러오는 중 오류가 발생했습니다.').count(),
    0,
    '불량사업장 신고서 저장 중 오류 배너가 노출되었습니다.'
  );

  assert.equal(pageErrors.length, 0, `브라우저 오류가 발생했습니다: ${pageErrors.join(' | ')}`);
  assert.equal(consoleErrors.length, 0, `콘솔 오류가 발생했습니다: ${consoleErrors.join(' | ')}`);
  assert.equal(
    state.users.find((item) => item.name === '테스트 요원 수정')?.is_active,
    false,
    '사용자 비활성화가 반영되지 않았습니다.'
  );
  assert.equal(
    state.headquarters.find((item) => item.name === '테스트 본사 수정')?.is_active,
    false,
    '사업장 비활성화가 반영되지 않았습니다.'
  );
  assert.equal(
    state.sites.find((item) => item.site_name === '테스트 현장')?.status,
    'closed',
    '현장 종료가 반영되지 않았습니다.'
  );
  assert.equal(
    state.contentItems.find((item) => item.title === '테스트 OPS 수정')?.is_active,
    false,
    '콘텐츠 비활성화가 반영되지 않았습니다.'
  );
  assert.ok(
    (requestCounts.get('POST /content-items/assets/upload') || 0) >= 1,
    '콘텐츠 파일 업로드 요청이 발생하지 않았습니다.'
  );
  assert.ok(
    state.reports.some(
      (item) => item.meta?.reportKind === QUARTERLY_SUMMARY_REPORT_KIND
    ),
    '분기 보고서 저장이 반영되지 않았습니다.'
  );
  assert.ok(
    state.reports.some(
      (item) => item.meta?.reportKind === BAD_WORKPLACE_REPORT_KIND
    ),
    '불량사업장 신고서 저장이 반영되지 않았습니다.'
  );
  assert.ok(
    state.reports.some((item) => item.status === 'archived'),
    '기술지도 보고서 삭제가 반영되지 않았습니다.'
  );

  await browser.close();

  return {
    requestCounts,
  };
}

async function runBrowserErpSmoke() {
  const state = createInitialState();
  const helpers = createRouteHelpers(state);
  const requestCounts = new Map<string, number>();
  const delayedReportListRequests = new Set<string>();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await context.route('**/api/safety/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace('/api/safety', '') || '/';
    const normalizedPath = normalizeSafetyPath(pathname);
    const key = `${request.method()} ${normalizedPath}`;
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1);

    const requestUser = () =>
      helpers.getUserForToken(request.headers().authorization || null);
    const fulfillJson = async (payload: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    };

    if (pathname === '/auth/token' && request.method() === 'POST') {
      const username = new URLSearchParams(request.postData() || '')
        .get('username')
        ?.trim()
        .toLowerCase();
      const matchedUser =
        state.users.find((user) => String(user.email).toLowerCase() === username) ??
        state.users[0];
      await fulfillJson({
        access_token: getTokenForUser(String(matchedUser.id)),
        token_type: 'bearer',
      });
      return;
    }

    if (pathname === '/auth/me' && request.method() === 'GET') {
      await fulfillJson(clone(requestUser()));
      return;
    }

    if (pathname === '/users' && request.method() === 'GET') {
      await fulfillJson(clone(state.users));
      return;
    }

    if (pathname === '/headquarters' && request.method() === 'GET') {
      await fulfillJson(clone(state.headquarters));
      return;
    }

    if (pathname === '/sites' && request.method() === 'GET') {
      await fulfillJson(clone(helpers.hydratedSites()));
      return;
    }

    if (pathname === '/assignments' && request.method() === 'GET') {
      await fulfillJson(clone(helpers.hydratedAssignments()));
      return;
    }

    if (pathname === '/assignments/me/sites' && request.method() === 'GET') {
      await fulfillJson(clone(helpers.assignedSitesForUser(String(requestUser().id))));
      return;
    }

    if (pathname === '/content-items' && request.method() === 'GET') {
      await fulfillJson(clone(state.contentItems));
      return;
    }

    if (normalizedPath === '/reports/site/:id/full' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      await fulfillJson(clone(helpers.visibleReportsForSite(siteId)));
      return;
    }

    if (pathname === '/reports' && request.method() === 'GET') {
      const siteId = url.searchParams.get('site_id');
      const requestUserId = String(requestUser().id);
      const delayKey = `${requestUserId}:${siteId || 'all'}`;
      const shouldDelay =
        requestUserId === 'field-1' &&
        siteId === 'site-1' &&
        !delayedReportListRequests.has(delayKey);

      if (shouldDelay) {
        delayedReportListRequests.add(delayKey);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      const reports = siteId
        ? helpers.visibleReportsForSite(siteId)
        : state.reports.filter((report) => String(report.status) !== 'archived');
      await fulfillJson(clone(reports.map((report) => toReportListItem(report))));
      return;
    }

    if (normalizedPath === '/reports/by-key/:id' && request.method() === 'GET') {
      const reportKey = pathname.split('/').pop() || '';
      const report = state.reports.find(
        (item) => String(item.report_key) === reportKey && String(item.status) !== 'archived',
      );
      assert(report, `Missing detailed report fixture: ${reportKey}`);
      await fulfillJson(clone(report));
      return;
    }

    if (pathname === '/reports/upsert' && request.method() === 'POST') {
      const body = request.postDataJSON?.() as JsonRecord;
      await fulfillJson(clone(helpers.upsertReport(body)));
      return;
    }

    throw new Error(`Unhandled ERP smoke request: ${request.method()} ${pathname}`);
  });

  async function waitForRequestCount(requestKey: string, minimumCount: number) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if ((requestCounts.get(requestKey) || 0) >= minimumCount) {
        return;
      }
      await page.waitForTimeout(100);
    }

    assert.fail(`Expected at least ${minimumCount} request(s) for ${requestKey}.`);
  }

  async function waitForLoginPanel() {
    await page.locator('input[type="email"]').waitFor({ state: 'visible' });
    await page.locator('input[type="password"]').waitFor({ state: 'visible' });
    await page.locator('button[type="submit"]').waitFor({ state: 'visible' });
  }

  async function loginAs(email: string, password = 'smoke-password') {
    await waitForLoginPanel();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
  }

  async function logoutToLoginPanel() {
    await context.clearCookies();
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'load' });
    await waitForLoginPanel();
  }

  console.log('ERP smoke: open login page');
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await waitForLoginPanel();

  console.log('ERP smoke: admin drilldown');
  await loginAs('admin@example.com');
  await waitForRequestCount('GET /users', 1);
  await waitForRequestCount('GET /headquarters', 1);
  await waitForRequestCount('GET /assignments', 1);

  const adminReportListBefore = requestCounts.get('GET /reports') || 0;
  await page.goto(`${BASE_URL}/admin?section=headquarters`, { waitUntil: 'load' });
  await page.locator('table tbody tr').first().locator('button').first().click();
  await page.waitForURL(/headquarterId=/);
  await page.locator('table tbody tr').first().locator('button').first().click();
  await page.waitForURL(/siteId=/);
  await page.getByText('기술지도 보고서').waitFor({ state: 'visible' });
  await page.getByText('분기 종합 보고서').waitFor({ state: 'visible' });
  await page.getByText('불량사업장 신고').waitFor({ state: 'visible' });
  assert.equal(
    requestCounts.get('GET /reports') || 0,
    adminReportListBefore,
    'Admin site selection should not preload the report index.',
  );
  await page.getByRole('link', { name: '보고서 목록 열기' }).click();
  await page.waitForURL(/\/sites\/site-1$/);
  await waitForRequestCount('GET /reports', adminReportListBefore + 1);
  await page.locator('a[href="/sessions/report-tech-1"]').first().waitFor({ state: 'visible' });
  await page.getByLabel('이전 화면으로 돌아가기').click();
  await page.waitForURL(/siteId=/);
  await page.getByText('기술지도 보고서').waitFor({ state: 'visible' });

  console.log('ERP smoke: worker login');
  await logoutToLoginPanel();
  const fieldAssignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
  const reportListReadsBefore = requestCounts.get('GET /reports') || 0;
  const fullReportReadsBefore = requestCounts.get('GET /reports/site/:id/full') || 0;
  const reportDetailReadsBefore = requestCounts.get('GET /reports/by-key/:id') || 0;
  const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;

  await loginAs('agent@example.com');
  await waitForRequestCount('GET /assignments/me/sites', fieldAssignmentsBefore + 1);
  await page.locator('a[href="/sites/site-1/entry"]').first().waitFor({ state: 'visible' });
  assert.equal(
    requestCounts.get('GET /reports') || 0,
    reportListReadsBefore,
    'Worker login should not preload report indexes.',
  );
  assert.equal(
    requestCounts.get('GET /reports/site/:id/full') || 0,
    fullReportReadsBefore,
    'Worker login should not preload full report payloads.',
  );

  console.log('ERP smoke: report list loading guard');
  await page.goto(`${BASE_URL}/sites/site-1`, { waitUntil: 'load' });
  assert.equal(
    await page.getByRole('button', { name: '보고서 추가' }).count(),
    0,
    'The create-report button must stay hidden while the report index is loading.',
  );
  await waitForRequestCount('GET /reports', reportListReadsBefore + 1);
  await page.locator('a[href="/sessions/report-tech-1"]').first().waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '보고서 추가' }).waitFor({ state: 'visible' });

  console.log('ERP smoke: report detail hydration');
  await page.locator('a[href="/sessions/report-tech-1"]').first().click();
  await page.waitForURL(/\/sessions\/report-tech-1$/);
  await waitForRequestCount('GET /reports/by-key/:id', reportDetailReadsBefore + 1);

  console.log('ERP smoke: site-centric entry hub');
  await page.goto(`${BASE_URL}/sites/site-1/entry`, { waitUntil: 'load' });
  await page.locator('a[href="/sites/site-1"]').first().waitFor({ state: 'visible' });
  await page.locator('a[href^="/sites/site-1/quarterly/"]').first().waitFor({ state: 'visible' });
  await page.locator('a[href^="/sites/site-1/bad-workplace/"]').first().waitFor({ state: 'visible' });

  const quarterKey = getQuarterTargetsForConstructionPeriod('2026-01-01 ~ 2026-06-30')[0]
    ?.quarterKey;
  assert.ok(quarterKey, 'Failed to calculate the seeded quarterly target.');

  console.log('ERP smoke: quarterly summary draft and save');
  await page
    .locator(`a[href="/sites/site-1/quarterly/${encodeURIComponent(quarterKey)}"]`)
    .first()
    .click();
  await page.waitForURL(new RegExp(`/sites/site-1/quarterly/${encodeURIComponent(quarterKey)}$`));
  assert.ok(
    (await page.locator('input[type="checkbox"]').count()) > 0,
    'Quarterly summary should expose source report selection controls.',
  );
  await page.locator('button.app-button-primary').first().click();
  await waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);

  console.log('ERP smoke: bad workplace draft and save');
  await page.goto(`${BASE_URL}/sites/site-1/entry?entry=bad-workplace`, {
    waitUntil: 'load',
  });
  await page.locator('a[href^="/sites/site-1/bad-workplace/"]').first().click();
  await page.waitForURL(/\/sites\/site-1\/bad-workplace\/[^/]+$/);
  assert.ok(
    (await page.locator('input[type="checkbox"]').count()) > 0,
    'Bad workplace report should expose selectable source findings.',
  );
  await page.locator('button.app-button-primary').first().click();
  await waitForRequestCount('POST /reports/upsert', reportWritesBefore + 2);

  assert.equal(pageErrors.length, 0, `Browser page errors: ${pageErrors.join(' | ')}`);
  assert.equal(consoleErrors.length, 0, `Browser console errors: ${consoleErrors.join(' | ')}`);
  assert.ok(
    state.reports.some((item) => item.meta?.reportKind === QUARTERLY_SUMMARY_REPORT_KIND),
    'Quarterly summary report was not persisted by the smoke flow.',
  );
  assert.ok(
    state.reports.some((item) => item.meta?.reportKind === BAD_WORKPLACE_REPORT_KIND),
    'Bad workplace report was not persisted by the smoke flow.',
  );

  await browser.close();

  return {
    requestCounts,
  };
}

async function assertDocumentResponse(path: string, body: JsonRecord) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 200, `${path} 응답 코드가 200이 아닙니다.`);
  const contentType = response.headers.get('content-type') || '';
  assert.match(contentType, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/i);
  const arrayBuffer = await response.arrayBuffer();
  assert.ok(arrayBuffer.byteLength > 1000, `${path} 문서 크기가 비정상적으로 작습니다.`);
}

async function runDocumentSmoke() {
  console.log('Step: document routes');
  const site = createInspectionSite({
    customerName: '테스트 고객사',
    siteName: '문서 검증 현장',
    assigneeName: '김요원',
    constructionPeriod: '2026-01-01 ~ 2026-06-30',
    siteManagerName: '문소장',
    headquartersAddress: '서울시 종로구 문서로 1',
    headquartersContact: '02-555-1111',
    siteAddress: '서울시 종로구 현장로 100',
  });
  site.id = 'doc-site-1';

  const session = createInspectionSession(
    {
      meta: {
        siteName: site.siteName,
        reportDate: '2026-03-15',
        drafter: '김요원',
      },
      adminSiteSnapshot: site.adminSiteSnapshot,
      document13Cases: [],
      document14SafetyInfos: [],
    },
    site.id,
    1
  );

  session.document2Overview.progressRate = '35';
  session.document2Overview.visitCount = '2';
  session.document7Findings[0].location = '외부 비계 작업구간';
  session.document7Findings[0].emphasis = '추락 위험';
  session.document7Findings[0].improvementPlan = '안전난간 보강 및 작업 전 점검 실시';
  session.document7Findings[0].accidentType = '추락';
  session.document7Findings[0].causativeAgentKey = '4_비계_작업발판';
  session.document7Findings[0].legalReferenceTitle = '산업안전보건기준에 관한 규칙';
  session.document4FollowUps[0].result = '이행';

  const quarterTargets = getQuarterTargetsForConstructionPeriod(
    site.adminSiteSnapshot.constructionPeriod
  );
  assert.ok(quarterTargets.length > 0, '분기 대상이 생성되지 않았습니다.');

  const quarterlyReport = buildInitialQuarterlySummaryReport(
    site,
    [session],
    quarterTargets[0],
    '김요원'
  );
  void buildInitialBadWorkplaceReport(
    site,
    [session],
    {
      id: 'field-1',
      name: '김요원',
      phone: '010-2222-2222',
      organization_name: '한국종합안전',
    },
    '2026-03'
  );

  await assertDocumentResponse('/api/documents/quarterly/hwpx', {
    report: quarterlyReport,
    site,
  });
}

async function assertVisionResponse(
  path: string,
  validator: (payload: unknown) => void
) {
  const file = new File(
    [
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0foAAAAASUVORK5CYII=',
        'base64'
      ),
    ],
    'hazard.png',
    { type: 'image/png' }
  );
  const body = new FormData();
  body.append('files', file);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(7000),
  });

  assert.equal(response.status, 200, `${path} 응답 코드가 200이 아닙니다.`);
  const payload = await response.json();
  validator(payload);
}

async function runVisionSmoke() {
  console.log('Step: vision routes');

  await assertVisionResponse('/api/vision/analyze-hazard-photos', (payload) => {
    assert.ok(Array.isArray(payload), '사진 분석 응답은 배열이어야 합니다.');
    assert.equal(payload.length, 1, '사진 분석 응답 개수가 예상과 다릅니다.');
    assert.ok(
      Array.isArray(payload[0]?.risk_factor),
      '사진 분석 응답에 risk_factor 배열이 없습니다.'
    );
  });

  await assertVisionResponse('/api/vision/check-causative-agents', (payload) => {
    assert.ok(payload && typeof payload === 'object', '기인물 분석 응답이 객체가 아닙니다.');
    assert.ok(
      payload.agents && typeof payload.agents === 'object',
      '기인물 분석 응답에 agents 객체가 없습니다.'
    );
  });
}

async function main() {
  console.log('Smoke test started.');
  const browserResult = await runBrowserErpSmoke();
  await runDocumentSmoke();
  await runVisionSmoke();

  const summary = [...browserResult.requestCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, count]) => `${key} = ${count}`)
    .join('\n');

  console.log('Smoke test completed successfully.');
  console.log(summary);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
