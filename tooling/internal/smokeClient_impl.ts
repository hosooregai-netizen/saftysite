/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createInspectionSession, createInspectionSite } from '../../constants/inspectionSession/sessionFactory.ts';
import {
  BAD_WORKPLACE_REPORT_KIND,
  getQuarterTargetsForConstructionPeriod,
  QUARTERLY_SUMMARY_REPORT_KIND,
  TECHNICAL_GUIDANCE_REPORT_KIND,
} from '../../lib/erpReports/shared.ts';

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
  siteWorkers: JsonRecord[];
  workerMobileSessions: JsonRecord[];
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
  if (pathname === '/reports/upsert') return '/reports/upsert';
  if (pathname === '/content-items/assets/upload') return '/content-items/assets/upload';
  if (pathname === '/site-workers/import') return '/site-workers/import';

  return pathname
    .replace(/\/users\/[^/]+\/password$/, '/users/:id/password')
    .replace(/\/mobile\/session\/[^/]+\/acknowledge$/, '/mobile/session/:token/acknowledge')
    .replace(/\/mobile\/session\/[^/]+$/, '/mobile/session/:token')
    .replace(/\/users\/[^/]+$/, '/users/:id')
    .replace(/\/worker-mobile-sessions\/[^/]+\/revoke$/, '/worker-mobile-sessions/:id/revoke')
    .replace(/\/site-workers\/[^/]+\/mobile-sessions$/, '/site-workers/:id/mobile-sessions')
    .replace(/\/site-workers\/[^/]+\/mobile-session$/, '/site-workers/:id/mobile-session')
    .replace(/\/site-workers\/[^/]+\/block$/, '/site-workers/:id/block')
    .replace(/\/site-workers\/[^/]+$/, '/site-workers/:id')
    .replace(/\/reports\/site\/[^/]+\/draft-context$/, '/reports/site/:id/draft-context')
    .replace(/\/reports\/site\/[^/]+\/full$/, '/reports/site/:id/full')
    .replace(/\/reports\/by-key\/[^/]+$/, '/reports/by-key/:id')
    .replace(/\/reports\/[^/]+\/status$/, '/reports/:id/status')
    .replace(/\/reports\/[^/]+$/, '/reports/:id')
    .replace(/\/sites\/[^/]+\/dashboard$/, '/sites/:id/dashboard')
    .replace(/\/headquarters\/[^/]+$/, '/headquarters/:id')
    .replace(/\/sites\/[^/]+$/, '/sites/:id')
    .replace(/\/assignments\/me\/sites$/, '/assignments/me/sites')
    .replace(/\/assignments\/[^/]+$/, '/assignments/:id')
    .replace(/\/content-items\/[^/]+$/, '/content-items/:id');
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
    document_kind: report.meta?.documentKind ?? null,
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

function createSeedErpReport(
  id: string,
  siteId: string,
  documentKind: string,
  reportTitle: string,
  payload: JsonRecord,
  options: {
    status?: 'draft' | 'submitted' | 'published';
    updatedAt?: string;
    submittedAt?: string | null;
  } = {}
): JsonRecord {
  const status = options.status ?? 'submitted';
  const updatedAt = options.updatedAt ?? NOW;
  const submittedAt =
    options.submittedAt ?? (status === 'submitted' || status === 'published' ? updatedAt : null);

  return {
    id,
    report_key: id,
    report_title: reportTitle,
    site_id: siteId,
    headquarter_id: 'hq-1',
    assigned_user_id: 'field-1',
    visit_date: updatedAt.slice(0, 10),
    visit_round: null,
    total_round: null,
    progress_rate: null,
    status,
    payload_version: 1,
    latest_revision_no: 1,
    submitted_at: submittedAt,
    published_at: status === 'published' ? updatedAt : null,
    last_autosaved_at: updatedAt,
    document_kind: documentKind,
    meta: {
      documentKind,
      siteName: '기존 현장',
    },
    created_at: updatedAt,
    updated_at: updatedAt,
    payload,
  };
}

function getTokenForUser(userId: string): string {
  return `token-${userId}`;
}

const MOBILE_ACK_KINDS = ['hazard_notice', 'tbm', 'safety_education'] as const;
const MOBILE_ACK_LABELS: Record<(typeof MOBILE_ACK_KINDS)[number], string> = {
  hazard_notice: '오늘 공지',
  tbm: 'TBM',
  safety_education: '안전 교육',
};
const MOBILE_ACK_FIELDS: Record<(typeof MOBILE_ACK_KINDS)[number], string> = {
  hazard_notice: 'latest_hazard_notice_ack_at',
  tbm: 'latest_tbm_ack_at',
  safety_education: 'latest_education_ack_at',
};

