import {
  createInspectionSession,
  getSessionTitle,
  normalizeInspectionSession,
} from '@/constants/inspectionSession';
import type {
  SafetyMasterData,
  SafetyReport,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { mergeMasterDataIntoSession } from './masterData';
import {
  asMapperRecord,
  normalizeMapperText,
  parsePositiveInteger,
  parseProgressRate,
} from './utils';

const ADMIN_ROLES = new Set(['super_admin', 'admin', 'controller']);

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
    reportNumber:
      typeof report.visit_round === 'number' ? report.visit_round : payload.reportNumber,
    createdAt: normalizeMapperText(payload.createdAt) || report.created_at,
    updatedAt: normalizeMapperText(payload.updatedAt) || report.updated_at,
    lastSavedAt:
      report.last_autosaved_at ||
      normalizeMapperText(payload.lastSavedAt) ||
      report.updated_at,
    adminSiteSnapshot: payload.adminSiteSnapshot || site.adminSiteSnapshot,
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
  });

  return mergeMasterDataIntoSession(normalized, masterData);
}

export function buildSafetyReportUpsertInput(
  session: InspectionSession,
  site: InspectionSite
): SafetyUpsertReportInput {
  return {
    report_key: session.id,
    report_title: getSessionTitle(session),
    site_id: site.id,
    visit_date: session.meta.reportDate || null,
    visit_round: session.reportNumber || null,
    total_round: parsePositiveInteger(session.document2Overview.totalVisitCount),
    progress_rate: parseProgressRate(session.document2Overview.progressRate),
    payload: {
      ...session,
      siteKey: site.id,
      adminSiteSnapshot: site.adminSiteSnapshot,
    },
    meta: {
      siteName: session.meta.siteName,
      drafter: session.meta.drafter,
      reviewer: session.meta.reviewer,
      approver: session.meta.approver,
      currentSection: session.currentSection,
      reportNumber: session.reportNumber,
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
  }
): InspectionSession {
  return mergeMasterDataIntoSession(
    createInspectionSession(
      {
        adminSiteSnapshot: site.adminSiteSnapshot,
        meta: {
          siteName: site.siteName,
          drafter: site.assigneeName,
          ...initial?.meta,
        },
        document13Cases: masterData.caseFeed,
        document14SafetyInfos: masterData.safetyInfos,
      },
      site.id,
      reportNumber
    ),
    masterData
  );
}

export function isSafetyAdmin(user: Pick<SafetyUser, 'role'> | null): boolean {
  return Boolean(user && ADMIN_ROLES.has(user.role));
}
