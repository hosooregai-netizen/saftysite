import assert from 'node:assert/strict';
import { chromium, type Browser, type BrowserContext, type Page, type Route } from 'playwright';
import type { ClientSmokePlaywrightConfig } from '../../../playwright.config';
import { getQuarterTargetsForConstructionPeriod } from '../../../lib/erpReports/shared';
import { getFeatureContract, type FeatureContractId } from '../featureContracts';
import {
  clone,
  createInitialState,
  createRouteHelpers,
  extractMockedSafetyPath,
  getTokenForUser,
  normalizeSafetyPath,
  NOW,
  toReportListItem,
} from '../../../tooling/internal/smokeClient_impl';

type JsonRecord = Record<string, unknown>;

interface ErpSmokeFixtureContext {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  helpers: ReturnType<typeof createRouteHelpers>;
  pageErrors: string[];
  consoleErrors: string[];
  delayedReportListRequests: Set<string>;
}

export interface ErpSmokeHarness extends ErpSmokeFixtureContext {
  baseURL: string;
  config: ClientSmokePlaywrightConfig;
  contract: ReturnType<typeof getFeatureContract>;
  requestCounts: Map<string, number>;
  state: ReturnType<typeof createInitialState>;
  assertContractApisObserved: () => void;
  assertNoClientErrors: () => void;
  close: () => Promise<void>;
  loginAs: (email: string, password?: string) => Promise<void>;
  logoutToLoginPanel: () => Promise<void>;
  waitForCondition: (check: () => Promise<boolean>, failureMessage: string) => Promise<void>;
  waitForLoginPanel: () => Promise<void>;
  waitForRequestCount: (requestKey: string, minimumCount: number) => Promise<void>;
}

function isExpectedConsoleError(text: string) {
  return (
    text.includes('status of 401') ||
    text.includes('Failed to load resource') ||
    text.includes('Encountered two children with the same key')
  );
}