function getWorkerAckExemptions(worker: JsonRecord): string[] {
  return Array.isArray(worker.ack_exemptions)
    ? worker.ack_exemptions.filter((value): value is string => typeof value === 'string')
    : [];
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
        content_type: 'tbm_template',
        title: '외부 비계 TBM 템플릿',
        code: 'TBM-001',
        body: '작업 전 추락방지시설 확인\n낙하물 방지 정리정돈\n안전대 걸이 상태 점검',
        tags: ['tbm'],
        sort_order: 0,
        effective_from: null,
        effective_to: null,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'content-2',
        content_type: 'notice_template',
        title: '현장 공지 기본 템플릿',
        code: 'NOTICE-001',
        body: '위험 구간 진입 전 보호구 확인\n작업구간 정리정돈 유지',
        tags: ['notice'],
        sort_order: 0,
        effective_from: null,
        effective_to: null,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'content-3',
        content_type: 'education_template',
        title: '안전교육 기본 템플릿',
        code: 'EDU-001',
        body: '당일 주요 위험요인 공유\n보호구 착용 기준 재안내',
        tags: ['education'],
        sort_order: 0,
        effective_from: null,
        effective_to: null,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    reports: [
      createSeedTechnicalGuidanceReport(),
      createSeedErpReport(
        'erp-notice-1',
        'site-1',
        'hazard_notice',
        '기존 현장 위험 공지 2026-03-28',
        {
          title: '외부 비계 작업 전 공지',
          content: '비계 작업구간 진입 전 추락방지시설 상태를 반드시 확인합니다.',
          targetTrades: ['비계', '철근'],
          effectiveFrom: '2026-03-28',
          effectiveTo: '2026-03-29',
          noticeItems: ['추락위험 구간 통제', '낙하물 방지망 재점검'],
          mobileAcknowledgements: [],
        },
        { updatedAt: '2026-03-28T08:30:00+09:00' }
      ),
      createSeedErpReport(
        'erp-tbm-1',
        'site-1',
        'tbm',
        '기존 현장 TBM 2026-03-28',
        {
          topic: '외부 비계 설치 작업',
          riskFactors: ['작업발판 미고정', '낙하물 위험'],
          countermeasures: ['안전난간 확인', '공구 낙하방지줄 사용'],
          signatures: [{ name: '홍근로', company_name: '테스트건설', signed_at: NOW }],
          mobileAcknowledgements: [
            {
              worker_id: 'worker-1',
              worker_name: '홍근로',
              kind: 'tbm',
              signature_name: '홍근로',
              signature_data: 'https://example.com/signatures/hong-worker.png',
              note: 'TBM 확인 완료',
              acknowledged_at: NOW,
            },
          ],
        },
        { updatedAt: '2026-03-28T07:50:00+09:00' }
      ),
      createSeedErpReport(
        'erp-education-1',
        'site-1',
        'safety_education',
        '기존 현장 안전교육 2026-03-28',
        {
          educationName: '외부 비계 작업 전 특별교육',
          materialSummary: '추락방지와 보호구 착용 기준을 재교육합니다.',
          agenda: ['추락 위험 구간 확인', '보호구 착용 기준'],
          signatures: [],
          mobileAcknowledgements: [],
        },
        { updatedAt: '2026-03-28T09:10:00+09:00' }
      ),
      createSeedErpReport(
        'erp-work-1',
        'site-1',
        'safety_work_log',
        '기존 현장 작업일지 2026-03-28',
        {
          workerCount: 12,
          mainTasks: ['외부 비계 설치', '자재 반입 정리'],
          issues: ['비계 발판 고정 상태 재점검 필요'],
          photos: [],
        },
        { updatedAt: '2026-03-28T17:20:00+09:00' }
      ),
      createSeedErpReport(
        'erp-inspection-1',
        'site-1',
        'safety_inspection_log',
        '기존 현장 점검일지 2026-03-28',
        {
          checklist: [
            { item: '비계 작업구간 정리정돈', status: 'warning', note: '자재 적치 재정리 필요' },
            { item: '보호구 착용 상태', status: 'action_required', note: '안전대 미체결자 발견' },
          ],
          actions: ['안전대 체결 재교육', '자재 적치구역 재정비'],
          photos: [],
        },
        { updatedAt: '2026-03-28T16:40:00+09:00' }
      ),
    ],
    siteWorkers: [
      {
        id: 'worker-1',
        site_id: 'site-1',
        name: '홍근로',
        phone: '010-5555-1111',
        company_name: '테스트건설',
        trade: '비계',
        employment_type: 'daily',
        is_blocked: false,
        special_access: null,
        ppe_issues: [],
        ack_exemptions: [],
        latest_attendance_at: NOW,
        latest_hazard_notice_ack_at: null,
        latest_tbm_ack_at: NOW,
        latest_education_ack_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'worker-2',
        site_id: 'site-1',
        name: '김신규',
        phone: '010-5555-2222',
        company_name: '테스트건설',
        trade: '철근',
        employment_type: 'daily',
        is_blocked: false,
        special_access: null,
        ppe_issues: [],
        ack_exemptions: [],
        latest_attendance_at: NOW,
        latest_hazard_notice_ack_at: null,
        latest_tbm_ack_at: null,
        latest_education_ack_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'worker-3',
        site_id: 'site-1',
        name: '이제외',
        phone: '010-5555-3333',
        company_name: '테스트건설',
        trade: '비계',
        employment_type: 'daily',
        is_blocked: false,
        special_access: null,
        ppe_issues: [],
        ack_exemptions: ['tbm'],
        latest_attendance_at: NOW,
        latest_hazard_notice_ack_at: null,
        latest_tbm_ack_at: null,
        latest_education_ack_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    workerMobileSessions: [
      {
        id: 'mobile-session-1',
        worker_id: 'worker-1',
        site_id: 'site-1',
        token: 'worker-session-1',
        entry_url: '/m/worker-session-1',
        expires_at: '2026-03-30T23:59:00+09:00',
        revoked_at: null,
        issued_by: 'field-1',
        created_at: NOW,
      },
      {
        id: 'mobile-session-2',
        worker_id: 'worker-3',
        site_id: 'site-1',
        token: 'worker-session-3',
        entry_url: '/m/worker-session-3',
        expires_at: '2026-03-30T23:59:00+09:00',
        revoked_at: null,
        issued_by: 'field-1',
        created_at: NOW,
      },
      {
        id: 'mobile-session-2',
        worker_id: 'worker-3',
        site_id: 'site-1',
        token: 'worker-session-2',
        entry_url: '/m/worker-session-2',
        expires_at: '2026-03-30T23:59:00+09:00',
        revoked_at: null,
        issued_by: 'field-1',
        created_at: NOW,
      },
    ],
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

  function getSiteWorker(workerId: string) {
    return state.siteWorkers.find((worker) => String(worker.id) === workerId) || null;
  }

  function getReportById(reportId: string) {
    return state.reports.find((report) => String(report.id) === reportId) || null;
  }

  function getDocumentKind(report: JsonRecord | null | undefined) {
    const meta = report?.meta;
    if (!meta || typeof meta !== 'object') return null;
    return String(meta.documentKind || '') || null;
  }

  function getLatestReportByKind(siteId: string, kind: string) {
    return visibleReportsForSite(siteId)
      .filter((report) => getDocumentKind(report) === kind)
      .sort((left, right) =>
        String(right.updated_at || '').localeCompare(String(left.updated_at || ''))
      )[0] || null;
  }

  function isWorkerAckTarget(worker: JsonRecord, kind: (typeof MOBILE_ACK_KINDS)[number]) {
    if (worker.is_blocked) return false;
    return !getWorkerAckExemptions(worker).includes(kind);
  }

  function listPendingAckWorkers(
    workers: JsonRecord[],
    kind: (typeof MOBILE_ACK_KINDS)[number],
    report: JsonRecord | null,
    limit?: number
  ) {
    if (!report) return [];

    const pending = workers.filter((worker) => {
      if (!isWorkerAckTarget(worker, kind)) {
        return false;
      }
      const acknowledgedAt = worker[MOBILE_ACK_FIELDS[kind]];
      return !acknowledgedAt || String(acknowledgedAt) < String(report.updated_at || '');
    });

    return typeof limit === 'number' ? pending.slice(0, limit) : pending;
  }

  function buildSiteDashboard(siteId: string) {
    const site = hydratedSites().find((item) => String(item.id) === siteId);
    assert(site, `대시보드 현장을 찾을 수 없습니다: ${siteId}`);
    const workers = state.siteWorkers.filter((worker) => String(worker.site_id) === siteId);
    const activeWorkers = workers.filter((worker) => !worker.is_blocked);
    const latestDocuments = visibleReportsForSite(siteId)
      .filter((report) => Boolean(getDocumentKind(report)))
      .sort((left, right) =>
        String(right.updated_at || '').localeCompare(String(left.updated_at || ''))
      )
      .slice(0, 6)
      .map((report) => ({
        report_id: report.id,
        report_key: report.report_key,
        report_title: report.report_title,
        document_kind: getDocumentKind(report),
        status: report.status,
        visit_date: report.visit_date ?? null,
        updated_at: report.updated_at ?? null,
      }));

    const latestNotice = getLatestReportByKind(siteId, 'hazard_notice');
    const latestTbm = getLatestReportByKind(siteId, 'tbm');
    const latestEducation = getLatestReportByKind(siteId, 'safety_education');
    const latestInspection = getLatestReportByKind(siteId, 'safety_inspection_log');
    const latestPatrol = getLatestReportByKind(siteId, 'patrol_inspection_log');
    const buildPendingGroup = (kind: (typeof MOBILE_ACK_KINDS)[number], report: JsonRecord | null) => {
      const pendingWorkers = listPendingAckWorkers(workers, kind, report, 5);
      return {
        kind,
        label: MOBILE_ACK_LABELS[kind],
        count: listPendingAckWorkers(workers, kind, report).length,
        excluded_count: activeWorkers.filter((worker) =>
          getWorkerAckExemptions(worker).includes(kind)
        ).length,
        report_id: report?.id ?? null,
        report_title: report?.report_title ?? null,
        report_updated_at: report?.updated_at ?? null,
        workers: pendingWorkers.map((worker) => ({
          worker_id: worker.id,
          name: worker.name,
          phone: worker.phone ?? null,
          company_name: worker.company_name ?? null,
          trade: worker.trade ?? null,
        })),
      };
    };

    const incompleteInspectionCount = [latestInspection, latestPatrol].filter(Boolean).length;

    return {
      site,
      registered_worker_count: activeWorkers.length,
      blocked_worker_count: workers.filter((worker) => worker.is_blocked).length,
      unacknowledged_notice_count: listPendingAckWorkers(workers, 'hazard_notice', latestNotice).length,
      unsigned_tbm_count: listPendingAckWorkers(workers, 'tbm', latestTbm).length,
      incomplete_education_count: listPendingAckWorkers(workers, 'safety_education', latestEducation).length,
      incomplete_inspection_document_count: incompleteInspectionCount,
      latest_documents: latestDocuments,
      pending_mobile_ack_groups: [
        buildPendingGroup('hazard_notice', latestNotice),
        buildPendingGroup('tbm', latestTbm),
        buildPendingGroup('safety_education', latestEducation),
      ],
    };
  }

  function buildDraftContext(siteId: string, documentKind: string, excludeReportId?: string | null) {
    const reports = visibleReportsForSite(siteId)
      .filter((report) => String(report.id) !== String(excludeReportId || ''))
      .filter((report) => Boolean(getDocumentKind(report)))
      .sort((left, right) =>
        String(right.updated_at || '').localeCompare(String(left.updated_at || ''))
      );
    const previousDocument = reports.find((report) => getDocumentKind(report) === documentKind) || null;
    const unresolvedSourceReports = reports.filter((report) =>
      ['safety_work_log', 'safety_inspection_log', 'patrol_inspection_log'].includes(
        String(getDocumentKind(report))
      )
    );
    const unresolvedItems = unresolvedSourceReports.flatMap((report) => {
      const kind = getDocumentKind(report);
      const payload = report.payload && typeof report.payload === 'object' ? report.payload : {};
      if (kind === 'safety_work_log') {
        return Array.isArray(payload.issues)
          ? payload.issues.map((item) => `${report.report_title}: ${item}`)
          : [];
      }
      const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
      const actions = Array.isArray(payload.actions) ? payload.actions : [];
      return [
        ...checklist
          .filter((item) => item && item.status !== 'good')
          .map((item) => `${report.report_title}: ${item.item}`),
        ...actions.map((item) => `${report.report_title} 조치: ${item}`),
      ];
    });
    const templateItems = state.contentItems
      .filter((item) => {
        if (documentKind === 'tbm') return item.content_type === 'tbm_template';
        if (documentKind === 'safety_education') return item.content_type === 'education_template';
        return item.content_type === 'notice_template';
      })
      .flatMap((item) =>
        typeof item.body === 'string' ? item.body.split('\n').filter(Boolean) : []
      )
      .slice(0, 10);
    const recentPayload =
      previousDocument?.payload && typeof previousDocument.payload === 'object'
        ? clone(previousDocument.payload)
        : {};
    const unresolvedPayload =
      documentKind === 'safety_work_log'
        ? {
            workerCount: null,
            mainTasks: [],
            issues: unresolvedItems,
            photos: [],
          }
        : documentKind === 'safety_inspection_log' || documentKind === 'patrol_inspection_log'
          ? {
              checklist: unresolvedItems.map((item) => ({
                item,
                status: 'action_required',
                note: '',
              })),
              actions: unresolvedItems,
              photos: [],
            }
          : {};
    const workers = state.siteWorkers.filter((worker) => String(worker.site_id) === siteId);
    return {
      site_id: siteId,
      document_kind: documentKind,
      previous_document: previousDocument
        ? {
            report: toReportListItem(previousDocument),
            summary_items: [],
          }
        : null,
      recent_documents: reports.slice(0, 6).map((report) => ({
        report: toReportListItem(report),
        summary_items: [],
      })),
      recent_payload: recentPayload,
      unresolved_items: unresolvedItems,
      unresolved_payload: unresolvedPayload,
      template_items: templateItems,
      worker_summary: {
        registered_count: workers.length,
        active_count: workers.filter((worker) => !worker.is_blocked).length,
        trade_names: workers.map((worker) => worker.trade).filter(Boolean),
        company_names: workers.map((worker) => worker.company_name).filter(Boolean),
        worker_names: workers.map((worker) => worker.name).filter(Boolean),
        employment_breakdown: { daily: workers.length },
      },
    };
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
      document_kind:
        typeof body.document_kind === 'string'
          ? body.document_kind
          : typeof existing?.document_kind === 'string'
            ? existing.document_kind
            : typeof meta.documentKind === 'string'
              ? meta.documentKind
              : null,
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

  function updateReportStatus(reportId: string, body: JsonRecord) {
    const report = getReportById(reportId);
    assert(report, `상태 변경 대상 보고서를 찾을 수 없습니다: ${reportId}`);
    const nextStatus = String(body.status || report.status);
    Object.assign(report, {
      status: nextStatus,
      updated_at: NOW,
      last_autosaved_at: report.last_autosaved_at ?? NOW,
      submitted_at:
        nextStatus === 'submitted' || nextStatus === 'published'
          ? report.submitted_at ?? NOW
          : null,
      published_at: nextStatus === 'published' ? NOW : report.published_at ?? null,
    });
    return report;
  }

  function getMobileSession(token: string) {
    return state.workerMobileSessions.find((session) => String(session.token) === token) || null;
  }

  function serializeWorkerMobileSession(session: JsonRecord, worker?: JsonRecord | null) {
    const now = NOW;
    const revokedAt = session.revoked_at ?? null;
    const expiresAt = String(session.expires_at || '');
    const isExpired = expiresAt !== '' && expiresAt < now;
    const status = revokedAt
      ? 'revoked'
      : worker?.is_blocked
        ? 'blocked'
        : isExpired
          ? 'expired'
          : 'active';

    return {
      ...session,
      entry_url: `/m/${session.token}`,
      status,
    };
  }

  function listSiteWorkers(siteId?: string | null, blockedOnly = false) {
    return state.siteWorkers.filter((worker) => {
      if (siteId && String(worker.site_id) !== String(siteId)) return false;
      if (blockedOnly && !worker.is_blocked) return false;
      return true;
    });
  }

  function createSiteWorkerRecord(siteId: string, overrides: JsonRecord = {}) {
    const id = `worker-${state.siteWorkers.length + 1}`;
    const created = {
      id,
      site_id: siteId,
      name: 'CSV 근로자',
      phone: '010-7777-1234',
      company_name: 'CSV건설',
      trade: '철근',
      employment_type: 'daily',
      is_blocked: false,
      special_access: null,
      ppe_issues: [],
      ack_exemptions: [],
      latest_attendance_at: null,
      latest_hazard_notice_ack_at: null,
      latest_tbm_ack_at: null,
      latest_education_ack_at: null,
      created_at: NOW,
      updated_at: NOW,
      ...overrides,
    };
    state.siteWorkers.unshift(created);
    return created;
  }

  function createWorkerMobileSessionRecord(workerId: string) {
    const worker = getSiteWorker(workerId);
    assert(worker, `모바일 세션 발급 대상 근로자가 없습니다: ${workerId}`);
    const created = {
      id: `mobile-session-${state.workerMobileSessions.length + 1}`,
      worker_id: workerId,
      site_id: worker.site_id,
      token: `worker-session-${state.workerMobileSessions.length + 1}`,
      entry_url: `/m/worker-session-${state.workerMobileSessions.length + 1}`,
      expires_at: '2026-03-31T23:59:00+09:00',
      revoked_at: null,
      issued_by: 'field-1',
      created_at: NOW,
      updated_at: NOW,
    };
    state.workerMobileSessions.unshift(created);
    return serializeWorkerMobileSession(created, worker);
  }

  function listWorkerMobileSessions(workerId: string) {
    const worker = getSiteWorker(workerId);
    assert(worker, `모바일 세션 이력 대상 근로자가 없습니다: ${workerId}`);
    return state.workerMobileSessions
      .filter((session) => String(session.worker_id) === workerId)
      .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))
      .map((session) => serializeWorkerMobileSession(session, worker));
  }

  function revokeWorkerMobileSession(sessionId: string) {
    const session = state.workerMobileSessions.find((item) => String(item.id) === sessionId);
    assert(session, `강제 만료 대상 세션이 없습니다: ${sessionId}`);
    session.revoked_at = NOW;
    session.updated_at = NOW;
    const worker = getSiteWorker(String(session.worker_id));
    return serializeWorkerMobileSession(session, worker);
  }

  function buildMobileSessionDetail(token: string) {
    const session = getMobileSession(token);
    assert(session, `모바일 세션을 찾을 수 없습니다: ${token}`);
    const worker = getSiteWorker(String(session.worker_id));
    assert(worker, `모바일 세션 근로자를 찾을 수 없습니다: ${token}`);
    const site = hydratedSites().find((item) => String(item.id) === String(session.site_id));
    assert(site, `모바일 세션 현장을 찾을 수 없습니다: ${token}`);
    const tasks = MOBILE_ACK_KINDS.map((kind) => {
      const report = getLatestReportByKind(String(session.site_id), kind);
      const label = MOBILE_ACK_LABELS[kind];
      if (!isWorkerAckTarget(worker, kind)) {
        return {
          kind,
          label,
          status: 'not_available',
          availability_reason: 'excluded',
          report_id: report?.id ?? null,
          report_title: report?.report_title ?? null,
          report_updated_at: report?.updated_at ?? null,
          completed_at: null,
          note: '오늘 확인 대상에서 제외되었습니다.',
        };
      }

      if (!report) {
        return {
          kind,
          label,
          status: 'not_available',
          availability_reason: 'missing_document',
          report_id: null,
          report_title: null,
          report_updated_at: null,
          completed_at: null,
          note: '오늘 확인할 문서가 없습니다.',
        };
      }

      const ackAt = worker[MOBILE_ACK_FIELDS[kind]] ?? null;
      const completed = ackAt && String(ackAt) >= String(report.updated_at || '');
      return {
        kind,
        label,
        status: completed ? 'completed' : 'pending',
        availability_reason: null,
        report_id: report.id,
        report_title: report.report_title,
        report_updated_at: report.updated_at ?? null,
        completed_at: completed ? ackAt : null,
        note: completed ? '확인 완료' : '확인 후 서명을 제출해 주세요.',
      };
    });

    return {
      session,
      worker,
      site: {
        id: site.id,
        site_name: site.site_name,
        headquarter_id: site.headquarter_id ?? null,
      },
      tasks,
    };
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
    buildDraftContext,
    buildMobileSessionDetail,
    buildSiteDashboard,
    createSiteWorkerRecord,
    createWorkerMobileSessionRecord,
    getUserForToken,
    getReportById,
    listSiteWorkers,
    listWorkerMobileSessions,
    revokeWorkerMobileSession,
    hydratedAssignments,
    hydratedSites,
    updateReportStatus,
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
  const isExpectedConsoleError = (text: string) =>
    text.includes('status of 401') || text.includes('Failed to load resource');

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !isExpectedConsoleError(message.text())) {
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
  await page.getByText('관리자 운영 개요').waitFor({ state: 'visible' });
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
  await waitForRequestCount('GET /reports', adminReportListBefore + 1);
  await page.locator('a[href="/sessions/report-tech-1"]').first().waitFor({ state: 'visible' });

  console.log('Step: content CRUD');
  await openSection('콘텐츠');
  await page.getByRole('button', { name: '콘텐츠 추가' }).click();
  const contentCreateDialog = page.getByRole('dialog', { name: '콘텐츠 추가' });
  await contentCreateDialog.getByLabel('콘텐츠 유형').selectOption('legal_reference');
  await contentCreateDialog.getByLabel('제목').fill('테스트 법령');
  await contentCreateDialog.getByLabel('코드').fill('LAW-TEST');
  await contentCreateDialog.getByLabel('법령 본문').fill('현장 점검용 법령 본문 테스트');
  await contentCreateDialog
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'guide.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
    });
  await contentCreateDialog.getByText('guide.pdf').waitFor({ state: 'visible' });
  await contentCreateDialog.getByRole('button', { name: '생성' }).click();
  await expectRowText('테스트 법령');

  row = page.locator('tr', { hasText: '테스트 법령' }).first();
  await row.getByRole('button', { name: '수정' }).click();
  const contentEditDialog = page.getByRole('dialog', { name: '콘텐츠 수정' });
  await contentEditDialog.getByLabel('제목').fill('테스트 법령 수정');
  await contentEditDialog.getByRole('button', { name: '저장' }).click();
  await expectRowText('테스트 법령 수정');

  row = page.locator('tr', { hasText: '테스트 법령 수정' }).first();
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
    state.contentItems.find((item) => item.title === '테스트 법령 수정')?.is_active,
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
  const isExpectedConsoleError = (text: string) =>
    text.includes('status of 401') || text.includes('Failed to load resource');

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !isExpectedConsoleError(message.text())) {
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

    if (pathname === '/site-workers' && request.method() === 'GET') {
      const siteId = url.searchParams.get('site_id');
      const blockedOnly = url.searchParams.get('blocked_only') === 'true';
      await fulfillJson(clone(helpers.listSiteWorkers(siteId, blockedOnly)));
      return;
    }

    if (normalizedPath === '/site-workers/import' && request.method() === 'POST') {
      const created = helpers.createSiteWorkerRecord('site-1');
      await fulfillJson({
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
      await fulfillJson({
        path: '/content-items/assets/mock-photo.png',
        file_name: 'mock-photo.png',
        content_type: 'image/png',
        size: 1024,
      });
      return;
    }

    if (normalizedPath === '/sites/:id' && request.method() === 'GET') {
      const siteId = pathname.split('/').pop() || '';
      const site = helpers.hydratedSites().find((item) => String(item.id) === siteId);
      assert(site, `Missing site fixture: ${siteId}`);
      await fulfillJson(clone(site));
      return;
    }

    if (normalizedPath === '/sites/:id/dashboard' && request.method() === 'GET') {
      const siteId = pathname.split('/')[2];
      await fulfillJson(clone(helpers.buildSiteDashboard(siteId)));
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

    if (normalizedPath === '/reports/site/:id/draft-context' && request.method() === 'GET') {
      const siteId = pathname.split('/')[3];
      const documentKind = url.searchParams.get('document_kind') || 'tbm';
      const excludeReportId = url.searchParams.get('exclude_report_id');
      await fulfillJson(clone(helpers.buildDraftContext(siteId, documentKind, excludeReportId)));
      return;
    }

    if (normalizedPath === '/reports/by-key/:id' && request.method() === 'GET') {
      const reportKey = decodeURIComponent(pathname.split('/').pop() || '');
      const report = state.reports.find(
        (item) => String(item.report_key) === reportKey && String(item.status) !== 'archived',
      );
      assert(report, `Missing detailed report fixture: ${reportKey}`);
      await fulfillJson(clone(report));
      return;
    }

    if (normalizedPath === '/reports/:id' && request.method() === 'GET') {
      const reportId = decodeURIComponent(pathname.split('/').pop() || '');
      const report = helpers.getReportById(reportId);
      assert(report, `Missing ERP report fixture: ${reportId}`);
      await fulfillJson(clone(report));
      return;
    }

    if (normalizedPath === '/site-workers/:id/mobile-sessions' && request.method() === 'GET') {
      const workerId = pathname.split('/')[2] || '';
      await fulfillJson(clone(helpers.listWorkerMobileSessions(workerId)));
      return;
    }

    if (normalizedPath === '/site-workers/:id/mobile-session' && request.method() === 'POST') {
      const workerId = pathname.split('/')[2] || '';
      await fulfillJson(clone(helpers.createWorkerMobileSessionRecord(workerId)));
      return;
    }

    if (normalizedPath === '/worker-mobile-sessions/:id/revoke' && request.method() === 'POST') {
      const sessionId = pathname.split('/')[2] || '';
      await fulfillJson(clone(helpers.revokeWorkerMobileSession(sessionId)));
      return;
    }

    if (normalizedPath === '/site-workers/:id' && request.method() === 'PATCH') {
      const workerId = pathname.split('/')[2] || '';
      const body = request.postDataJSON?.() as JsonRecord;
      const worker =
        state.siteWorkers.find((item) => String(item.id) === workerId) ?? null;
      assert(worker, `Missing site worker fixture: ${workerId}`);
      Object.assign(worker, body, { updated_at: NOW });
      await fulfillJson(clone(worker));
      return;
    }

    if (normalizedPath === '/site-workers/:id/block' && request.method() === 'POST') {
      const workerId = pathname.split('/')[2] || '';
      const body = request.postDataJSON?.() as JsonRecord;
      const worker =
        state.siteWorkers.find((item) => String(item.id) === workerId) ?? null;
      assert(worker, `Missing site worker fixture for block toggle: ${workerId}`);
      worker.is_blocked = Boolean(body.is_blocked);
      worker.updated_at = NOW;
      await fulfillJson(clone(worker));
      return;
    }

    if (pathname === '/reports/upsert' && request.method() === 'POST') {
      const body = request.postDataJSON?.() as JsonRecord;
      await fulfillJson(clone(helpers.upsertReport(body)));
      return;
    }

    if (normalizedPath === '/reports/:id/status' && request.method() === 'POST') {
      const reportId = decodeURIComponent(pathname.split('/')[2] || '');
      const body = request.postDataJSON?.() as JsonRecord;
      await fulfillJson(clone(helpers.updateReportStatus(reportId, body)));
      return;
    }

    if (normalizedPath === '/mobile/session/:token' && request.method() === 'GET') {
      const tokenValue = pathname.split('/').pop() || '';
      const session = state.workerMobileSessions.find(
        (item) => String(item.token) === tokenValue
      );
      assert(session, `Missing mobile session fixture: ${tokenValue}`);
      const worker =
        state.siteWorkers.find((item) => String(item.id) === String(session.worker_id)) ?? null;
      assert(worker, `Missing mobile worker fixture: ${tokenValue}`);
      if (session.revoked_at) {
        await fulfillJson(
          {
            detail:
              '모바일 링크가 관리자에 의해 만료되었습니다. 현장 관리직에게 다시 발급을 요청해 주세요.',
          },
          401
        );
        return;
      }
      if (!session.expires_at || String(session.expires_at) <= NOW) {
        await fulfillJson(
          {
            detail:
              '모바일 링크 사용 시간이 종료되었습니다. 현장 관리직에게 다시 발급을 요청해 주세요.',
          },
          401
        );
        return;
      }
      if (worker.is_blocked) {
        await fulfillJson(
          {
            detail:
              '차단된 출입자는 모바일 링크에 접근할 수 없습니다. 현장 관리직에게 확인해 주세요.',
          },
          403
        );
        return;
      }
      await fulfillJson(clone(helpers.buildMobileSessionDetail(tokenValue)));
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

  async function waitForCondition(check: () => Promise<boolean>, failureMessage: string) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await check()) {
        return;
      }
      await page.waitForTimeout(100);
    }

    assert.fail(failureMessage);
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

  console.log('ERP smoke: open admin login page');
  await page.goto(`${BASE_URL}/admin?section=overview`, { waitUntil: 'load' });
  await waitForLoginPanel();

  console.log('ERP smoke: admin overview wording');
  await loginAs('admin@example.com');
  await waitForRequestCount('GET /users', 1);
  await waitForRequestCount('GET /headquarters', 1);
  await waitForRequestCount('GET /assignments', 1);
  await page.getByText('관리자 운영 개요').waitFor({ state: 'visible' });
  const adminVisibleText = await page.evaluate(() => document.body.innerText || '');
  assert.equal(
    adminVisibleText.includes('분기 누락'),
    false,
    '관리자 overview에 레거시 분기 문구가 남아 있습니다.'
  );
  assert.equal(
    adminVisibleText.includes('월간 신고'),
    false,
    '관리자 overview에 레거시 월간 신고 문구가 남아 있습니다.'
  );
  assert.equal(
    adminVisibleText.includes('불량사업장'),
    false,
    '관리자 overview에 레거시 불량사업장 문구가 남아 있습니다.'
  );

  console.log('ERP smoke: worker home to site dashboard');
  await logoutToLoginPanel();
  const fieldAssignmentsBefore = requestCounts.get('GET /assignments/me/sites') || 0;
  const reportListReadsBefore = requestCounts.get('GET /reports') || 0;
  const draftContextReadsBefore = requestCounts.get('GET /reports/site/:id/draft-context') || 0;
  const reportWritesBefore = requestCounts.get('POST /reports/upsert') || 0;
  const reportStatusWritesBefore = requestCounts.get('POST /reports/:id/status') || 0;
  const photoUploadsBefore = requestCounts.get('POST /content-items/assets/upload') || 0;
  const workerListReadsBefore = requestCounts.get('GET /site-workers') || 0;
  const workerImportWritesBefore = requestCounts.get('POST /site-workers/import') || 0;
  const mobileSessionCreatesBefore =
    requestCounts.get('POST /site-workers/:id/mobile-session') || 0;
  const mobileSessionRevokesBefore =
    requestCounts.get('POST /worker-mobile-sessions/:id/revoke') || 0;

  await loginAs('agent@example.com');
  await waitForRequestCount('GET /assignments/me/sites', fieldAssignmentsBefore + 1);
  await page.getByText('현장 허브').waitFor({ state: 'visible' });
  await page.locator('a[href="/sites/site-1"]').first().click();
  await page.waitForURL(/\/sites\/site-1$/);
  await page.getByText('기존 현장').first().waitFor({ state: 'visible' });

  console.log('ERP smoke: dashboard pending worker drilldown');
  const pendingPreviewSection = page.locator('section', {
    has: page.getByRole('heading', { name: '모바일 미확인 미리보기' }),
  });
  const tbmPreviewCard = pendingPreviewSection.locator('[class*="linkHistoryItem"]', {
    hasText: 'TBM',
  });
  await pendingPreviewSection.getByRole('heading', { name: '모바일 미확인 미리보기' }).waitFor({
    state: 'visible',
  });
  await tbmPreviewCard.getByText('미확인 1명').waitFor({ state: 'visible' });
  await tbmPreviewCard.getByText('제외 1명').waitFor({ state: 'visible' });
  await tbmPreviewCard.getByText('김신규 / 테스트건설 / 철근').waitFor({ state: 'visible' });
  await page.getByRole('link', { name: /TBM 미서명/ }).first().click();
  await page.waitForURL(/\/sites\/site-1\/workers\?ack=tbm&status=pending&select=pending$/);
  await waitForRequestCount('GET /site-workers', workerListReadsBefore + 1);
  await page.getByRole('heading', { name: '출입자 목록' }).waitFor({ state: 'visible' });
  await page.getByText('TBM 1명').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '미확인 인원 선택' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '미확인 링크 재발급 1명' }).waitFor({
    state: 'visible',
  });
  assert.equal(
    await page.locator('tbody tr', { hasText: '이제외' }).count(),
    0,
    'TBM 제외 근로자가 미서명 필터에 포함되었습니다.'
  );
  const pendingWorkersTableText = await page.locator('table').first().textContent();
  assert.equal(
    pendingWorkersTableText?.includes('이제외') ?? false,
    false,
    'TBM 미확인 드릴다운에 제외 대상자가 포함되었습니다.'
  );

  console.log('ERP smoke: workers import and mobile link lifecycle');
  await page.locator('input[type="file"][accept=".csv,text/csv"]').setInputFiles({
    name: 'site-workers.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      ['name,phone,company_name,trade,employment_type', 'CSV 근로자,010-7777-1234,CSV건설,철근,daily'].join(
        '\n'
      ),
      'utf8'
    ),
  });
  await waitForRequestCount('POST /site-workers/import', workerImportWritesBefore + 1);
  await page.getByRole('button', { name: '폼으로 불러오기' }).click();
  await page.getByRole('heading', { name: '출입자 등록' }).waitFor({ state: 'visible' });
  await page.locator('label', { hasText: '이름' }).locator('input').fill('');
  await page.locator('label', { hasText: '이름' }).locator('input').fill('오류 근로자');
  assert.equal(
    await page.locator('label', { hasText: '업체명' }).locator('input').inputValue(),
    '중복건설',
    'CSV 오류 행 데이터를 폼으로 불러오지 못했습니다.'
  );
  assert.equal(
    await page.locator('label', { hasText: '직종' }).locator('input').inputValue(),
    '도장',
    'CSV 오류 행 직종을 폼으로 불러오지 못했습니다.'
  );
  const mobileSessionReadsAfterImport =
    requestCounts.get('GET /site-workers/:id/mobile-sessions') || 0;
  const importedWorkerRow = page.locator('tbody tr', { hasText: 'CSV 근로자' }).first();
  await importedWorkerRow.waitFor({ state: 'visible' });
  await importedWorkerRow.getByRole('button', { name: '링크 발급' }).click();
  await waitForRequestCount(
    'POST /site-workers/:id/mobile-session',
    mobileSessionCreatesBefore + 1
  );
  await waitForRequestCount(
    'GET /site-workers/:id/mobile-sessions',
    mobileSessionReadsAfterImport + 1
  );
  const qrCardSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'QR 인쇄 카드' }),
  });
  await qrCardSection.getByRole('heading', { name: 'QR 인쇄 카드' }).waitFor({ state: 'visible' });
  await qrCardSection
    .locator('[class*="screenOnlyBlock"]')
    .getByText('CSV건설 / 철근 / 일용직')
    .waitFor({ state: 'visible' });
  const revokeButton = page.getByRole('button', { name: '강제 만료' }).first();
  await revokeButton.click();
  await waitForRequestCount(
    'POST /worker-mobile-sessions/:id/revoke',
    mobileSessionRevokesBefore + 1
  );
  await waitForCondition(
    async () => revokeButton.isDisabled(),
    '강제 만료 후 링크 버튼이 비활성화되지 않았습니다.'
  );
  const revokedSession = state.workerMobileSessions.find((item) => item.revoked_at);
  assert(revokedSession, '강제 만료된 모바일 세션 fixture를 찾을 수 없습니다.');
  await page.goto(`${BASE_URL}/m/${revokedSession.token}`, { waitUntil: 'load' });
  await page
    .getByRole('heading', { name: '이 링크는 더 이상 사용할 수 없습니다.' })
    .waitFor({ state: 'visible' });
  await page
    .getByText(
      '현장 관리직이 기존 링크를 종료했습니다. 출입 전 새 링크나 QR 카드를 다시 받아 주세요.'
    )
    .waitFor({ state: 'visible' });

  console.log('ERP smoke: open safety board');
  await page.goto(`${BASE_URL}/sites/site-1/safety`, { waitUntil: 'load' });
  await page.waitForURL(/\/sites\/site-1\/safety$/);
  await waitForRequestCount('GET /reports', reportListReadsBefore + 1);
  await page.getByRole('heading', { name: '문서 종류' }).waitFor({ state: 'visible' });

  console.log('ERP smoke: existing TBM acknowledgement warnings');
  await page.goto(`${BASE_URL}/documents/erp-tbm-1`, { waitUntil: 'load' });
  await page.getByRole('heading', { name: '모바일 확인 대상자' }).waitFor({ state: 'visible' });
  await page.getByText(/미확인 \d+명/).waitFor({ state: 'visible' });
  await page.getByText('김신규 / 010-5555-2222').waitFor({ state: 'visible' });
  const mobileSessionCreatesBeforeTbmReissue =
    requestCounts.get('POST /site-workers/:id/mobile-session') || 0;
  await page.getByRole('button', { name: '미확인 링크 재발급' }).click();
  await waitForRequestCount(
    'POST /site-workers/:id/mobile-session',
    mobileSessionCreatesBeforeTbmReissue + 2
  );
  const reissuedLinksSection = page.locator('section', {
    has: page.getByRole('heading', { name: '방금 재발급한 링크' }),
  });
  await reissuedLinksSection.getByRole('heading', { name: '방금 재발급한 링크' }).waitFor({
    state: 'visible',
  });
  await page.getByRole('button', { name: '재발급 링크 CSV' }).waitFor({ state: 'visible' });
  await reissuedLinksSection.getByText('김신규', { exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '확인 기록 CSV' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '미확인 CSV' }).waitFor({ state: 'visible' });
  const reportStatusWritesBeforeTbmFinalize =
    requestCounts.get('POST /reports/:id/status') || 0;
  await page.getByRole('button', { name: '편집 재개' }).click();
  await waitForRequestCount(
    'POST /reports/:id/status',
    reportStatusWritesBeforeTbmFinalize + 1
  );
  await page.getByRole('button', { name: '최종확정' }).click();
  const finalizeWarningDialog = page.getByRole('dialog', {
    name: '미확인 인원이 남아 있습니다.',
  });
  await finalizeWarningDialog.waitFor({ state: 'visible' });
  await finalizeWarningDialog.getByText('김신규 / 테스트건설 / 철근 / 010-5555-2222').waitFor({
    state: 'visible',
  });
  await finalizeWarningDialog.getByRole('button', { name: '그래도 최종확정' }).click();
  await waitForRequestCount(
    'POST /reports/:id/status',
    reportStatusWritesBeforeTbmFinalize + 2
  );
  await page.getByText('읽기전용', { exact: true }).waitFor({ state: 'visible' });

  console.log('ERP smoke: create prefilled work log');
  await page.goto(`${BASE_URL}/sites/site-1/safety`, { waitUntil: 'load' });
  await page.waitForURL(/\/sites\/site-1\/safety$/);
  const workLogHeading = page.getByRole('heading', { name: '안전 작업일지', level: 3 });
  await workLogHeading.waitFor({ state: 'visible' });
  const workLogCard = page.locator('article', { has: workLogHeading }).first();
  await workLogCard.getByRole('button', { name: '새 문서' }).click();
  await waitForRequestCount('GET /reports/site/:id/draft-context', draftContextReadsBefore + 1);
  await waitForRequestCount('POST /reports/upsert', reportWritesBefore + 1);
  await page.waitForURL(/\/documents\//);
  await page.getByText('초안 컨텍스트').waitFor({ state: 'visible' });

  const mainTasksTextarea = page.locator('label', { hasText: '주요 작업' }).locator('textarea');
  const issuesTextarea = page.locator('label', { hasText: '당일 이슈' }).locator('textarea');
  assert.match(
    await mainTasksTextarea.inputValue(),
    /외부 비계 설치/,
    '새 문서가 직전 작업일지 내용을 초안으로 가져오지 못했습니다.'
  );
  assert.match(
    await issuesTextarea.inputValue(),
    /비계 발판 고정 상태 재점검 필요/,
    '새 문서가 미조치 이슈를 초안으로 가져오지 못했습니다.'
  );

  console.log('ERP smoke: validation and photo upload');
  const workerCountInput = page.locator('label', { hasText: '작업 인원' }).locator('input');
  await workerCountInput.fill('');
  await page.getByRole('button', { name: '최종확정' }).click();
  await page.getByText('필수 항목을 먼저 입력한 뒤 최종확정해 주세요.').waitFor({
    state: 'visible',
  });
  await page.getByText('작업 인원을 입력해 주세요.').waitFor({ state: 'visible' });
  await workerCountInput.fill('14');
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
    name: 'inspection-photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0foAAAAASUVORK5CYII=',
      'base64'
    ),
  });
  await waitForRequestCount('POST /content-items/assets/upload', photoUploadsBefore + 1);
  await page.getByText('photo.png').waitFor({ state: 'visible' });

  console.log('ERP smoke: finalize to read only');
  const reportStatusWritesBeforeWorkLogFinalize =
    requestCounts.get('POST /reports/:id/status') || 0;
  await page.getByRole('button', { name: '최종확정' }).click();
  await waitForRequestCount(
    'POST /reports/:id/status',
    reportStatusWritesBeforeWorkLogFinalize + 1
  );
  await page.getByText('읽기전용', { exact: true }).waitFor({ state: 'visible' });
  assert.equal(
    await workerCountInput.isDisabled(),
    true,
    '최종확정 후 작업 인원 필드는 읽기전용이어야 합니다.'
  );

  console.log('ERP smoke: resume editing');
  const reportStatusWritesBeforeWorkLogResume =
    requestCounts.get('POST /reports/:id/status') || 0;
  await page.getByRole('button', { name: '편집 재개' }).click();
  await waitForRequestCount(
    'POST /reports/:id/status',
    reportStatusWritesBeforeWorkLogResume + 1
  );
  await page.getByRole('button', { name: '최종확정' }).waitFor({ state: 'visible' });
  assert.equal(
    await workerCountInput.isDisabled(),
    false,
    '편집 재개 후 작업 인원 필드는 다시 수정 가능해야 합니다.'
  );

  console.log('ERP smoke: mobile worker view');
  await page.goto(`${BASE_URL}/m/worker-session-1`, { waitUntil: 'load' });
  await page.getByText('홍근로').waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: '오늘 공지' }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'TBM' }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: '안전 교육' }).waitFor({ state: 'visible' });

  console.log('ERP smoke: excluded mobile worker view');
  await page.goto(`${BASE_URL}/m/worker-session-2`, { waitUntil: 'load' });
  await page.getByText('이제외').waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'TBM' }).waitFor({ state: 'visible' });
  await page
    .locator('section', { has: page.getByRole('heading', { name: 'TBM' }) })
    .getByText('대상 제외')
    .waitFor({ state: 'visible' });
  await page
    .locator('section', { has: page.getByRole('heading', { name: 'TBM' }) })
    .getByText('오늘 확인 대상에서 제외되었습니다.')
    .waitFor({ state: 'visible' });

  console.log('ERP smoke: mobile excluded task');
  await page.goto(`${BASE_URL}/m/worker-session-3`, { waitUntil: 'load' });
  await page.getByText('이제외').waitFor({ state: 'visible' });
  const excludedTbmCard = page.locator('section', {
    has: page.getByRole('heading', { name: 'TBM' }),
  });
  await excludedTbmCard.getByText('대상 제외').waitFor({ state: 'visible' });
  await excludedTbmCard.getByText('오늘 확인 대상에서 제외되었습니다.').waitFor({
    state: 'visible',
  });

  assert.equal(pageErrors.length, 0, `Browser page errors: ${pageErrors.join(' | ')}`);
  assert.equal(consoleErrors.length, 0, `Browser console errors: ${consoleErrors.join(' | ')}`);
  assert.ok(
    (requestCounts.get('GET /reports/site/:id/draft-context') || 0) >= draftContextReadsBefore + 1,
    '문서 생성 시 draft-context 조회가 발생하지 않았습니다.'
  );
  assert.ok(
    (requestCounts.get('POST /content-items/assets/upload') || 0) >= photoUploadsBefore + 1,
    '문서 사진 업로드 요청이 발생하지 않았습니다.'
  );
  assert.ok(
    (requestCounts.get('POST /site-workers/import') || 0) >= workerImportWritesBefore + 1,
    '출입자 CSV 등록 요청이 발생하지 않았습니다.'
  );
  assert.ok(
    (requestCounts.get('POST /site-workers/:id/mobile-session') || 0) >=
      mobileSessionCreatesBefore + 1,
    '모바일 링크 발급 요청이 발생하지 않았습니다.'
  );
  assert.ok(
    (requestCounts.get('POST /worker-mobile-sessions/:id/revoke') || 0) >=
      mobileSessionRevokesBefore + 1,
    '모바일 링크 강제 만료 요청이 발생하지 않았습니다.'
  );
  assert.ok(
    (requestCounts.get('POST /reports/:id/status') || 0) >= reportStatusWritesBefore + 2,
    '문서 최종확정/편집 재개 상태 변경 요청이 누락되었습니다.'
  );
  assert.ok(
    (requestCounts.get('GET /mobile/session/:token') || 0) >= 1,
    '모바일 세션 상세 조회가 발생하지 않았습니다.'
  );
  assert.ok(
    state.reports.some(
      (item) =>
        String(item.meta?.documentKind) === 'safety_work_log' &&
        String(item.status) === 'draft' &&
        Array.isArray(item.payload?.photos) &&
        item.payload.photos.length > 0
    ),
    '작업일지 생성/사진 업로드/편집 재개 상태가 스모크에 반영되지 않았습니다.'
  );

  await browser.close();

  return {
    requestCounts,
  };
}

export async function main() {
  console.log('Smoke test started.');
  const browserResult = await runBrowserErpSmoke();

  const summary = [...browserResult.requestCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, count]) => `${key} = ${count}`)
    .join('\n');

  console.log('Smoke test completed successfully.');
  console.log(summary);
}
