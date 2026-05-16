import {
  createInspectionSession,
  createEmptyTechnicalGuidanceRelations,
  getSessionGuidanceDate,
  getSessionProgress,
  getSessionTitle,
  mergeAdminSiteSnapshots,
  normalizeInspectionSession,
} from '@/constants/inspectionSession';
import { normalizeControllerReview } from '@/lib/admin/reportMeta';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import type {
  SafetyMasterData,
  SafetyReport,
  SafetyReportListItem,
  SafetyTechnicalGuidanceSeed,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';
import type {
  InspectionReportListItem,
  AdminSiteSnapshot,
  InspectionSession,
  InspectionSite,
  TechnicalGuidanceRelations,
} from '@/types/inspectionSession';
import { mergeMasterDataIntoSession } from './masterData';
import {
  asMapperRecord,
  normalizeMapperText,
  parsePositiveInteger,
} from './utils';

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'controller']);
const COMPLETED_DISPATCH_STATUSES = new Set(['sent', 'manual_checked']);

type DispatchCarrier = {
  dispatch?: unknown;
  dispatch_completed?: boolean | null;
  meta?: Record<string, unknown> | null;
};

function hasOwnKey(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function getExplicitDispatchStatus(dispatch: unknown): string | null {
  const record = asMapperRecord(dispatch);
  const hasCamelStatus = hasOwnKey(record, 'dispatchStatus');
  const hasSnakeStatus = hasOwnKey(record, 'dispatch_status');
  if (!hasCamelStatus && !hasSnakeStatus) {
    return null;
  }

  return normalizeMapperText(
    hasCamelStatus ? record.dispatchStatus : record.dispatch_status,
  ).toLowerCase();
}

export function resolveReportDispatchListState(report: DispatchCarrier): {
  dispatchCompleted: boolean;
  dispatchStatus: string | null;
} {
  const meta = asMapperRecord(report.meta);
  const dispatch = report.dispatch ?? meta.dispatch;
  const explicitStatus = getExplicitDispatchStatus(dispatch);

  if (explicitStatus !== null) {
    return {
      dispatchCompleted: COMPLETED_DISPATCH_STATUSES.has(explicitStatus),
      dispatchStatus: explicitStatus,
    };
  }

  return {
    dispatchCompleted: report.dispatch_completed === true,
    dispatchStatus: null,
  };
}

function mergeAdminSiteSnapshot(
  primary: Partial<AdminSiteSnapshot> | null | undefined,
  fallback: Partial<AdminSiteSnapshot> | null | undefined,
): AdminSiteSnapshot {
  return mergeAdminSiteSnapshots(primary ?? {}, fallback ?? {});
}

function mapTechnicalGuidanceRelations(
  value: unknown,
): TechnicalGuidanceRelations {
  const source = asMapperRecord(value);
  const normalizeEntries = (entries: unknown) =>
    Array.isArray(entries)
      ? entries
          .map((item) => asMapperRecord(item))
          .map((item) => ({
            label: normalizeMapperText(item.label),
            count: Number(item.count) || 0,
          }))
          .filter((item) => item.label && item.count > 0)
      : [];

  return createEmptyTechnicalGuidanceRelations({
    computedAt: normalizeMapperText(source.computedAt) || null,
    projectionVersion:
      typeof source.projectionVersion === 'number'
        ? source.projectionVersion
        : Number(source.projectionVersion) || 0,
    stale: Boolean(source.stale),
    recomputeStatus:
      normalizeMapperText(source.recomputeStatus) === 'pending' ? 'pending' : 'fresh',
    sourceReportKeys: Array.isArray(source.sourceReportKeys)
      ? source.sourceReportKeys.map((item) => normalizeMapperText(item)).filter(Boolean)
      : [],
    cumulativeAccidentEntries: normalizeEntries(source.cumulativeAccidentEntries),
    cumulativeAgentEntries: normalizeEntries(source.cumulativeAgentEntries),
  });
}

function buildTechnicalGuidancePayloadForSave(
  session: InspectionSession,
  site: InspectionSite,
): Record<string, unknown> {
  return {
    siteKey: site.id,
    scheduleId: session.scheduleId ?? null,
    scheduleRoundNo: session.scheduleRoundNo ?? null,
    reportNumber: session.reportNumber,
    currentSection: session.currentSection,
    adminSiteSnapshot: session.adminSiteSnapshot,
    meta: session.meta,
    controllerReview: session.controllerReview,
    documentsMeta: session.documentsMeta,
    document2Overview: session.document2Overview,
    document3Scenes: session.document3Scenes,
    document4FollowUps: session.document4FollowUps,
    document5Summary: session.document5Summary,
    document6Measures: session.document6Measures,
    document7Findings: session.document7Findings,
    document8Plans: session.document8Plans,
    document9SafetyChecks: session.document9SafetyChecks,
    document10Measurements: session.document10Measurements,
    document11EducationRecords: session.document11EducationRecords,
    document12Activities: session.document12Activities,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastSavedAt: session.lastSavedAt,
    reportKind: TECHNICAL_GUIDANCE_REPORT_KIND,
  };
}

export function mapSafetyReportListItem(
  report: SafetyReportListItem,
): InspectionReportListItem {
  const dispatchState = resolveReportDispatchListState(report);

  return {
    id: report.report_key,
    reportKey: report.report_key,
    reportTitle: report.report_title,
    reportOpenHref: null,
    reportOpenMode: 'session',
    readOnly: false,
    originalPdfAvailable: false,
    siteId: report.site_id,
    headquarterId: report.headquarter_id,
    scheduleId: report.schedule_id ?? null,
    assignedUserId: report.assigned_user_id,
    visitDate: report.visit_date,
    visitRound: report.visit_round,
    totalRound: report.total_round,
    progressRate: report.progress_rate,
    status: report.status,
    dispatchCompleted: dispatchState.dispatchCompleted,
    dispatchStatus: dispatchState.dispatchStatus,
    reportIndexSource: 'remote',
    payloadVersion: report.payload_version,
    latestRevisionNo: report.latest_revision_no,
    submittedAt: report.submitted_at,
    publishedAt: report.published_at,
    lastAutosavedAt: report.last_autosaved_at,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    meta: report.meta,
  };
}

export function mapInspectionSessionToReportListItem(
  session: InspectionSession,
  site: InspectionSite,
): InspectionReportListItem {
  const progress = getSessionProgress(session);

  return {
    id: session.id,
    reportKey: session.id,
    reportTitle: getSessionTitle(session),
    reportOpenHref: null,
    reportOpenMode: 'session',
    readOnly: false,
    originalPdfAvailable: false,
    siteId: site.id,
    headquarterId: site.headquarterId ?? null,
    scheduleId: session.scheduleId ?? null,
    assignedUserId: null,
    visitDate: getSessionGuidanceDate(session) || null,
    visitRound: session.reportNumber || null,
    totalRound: progress.total,
    progressRate: progress.percentage,
    status: 'draft',
    dispatchCompleted: false,
    dispatchStatus: null,
    reportIndexSource: 'local',
    payloadVersion: 1,
    latestRevisionNo: 0,
    submittedAt: null,
    publishedAt: null,
    lastAutosavedAt: session.lastSavedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    meta: {
      siteName: session.meta.siteName,
      reportTitle: session.meta.reportTitle,
      drafter: session.meta.drafter,
      reviewer: session.meta.reviewer,
      approver: session.meta.approver,
      currentSection: session.currentSection,
      reportNumber: session.reportNumber,
      reportKind: TECHNICAL_GUIDANCE_REPORT_KIND,
    },
  };
}

export function mapSafetyReportToInspectionSession(
  report: SafetyReport,
  site: InspectionSite,
  masterData: SafetyMasterData
): InspectionSession {
  const payload = asMapperRecord(report.payload);
  const payloadMeta = asMapperRecord(payload.meta);
  const reportMeta = asMapperRecord(report.meta);

  const normalized = normalizeInspectionSession({
    ...payload,
    id: report.report_key,
    siteKey: report.site_id,
    scheduleId: report.schedule_id ?? normalizeMapperText(payload.scheduleId) ?? null,
    scheduleRoundNo: parsePositiveInteger(String(payload.scheduleRoundNo ?? '')),
    reportNumber:
      typeof report.visit_round === 'number' ? report.visit_round : payload.reportNumber,
    createdAt: normalizeMapperText(payload.createdAt) || report.created_at,
    updatedAt: normalizeMapperText(payload.updatedAt) || report.updated_at,
    lastSavedAt:
      report.last_autosaved_at ||
      normalizeMapperText(payload.lastSavedAt) ||
      report.updated_at,
    adminSiteSnapshot: mergeAdminSiteSnapshot(
      payload.adminSiteSnapshot as Partial<AdminSiteSnapshot> | undefined,
      site.adminSiteSnapshot,
    ),
    meta: {
      ...payloadMeta,
      siteName:
        normalizeMapperText(payloadMeta.siteName) ||
        normalizeMapperText(reportMeta.siteName) ||
        site.siteName,
      reportDate:
        normalizeMapperText(payloadMeta.reportDate) ||
        normalizeMapperText(report.visit_date) ||
        '',
      reportTitle:
        normalizeMapperText(payloadMeta.reportTitle) ||
        normalizeMapperText(report.report_title),
      drafter:
        normalizeMapperText(payloadMeta.drafter) ||
        normalizeMapperText(reportMeta.drafter) ||
        site.assigneeName,
      reviewer:
        normalizeMapperText(payloadMeta.reviewer) ||
        normalizeMapperText(reportMeta.reviewer),
      approver:
        normalizeMapperText(payloadMeta.approver) ||
        normalizeMapperText(reportMeta.approver),
    },
    controllerReview: normalizeControllerReview(
      payload.controllerReview ?? payloadMeta.controllerReview ?? reportMeta.controllerReview,
    ),
    technicalGuidanceRelations: mapTechnicalGuidanceRelations(
      payload.technicalGuidanceRelations,
    ),
  });

  return mergeMasterDataIntoSession(normalized, masterData);
}

function resolveReportScheduleId(session: InspectionSession): string | null {
  if (!session.scheduleId) {
    return null;
  }

  if (typeof session.scheduleRoundNo === 'number' && session.scheduleRoundNo > 0) {
    return session.scheduleRoundNo === session.reportNumber ? session.scheduleId : null;
  }

  return session.reportNumber > 1 ? session.scheduleId : null;
}

export function buildSafetyReportUpsertInput(
  session: InspectionSession,
  site: InspectionSite
): SafetyUpsertReportInput {
  const progress = getSessionProgress(session);

  return {
    report_key: session.id,
    report_title: getSessionTitle(session),
    site_id: site.id,
    schedule_id: resolveReportScheduleId(session),
    visit_date: getSessionGuidanceDate(session) || null,
    visit_round: session.reportNumber || null,
    total_round: parsePositiveInteger(session.document2Overview.totalVisitCount),
    progress_rate: progress.percentage,
    payload: buildTechnicalGuidancePayloadForSave(session, site),
    meta: {
      reportKind: TECHNICAL_GUIDANCE_REPORT_KIND,
      siteName: session.meta.siteName,
      reportTitle: session.meta.reportTitle,
      drafter: session.meta.drafter,
      reviewer: session.meta.reviewer,
      approver: session.meta.approver,
      currentSection: session.currentSection,
      reportNumber: session.reportNumber,
      scheduleRoundNo: session.scheduleRoundNo ?? null,
      controllerReview: session.controllerReview,
    },
    status: 'draft',
    create_revision: false,
    revision_reason: 'autosave',
  };
}

export function createNewSafetySession(
  site: InspectionSite,
  reportNumber: number,
  masterData: SafetyMasterData,
  initial?: {
    meta?: Partial<InspectionSession['meta']>;
    scheduleId?: string | null;
    scheduleRoundNo?: number | null;
    document2Overview?: Partial<InspectionSession['document2Overview']>;
    document4FollowUps?: InspectionSession['document4FollowUps'];
    technicalGuidanceRelations?: Partial<InspectionSession['technicalGuidanceRelations']>;
  }
): InspectionSession {
  const session = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        siteName: site.siteName,
        drafter: site.assigneeName,
        ...initial?.meta,
      },
      scheduleId: initial?.scheduleId,
      scheduleRoundNo: initial?.scheduleRoundNo,
      document13Cases: masterData.caseFeed,
      document14SafetyInfos: masterData.safetyInfos,
      document4FollowUps: initial?.document4FollowUps,
      technicalGuidanceRelations: initial?.technicalGuidanceRelations,
    },
    site.id,
    reportNumber
  );
  const sessionWithInitialOverview = initial?.document2Overview
    ? {
        ...session,
        document2Overview: {
          ...session.document2Overview,
          ...initial.document2Overview,
        },
      }
    : session;

  return mergeMasterDataIntoSession(
    sessionWithInitialOverview,
    masterData
  );
}

export function buildPreviousRoundAccidentOverviewSeed(
  seed: Pick<SafetyTechnicalGuidanceSeed, 'previous_round_accident'> | null | undefined,
): Partial<InspectionSession['document2Overview']> | undefined {
  const previousRoundAccident = seed?.previous_round_accident;
  if (previousRoundAccident?.accident_occurred !== 'yes') {
    return undefined;
  }

  return {
    accidentOccurred: 'yes',
    accidentSummary: normalizeMapperText(previousRoundAccident.accident_summary),
    accidentPhotoUrl: normalizeMapperText(previousRoundAccident.accident_photo_url),
  };
}

export function isSafetyAdmin(user: Pick<SafetyUser, 'role'> | null): boolean {
  return Boolean(user && ADMIN_ROLES.has(user.role));
}