function buildFixtureId(prefix: string, rawValue: unknown) {
  const normalized = String(rawValue || Date.now())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${prefix}-${normalized || Date.now()}`;
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function fulfillBinary(
  route: Route,
  body: Buffer,
  contentType: string,
  filename: string,
) {
  await route.fulfill({
    status: 200,
    contentType,
    headers: {
      'content-disposition': `attachment; filename="${filename}"`,
    },
    body,
  });
}

function normalizePublicReportApiPath(pathname: string) {
  return pathname.replace(/^\/api\/reports\/[^/]+\/dispatch$/, '/api/reports/:id/dispatch');
}

function isDispatchCompleted(dispatch: unknown) {
  if (!dispatch || typeof dispatch !== 'object') {
    return false;
  }

  const record = dispatch as JsonRecord;
  const status = String(record.dispatch_status ?? record.dispatchStatus ?? '').trim();
  return status === 'sent' || status === 'manual_checked';
}

function updateReportDispatchState(
  state: ReturnType<typeof createInitialState>,
  reportKey: string,
  dispatch: JsonRecord,
) {
  const reportIndex = state.reports.findIndex((report) => String(report.report_key) === reportKey);
  if (reportIndex < 0) {
    return null;
  }

  const current = state.reports[reportIndex];
  const meta =
    current.meta && typeof current.meta === 'object'
      ? ({ ...(current.meta as JsonRecord) } satisfies JsonRecord)
      : {};
  const nextReport = {
    ...current,
    dispatch,
    dispatch_completed: isDispatchCompleted(dispatch),
    meta: {
      ...meta,
      dispatch,
    },
    updated_at: NOW,
  };
  state.reports[reportIndex] = nextReport;
  return nextReport;
}

async function installErpRoutes({
  context,
  delayedReportListRequests,
  helpers,
  requestCounts,
  state,
}: Pick<ErpSmokeHarness, 'context' | 'delayedReportListRequests' | 'helpers' | 'requestCounts' | 'state'>) {
  const handleErpSafetyRoute = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = extractMockedSafetyPath(url.pathname);
    const normalizedPath = normalizeSafetyPath(pathname);
    const key = `${request.method()} ${normalizedPath}`;
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1);

    const requestUser = () => helpers.getUserForToken(request.headers().authorization || null);

    if (pathname === '/auth/token' && request.method() === 'POST') {
      const username = new URLSearchParams(request.postData() || '').get('username')?.trim().toLowerCase();
      const matchedUser =
        state.users.find((user) => String(user.email).toLowerCase() === username) ?? state.users[0];
      await fulfillJson(route, {
        access_token: getTokenForUser(String(matchedUser.id)),
        token_type: 'bearer',
      });
      return;
    }

    if (pathname === '/auth/me' && request.method() === 'GET') {
      await fulfillJson(route, clone(requestUser()));
      return;
    }

    if (pathname === '/users' && request.method() === 'GET') {
      await fulfillJson(route, clone(state.users));
      return;
    }

    if (normalizedPath === '/users/:id' && request.method() === 'DELETE') {
      const userId = pathname.split('/').pop() || '';
      const item = state.users.find((user) => String(user.id) === userId);
      assert(item, `Missing user fixture for delete: ${userId}`);
      Object.assign(item, { is_active: false, updated_at: NOW });
      state.assignments.forEach((assignment) => {
        if (String(assignment.user_id) === userId) {
          Object.assign(assignment, { is_active: false, updated_at: NOW });
        }
      });
      await fulfillJson(route, clone(item));
      return;
    }

    if (pathname === '/headquarters' && request.method() === 'GET') {
      await fulfillJson(route, clone(state.headquarters));
      return;
    }

    if (pathname === '/headquarters' && request.method() === 'POST') {
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const created = {
        id: buildFixtureId('hq', body.name),
        name: String(body.name || '신규 사업장'),
        management_number: body.management_number ?? null,
        opening_number: body.opening_number ?? null,
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
      await fulfillJson(route, clone(created));
      return;
    }

    if (normalizedPath === '/headquarters/:id' && request.method() === 'PATCH') {
      const headquarterId = pathname.split('/').pop() || '';
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const item = state.headquarters.find((headquarter) => String(headquarter.id) === headquarterId);
      assert(item, `Missing headquarter fixture for update: ${headquarterId}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(route, clone(item));
      return;
    }

    if (normalizedPath === '/headquarters/:id' && request.method() === 'DELETE') {
      const headquarterId = pathname.split('/').pop() || '';
      const item = state.headquarters.find((headquarter) => String(headquarter.id) === headquarterId);
      assert(item, `Missing headquarter fixture for delete: ${headquarterId}`);
      Object.assign(item, { is_active: false, updated_at: NOW });
      await fulfillJson(route, clone(item));
      return;
    }

    if (pathname === '/sites' && request.method() === 'GET') {
      await fulfillJson(route, clone(helpers.hydratedSites()));
      return;
    }

    if (pathname === '/sites' && request.method() === 'POST') {
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const created = {
        id: buildFixtureId('site', body.site_name),
        headquarter_id: String(body.headquarter_id || ''),
        site_name: String(body.site_name || '신규 현장'),
        site_code: body.site_code ?? null,
        management_number: body.management_number ?? null,
        labor_office: body.labor_office ?? null,
        guidance_officer_name: body.guidance_officer_name ?? null,
        project_start_date: body.project_start_date ?? null,
        project_end_date: body.project_end_date ?? null,
        project_amount: body.project_amount ?? null,
        project_scale: body.project_scale ?? null,
        project_kind: body.project_kind ?? null,
        client_management_number: body.client_management_number ?? null,
        client_business_name: body.client_business_name ?? null,
        client_representative_name: body.client_representative_name ?? null,
        client_corporate_registration_no: body.client_corporate_registration_no ?? null,
        client_business_registration_no: body.client_business_registration_no ?? null,
        order_type_division: body.order_type_division ?? null,
        technical_guidance_kind: body.technical_guidance_kind ?? null,
        contract_type: body.contract_type ?? null,
        contract_status: body.contract_status ?? null,
        manager_name: body.manager_name ?? null,
        inspector_name: body.inspector_name ?? null,
        contract_contact_name: body.contract_contact_name ?? null,
        manager_phone: body.manager_phone ?? null,
        site_contact_email: body.site_contact_email ?? null,
        is_high_risk_site: body.is_high_risk_site ?? null,
        site_address: body.site_address ?? null,
        status: body.status ?? 'active',
        lifecycle_status: body.lifecycle_status ?? body.status ?? 'active',
        contract_date: body.contract_date ?? null,
        contract_start_date: body.contract_start_date ?? null,
        contract_end_date: body.contract_end_date ?? null,
        contract_signed_date: body.contract_signed_date ?? null,
        per_visit_amount: body.per_visit_amount ?? null,
        total_rounds: body.total_rounds ?? null,
        total_contract_amount: body.total_contract_amount ?? null,
        memo: body.memo ?? null,
        created_at: NOW,
        updated_at: NOW,
      };
      state.sites.push(created);
      await fulfillJson(
        route,
        clone(
          (helpers.hydratedSites() as Array<JsonRecord & { id?: string }>).find(
            (site) => String(site.id) === created.id,
          ),
        ),
      );
      return;
    }

    if (pathname === '/assignments' && request.method() === 'GET') {
      await fulfillJson(route, clone(helpers.hydratedAssignments()));
      return;
    }

    if (pathname === '/assignments' && request.method() === 'POST') {
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const created = {
        id: buildFixtureId('assignment', `${body.site_id}-${body.user_id}`),
        user_id: body.user_id,
        site_id: body.site_id,
        role_on_site: body.role_on_site ?? '담당 지도요원',
        memo: body.memo ?? null,
        is_active: true,
        assigned_by: String(requestUser().id || 'admin-1'),
        assigned_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      };
      state.assignments.push(created);
      await fulfillJson(
        route,
        clone(
          (helpers.hydratedAssignments() as Array<JsonRecord & { id?: string }>).find(
            (assignment) => String(assignment.id) === created.id,
          ),
        ),
      );
      return;
    }

    if (pathname === '/assignments/me/sites' && request.method() === 'GET') {
      await fulfillJson(route, clone(helpers.assignedSitesForUser(String(requestUser().id))));
      return;
    }

    if (pathname === '/content-items' && request.method() === 'GET') {
      await fulfillJson(route, clone(state.contentItems));
      return;
    }

    if (pathname === '/site-workers' && request.method() === 'GET') {
      const siteId = url.searchParams.get('site_id');
      const blockedOnly = url.searchParams.get('blocked_only') === 'true';
      await fulfillJson(route, clone(helpers.listSiteWorkers(siteId, blockedOnly)));
      return;
    }

    if (normalizedPath === '/site-workers/import' && request.method() === 'POST') {
      const created = helpers.createSiteWorkerRecord('site-1');
      await fulfillJson(route, {
        processed_count: 2,
        created_count: 1,
        failed_count: 1,
        created_workers: [created],
        errors: [
          {
            row_number: 3,
            name: '오류 근로자',
            message: '이미 등록된 출입자와 중복되어 건너뛰었습니다.',
            raw: {
              name: '오류 근로자',
              phone: '010-9999-0000',
              company_name: '중복건설',
              trade: '도장',
              employment_type: 'daily',
              special_access: '신규 교육 확인',
              ppe_issues: '안전모 재지급',
            },
          },
        ],
      });
      return;
    }

    if (normalizedPath === '/content-items/assets/upload' && request.method() === 'POST') {
      await fulfillJson(route, {
        path: '/uploads/content-items/mock-photo.png',
        file_name: 'mock-photo.png',
        content_type: 'image/png',
        size: 1024,
      });
      return;
    }

    if (normalizedPath === '/sites/:id' && request.method() === 'GET') {
      const siteId = pathname.split('/').pop() || '';
      const site = (helpers.hydratedSites() as Array<JsonRecord & { id?: string }>).find(
        (item) => String(item.id) === siteId,
      );
      assert(site, `Missing site fixture: ${siteId}`);
      await fulfillJson(route, clone(site));
      return;
    }

    if (normalizedPath === '/sites/:id' && request.method() === 'PATCH') {
      const siteId = pathname.split('/').pop() || '';
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const item = state.sites.find((site) => String(site.id) === siteId);
      assert(item, `Missing site fixture for update: ${siteId}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(
        route,
        clone(
          (helpers.hydratedSites() as Array<JsonRecord & { id?: string }>).find(
            (site) => String(site.id) === siteId,
          ),
        ),
      );
      return;
    }

    if (normalizedPath === '/sites/:id' && request.method() === 'DELETE') {
      const siteId = pathname.split('/').pop() || '';
      const item = state.sites.find((site) => String(site.id) === siteId);
      assert(item, `Missing site fixture for delete: ${siteId}`);
      Object.assign(item, { lifecycle_status: 'deleted', status: 'deleted', updated_at: NOW });
      await fulfillJson(route, clone(item));
      return;
    }

    if (normalizedPath === '/assignments/:id' && request.method() === 'PATCH') {
      const assignmentId = pathname.split('/').pop() || '';
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const item = state.assignments.find((assignment) => String(assignment.id) === assignmentId);
      assert(item, `Missing assignment fixture for update: ${assignmentId}`);
      Object.assign(item, body, { updated_at: NOW });
      await fulfillJson(
        route,
        clone(
          (helpers.hydratedAssignments() as Array<JsonRecord & { id?: string }>).find(
            (assignment) => String(assignment.id) === assignmentId,
          ),
        ),
      );
      return;
    }

    if (normalizedPath === '/assignments/:id' && request.method() === 'DELETE') {
      const assignmentId = pathname.split('/').pop() || '';
      const item = state.assignments.find((assignment) => String(assignment.id) === assignmentId);
      assert(item, `Missing assignment fixture for delete: ${assignmentId}`);
      Object.assign(item, { is_active: false, updated_at: NOW });
      await fulfillJson(
        route,
        clone(
          (helpers.hydratedAssignments() as Array<JsonRecord & { id?: string }>).find(
            (assignment) => String(assignment.id) === assignmentId,
          ),
        ),
      );
      return;
    }

    if (normalizedPath === '/sites/:id/dashboard' && request.method() === 'GET') {
      const siteId = pathname.split('/')[2];
      await fulfillJson(route, clone(helpers.buildSiteDashboard(siteId)));
      return;
    }

    if (normalizedPath === '/reports/site/:id/full' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      await fulfillJson(route, clone(helpers.visibleReportsForSite(siteId)));
      return;
    }

    if (normalizedPath === '/reports/site/:id/operational-index' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      const visibleReports = helpers.visibleReportsForSite(siteId);
      const quarterlyReports = visibleReports
        .filter((report) => {
          const meta =
            report.meta && typeof report.meta === 'object'
              ? (report.meta as JsonRecord)
              : {};
          return String(meta.reportKind || '') === 'quarterly_summary';
        })
        .map((report) => {
          const meta =
            report.meta && typeof report.meta === 'object'
              ? (report.meta as JsonRecord)
              : {};
          return {
          report_key: String(report.report_key),
          report_title: String(report.report_title || ''),
          site_id: String(report.site_id),
          status: String(report.status),
          dispatch_completed: isDispatchCompleted(report.dispatch),
          period_start_date: String(meta.periodStartDate || ''),
          period_end_date: String(meta.periodEndDate || ''),
          quarter_key: String(meta.quarterKey || ''),
          year: Number(meta.year || 0),
          quarter: Number(meta.quarter || 0),
          selected_report_count: Number(report.selected_report_count || 0),
          last_calculated_at: String(report.last_calculated_at || report.updated_at || NOW),
          created_at: String(report.created_at || NOW),
          updated_at: String(report.updated_at || NOW),
          };
        });
      const badWorkplaceReports = visibleReports
        .filter((report) => {
          const meta =
            report.meta && typeof report.meta === 'object'
              ? (report.meta as JsonRecord)
              : {};
          return String(meta.reportKind || '') === 'bad_workplace';
        })
        .map((report) => {
          const meta =
            report.meta && typeof report.meta === 'object'
              ? (report.meta as JsonRecord)
              : {};
          return {
          report_key: String(report.report_key),
          report_title: String(report.report_title || ''),
          site_id: String(report.site_id),
          status: String(report.status),
          dispatch_completed: isDispatchCompleted(report.dispatch),
          report_month: String(meta.reportMonth || ''),
          reporter_user_id: String(meta.reporterUserId || ''),
          reporter_name: String(meta.reporterName || ''),
          source_finding_count: Number(report.source_finding_count || 0),
          violation_count: Number(report.violation_count || 0),
          created_at: String(report.created_at || NOW),
          updated_at: String(report.updated_at || NOW),
          };
        });
      await fulfillJson(route, {
        quarterly_reports: quarterlyReports,
        bad_workplace_reports: badWorkplaceReports,
      });
      return;
    }

    if (normalizedPath === '/reports/site/:id/quarterly-summary-seed' && request.method() === 'GET') {
      await fulfillJson(
        route,
        { detail: 'quarterly summary seed endpoint is intentionally unavailable in smoke.' },
        404,
      );
      return;
    }

    if (normalizedPath === '/reports/site/:id/technical-guidance-seed' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      const visibleReports = helpers.visibleReportsForSite(siteId).map((report) => toReportListItem(report));
      const previousAuthoritativeReport = visibleReports[0] ?? null;
      await fulfillJson(route, {
        next_visit_round: visibleReports.length + 1,
        projection_version: 1,
        open_followups: [],
        cumulative_accident_entries: [],
        cumulative_agent_entries: [],
        previous_authoritative_report: previousAuthoritativeReport,
      });
      return;
    }

    if (pathname === '/reports' && request.method() === 'GET') {
      const siteId = url.searchParams.get('site_id');
      const requestUserId = String(requestUser().id);
      const delayKey = `${requestUserId}:${siteId || 'all'}`;
      const shouldDelay =
        requestUserId === 'field-1' && siteId === 'site-1' && !delayedReportListRequests.has(delayKey);

      if (shouldDelay) {
        delayedReportListRequests.add(delayKey);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      const reports = siteId
        ? helpers.visibleReportsForSite(siteId)
        : state.reports.filter(
            (report) =>
              String(report.status) !== 'archived' &&
              String(report.lifecycle_status || '') !== 'deleted',
          );
      await fulfillJson(route, clone(reports.map((report) => toReportListItem(report))));
      return;
    }

    if (normalizedPath === '/reports/site/:id/draft-context' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      const documentKind = url.searchParams.get('document_kind') || 'tbm';
      const excludeReportId = url.searchParams.get('exclude_report_id');
      await fulfillJson(route, clone(helpers.buildDraftContext(siteId, documentKind, excludeReportId)));
      return;
    }

    if (normalizedPath === '/reports/by-key/:id' && request.method() === 'GET') {
      const reportKey = decodeURIComponent(pathname.split('/').pop() || '');
      const report = state.reports.find(
        (item) =>
          String(item.report_key) === reportKey &&
          String(item.status) !== 'archived' &&
          String(item.lifecycle_status || '') !== 'deleted',
      );
      if (!report) {
        await fulfillJson(route, { detail: 'report not found' }, 404);
        return;
      }
      await fulfillJson(route, clone(report));
      return;
    }

    if (normalizedPath === '/reports/:id' && request.method() === 'GET') {
      const reportId = decodeURIComponent(pathname.split('/').pop() || '');
      const report = helpers.getReportById(reportId);
      assert(report, `Missing ERP report fixture: ${reportId}`);
      await fulfillJson(route, clone(report));
      return;
    }

    if (normalizedPath === '/site-workers/:id/mobile-sessions' && request.method() === 'GET') {
      const workerId = pathname.split('/')[2] || '';
      await fulfillJson(route, clone(helpers.listWorkerMobileSessions(workerId)));
      return;
    }

    if (normalizedPath === '/site-workers/:id/mobile-session' && request.method() === 'POST') {
      const workerId = pathname.split('/')[2] || '';
      await fulfillJson(route, clone(helpers.createWorkerMobileSessionRecord(workerId)));
      return;
    }

    if (normalizedPath === '/worker-mobile-sessions/:id/revoke' && request.method() === 'POST') {
      const sessionId = pathname.split('/')[2] || '';
      await fulfillJson(route, clone(helpers.revokeWorkerMobileSession(sessionId)));
      return;
    }

    if (normalizedPath === '/site-workers/:id' && request.method() === 'PATCH') {
      const workerId = pathname.split('/')[2] || '';
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const worker = state.siteWorkers.find((item) => String(item.id) === workerId) ?? null;
      assert(worker, `Missing site worker fixture: ${workerId}`);
      Object.assign(worker, body, { updated_at: NOW });
      await fulfillJson(route, clone(worker));
      return;
    }

    if (normalizedPath === '/site-workers/:id/block' && request.method() === 'POST') {
      const workerId = pathname.split('/')[2] || '';
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      const worker = state.siteWorkers.find((item) => String(item.id) === workerId) ?? null;
      assert(worker, `Missing site worker fixture for block toggle: ${workerId}`);
      worker.is_blocked = Boolean(body.is_blocked);
      worker.updated_at = NOW;
      await fulfillJson(route, clone(worker));
      return;
    }

    if (pathname === '/reports/upsert' && request.method() === 'POST') {
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      await fulfillJson(route, clone(helpers.upsertReport(body)));
      return;
    }

    if (normalizedPath === '/reports/:id/status' && request.method() === 'POST') {
      const reportId = decodeURIComponent(pathname.split('/')[2] || '');
      const body = (request.postDataJSON?.() as JsonRecord) || {};
      await fulfillJson(route, clone(helpers.updateReportStatus(reportId, body)));
      return;
    }

    if (normalizedPath === '/mobile/session/:token' && request.method() === 'GET') {
      const tokenValue = pathname.split('/').pop() || '';
      const session = state.workerMobileSessions.find((item) => String(item.token) === tokenValue);
      assert(session, `Missing mobile session fixture: ${tokenValue}`);
      const worker =
        state.siteWorkers.find((item) => String(item.id) === String(session.worker_id)) ?? null;
      assert(worker, `Missing mobile worker fixture: ${tokenValue}`);
      if (session.revoked_at) {
        await fulfillJson(
          route,
          {
            detail:
              '모바일 링크가 관리자에 의해 만료되었습니다. 현장 관리직에게 다시 발급을 요청해 주세요.',
          },
          401,
        );
        return;
      }
      if (!session.expires_at || String(session.expires_at) <= NOW) {
        await fulfillJson(
          route,
          {
            detail:
              '모바일 링크 사용 시간이 종료되었습니다. 현장 관리직에게 다시 발급을 요청해 주세요.',
          },
          401,
        );
        return;
      }
      if (worker.is_blocked) {
        await fulfillJson(
          route,
          {
            detail:
              '차단된 출입자는 모바일 링크에 접근할 수 없습니다. 현장 관리직에게 확인해 주세요.',
          },
          403,
        );
        return;
      }
      await fulfillJson(route, clone(helpers.buildMobileSessionDetail(tokenValue)));
      return;
    }

    throw new Error(`Unhandled ERP smoke request: ${request.method()} ${pathname}`);
  };

  const handlePublicReportApiRoute = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const requestKey = `${request.method()} ${normalizePublicReportApiPath(pathname)}`;
    requestCounts.set(requestKey, (requestCounts.get(requestKey) || 0) + 1);

    if (/^\/api\/reports\/[^/]+\/dispatch$/.test(pathname) && request.method() === 'PATCH') {
      const reportKey = decodeURIComponent(pathname.split('/')[3] || '');
      const dispatch = JSON.parse(request.postData() || '{}') as JsonRecord;
      const report = updateReportDispatchState(state, reportKey, dispatch);
      assert(report, `Missing ERP report fixture for dispatch update: ${reportKey}`);
      await fulfillJson(route, clone(report));
      return;
    }

    await route.fallback();
  };

  const handleQuarterlyDocumentRoute = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const key = `${request.method()} ${url.pathname.replace(/^.*?(\/api\/documents\/quarterly\/)/, '/api/documents/quarterly/')}`;
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1);

    if (url.pathname.endsWith('/pdf')) {
      await fulfillBinary(
        route,
        Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
        'application/pdf',
        'quarterly-report.pdf',
      );
      return;
    }

    await fulfillBinary(
      route,
      Buffer.from('PK\x03\x04mock-hwpx', 'binary'),
      'application/octet-stream',
      'quarterly-report.hwpx',
    );
  };

  const handleBadWorkplaceDocumentRoute = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const key = `${request.method()} ${url.pathname.replace(
      /^.*?(\/api\/documents\/bad-workplace\/)/,
      '/api/documents/bad-workplace/',
    )}`;
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1);

    if (url.pathname.endsWith('/pdf')) {
      await fulfillBinary(
        route,
        Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
        'application/pdf',
        'bad-workplace-report.pdf',
      );
      return;
    }

    await fulfillBinary(
      route,
      Buffer.from('PK\x03\x04mock-hwpx', 'binary'),
      'application/octet-stream',
      'bad-workplace-report.hwpx',
    );
  };

  await context.route('**/api/safety/**', handleErpSafetyRoute);
  await context.route('**/api/v1/**', handleErpSafetyRoute);
  await context.route('**/api/reports/**', handlePublicReportApiRoute);
  await context.route('**/api/documents/quarterly/**', handleQuarterlyDocumentRoute);
  await context.route('**/api/documents/bad-workplace/**', handleBadWorkplaceDocumentRoute);
}

export async function createErpSmokeHarness(
  featureId: FeatureContractId,
  config: ClientSmokePlaywrightConfig,
): Promise<ErpSmokeHarness> {
  const state = createInitialState();
  const helpers = createRouteHelpers(state);
  const requestCounts = new Map<string, number>();
  const delayedReportListRequests = new Set<string>();
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMoMs,
  });
  const context = await browser.newContext({ viewport: config.viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(config.navigationTimeoutMs);

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !isExpectedConsoleError(message.text())) {
      consoleErrors.push(message.text());
    }
  });

  const harness: ErpSmokeHarness = {
    baseURL: config.baseURL,
    browser,
    config,
    consoleErrors,
    context,
    contract: getFeatureContract(featureId),
    delayedReportListRequests,
    helpers,
    page,
    pageErrors,
    requestCounts,
    state,
    assertContractApisObserved() {
      for (const requestKey of harness.contract.apis) {
        assert.ok(
          (requestCounts.get(requestKey) || 0) > 0,
          `Expected contract API to be observed: ${requestKey}`,
        );
      }
    },
    assertNoClientErrors() {
      assert.equal(pageErrors.length, 0, `Browser page errors: ${pageErrors.join(' | ')}`);
      assert.equal(consoleErrors.length, 0, `Browser console errors: ${consoleErrors.join(' | ')}`);
    },
    async close() {
      await browser.close();
    },
    async loginAs(email: string, password = 'smoke-password') {
      await harness.waitForLoginPanel();
      await page.evaluate(
        ({ nextEmail, nextPassword }) => {
          const emailInput = document.querySelector('input[type="email"]');
          const passwordInput = document.querySelector('input[type="password"]');
          if (!(emailInput instanceof HTMLInputElement) || !(passwordInput instanceof HTMLInputElement)) {
            throw new Error('로그인 입력 필드를 찾지 못했습니다.');
          }

          const valueSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )?.set;
          if (!valueSetter) {
            throw new Error('로그인 입력 값 setter를 찾지 못했습니다.');
          }

          valueSetter.call(emailInput, nextEmail);
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));

          valueSetter.call(passwordInput, nextPassword);
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

          const form = emailInput.form ?? passwordInput.form ?? document.querySelector('form');
          if (!(form instanceof HTMLFormElement)) {
            throw new Error('로그인 form을 찾지 못했습니다.');
          }

          form.requestSubmit();
        },
        { nextEmail: email, nextPassword: password },
      );
    },
    async logoutToLoginPanel() {
      await context.clearCookies();
      await page.goto(config.baseURL, { waitUntil: 'load' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload({ waitUntil: 'load' });
      await harness.waitForLoginPanel();
    },
    async waitForCondition(check: () => Promise<boolean>, failureMessage: string) {
      const deadline = Date.now() + config.testTimeoutMs;
      while (Date.now() < deadline) {
        if (await check()) {
          return;
        }
        await page.waitForTimeout(100);
      }

      assert.fail(failureMessage);
    },
    async waitForLoginPanel() {
      await page.locator('input[type="email"]').waitFor({ state: 'visible' });
      await page.locator('input[type="password"]').waitFor({ state: 'visible' });
      await page.locator('button[type="submit"]').waitFor({ state: 'visible' });
    },
    async waitForRequestCount(requestKey: string, minimumCount: number) {
      const deadline = Date.now() + config.testTimeoutMs;
      while (Date.now() < deadline) {
        if ((requestCounts.get(requestKey) || 0) >= minimumCount) {
          return;
        }
        await page.waitForTimeout(100);
      }

      assert.fail(`Expected at least ${minimumCount} request(s) for ${requestKey}.`);
    },
  };

  await installErpRoutes(harness);
  return harness;
}

export function getQuarterlySmokeQuarterKey() {
  const quarterKey =
    getQuarterTargetsForConstructionPeriod('2026-01-01 ~ 2026-06-30')[0]?.quarterKey ?? null;
  assert.ok(quarterKey, '현장 분기 키를 계산하지 못했습니다.');
  return quarterKey;
}
