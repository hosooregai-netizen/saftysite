import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';
import {
  asRecord,
  createEmptyAdminSiteSnapshot,
  generateId,
  normalizeText,
} from '@/constants/inspectionSession/shared';
import { asMapperRecord, normalizeMapperText } from '@/lib/safetyApiMappers/utils';
import type { SafetyReport, SafetyUpsertReportInput } from '@/types/backend';
import type {
  BadWorkplaceReport,
  BadWorkplaceViolation,
  OperationalReportStatus,
  QuarterlyImplementationRow,
  QuarterlySummaryReport,
} from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';
import {
  BAD_WORKPLACE_REPORT_KIND,
  buildQuarterlyDefaultTitle,
  formatReportMonthLabel,
  getStoredReportKind,
  normalizeQuarterlyReportPeriod,
  QUARTERLY_SUMMARY_REPORT_KIND,
} from './shared';

function normalizeOperationalStatus(
  value: unknown,
  fallbackStatus?: SafetyReport['status'],
): OperationalReportStatus {
  const normalized = normalizeMapperText(value);
  if (normalized === 'completed') return 'completed';
  if (fallbackStatus === 'submitted' || fallbackStatus === 'published') return 'completed';
  return 'draft';
}

function normalizeQuarterlyImplementationRows(value: unknown): QuarterlyImplementationRow[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const record = asRecord(item);
    return {
      sessionId: normalizeText(record.sessionId),
      reportTitle: normalizeText(record.reportTitle),
      reportDate: normalizeText(record.reportDate),
      reportNumber:
        typeof record.reportNumber === 'number' && Number.isFinite(record.reportNumber)
          ? record.reportNumber
          : 0,
      drafter: normalizeText(record.drafter),
      progressRate: normalizeText(record.progressRate),
      findingCount:
        typeof record.findingCount === 'number' && Number.isFinite(record.findingCount)
          ? record.findingCount
          : 0,
      improvedCount:
        typeof record.improvedCount === 'number' && Number.isFinite(record.improvedCount)
          ? record.improvedCount
          : 0,
      note: normalizeText(record.note),
    };
  });
}

function normalizeCounterItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        label: normalizeText(record.label),
        count:
          typeof record.count === 'number' && Number.isFinite(record.count)
            ? record.count
            : 0,
      };
    })
    .filter((item) => item.label);
}

function normalizeBadWorkplaceViolations(value: unknown): BadWorkplaceViolation[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: normalizeText(record.id) || generateId('bad-workplace-item'),
      sourceFindingId: normalizeText(record.sourceFindingId),
      legalReference: normalizeText(record.legalReference),
      hazardFactor: normalizeText(record.hazardFactor),
      improvementMeasure: normalizeText(record.improvementMeasure),
      nonCompliance: normalizeText(record.nonCompliance),
      confirmationDate: normalizeText(record.confirmationDate),
      accidentType: normalizeText(record.accidentType),
      causativeAgentKey: normalizeText(
        record.causativeAgentKey,
      ) as BadWorkplaceViolation['causativeAgentKey'],
    };
  });
}

function normalizePositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function mapSafetyReportToQuarterlySummaryReport(
  report: SafetyReport,
): QuarterlySummaryReport | null {
  if (getStoredReportKind(report) !== QUARTERLY_SUMMARY_REPORT_KIND) {
    return null;
  }

  const payload = asMapperRecord(report.payload);
  const meta = asMapperRecord(report.meta);
  const normalizedPeriod = normalizeQuarterlyReportPeriod({
    periodStartDate:
      normalizeMapperText(payload.periodStartDate) ||
      normalizeMapperText(meta.periodStartDate),
    periodEndDate:
      normalizeMapperText(payload.periodEndDate) ||
      normalizeMapperText(meta.periodEndDate),
    quarterKey:
      normalizeMapperText(payload.quarterKey) ||
      normalizeMapperText(meta.quarterKey),
    year:
      normalizePositiveNumber(payload.year) ||
      normalizePositiveNumber(meta.year),
    quarter:
      normalizePositiveNumber(payload.quarter) ||
      normalizePositiveNumber(meta.quarter),
  });

  if (!normalizedPeriod.periodStartDate && !normalizedPeriod.periodEndDate && !normalizedPeriod.quarterKey) {
    return null;
  }

  const nextReport: QuarterlySummaryReport = {
    id: report.report_key,
    siteId: report.site_id,
    title:
      normalizeMapperText(payload.title) ||
      normalizeMapperText(report.report_title) ||
      buildQuarterlyDefaultTitle(report.created_at),
    reportKind: QUARTERLY_SUMMARY_REPORT_KIND,
    periodStartDate: normalizedPeriod.periodStartDate,
    periodEndDate: normalizedPeriod.periodEndDate,
    quarterKey: normalizedPeriod.quarterKey,
    year: normalizedPeriod.year,
    quarter: normalizedPeriod.quarter,
    status: normalizeOperationalStatus(payload.status ?? meta.status, report.status),
    drafter:
      normalizeMapperText(payload.drafter) ||
      normalizeMapperText(meta.drafter),
    siteSnapshot: createEmptyAdminSiteSnapshot(asRecord(payload.siteSnapshot)),
    generatedFromSessionIds: Array.isArray(payload.generatedFromSessionIds)
      ? payload.generatedFromSessionIds.map((item) => normalizeMapperText(item)).filter(Boolean)
      : [],
    lastCalculatedAt:
      normalizeMapperText(payload.lastCalculatedAt) ||
      normalizeMapperText(payload.updatedAt) ||
      report.updated_at,
    overallComment: normalizeMapperText(payload.overallComment),
    implementationRows: normalizeQuarterlyImplementationRows(payload.implementationRows),
    accidentStats: normalizeCounterItems(payload.accidentStats),
    causativeStats: normalizeCounterItems(payload.causativeStats),
    futurePlans: Array.isArray(payload.futurePlans)
      ? payload.futurePlans.map((item) => createFutureProcessRiskPlan(asRecord(item)))
      : [],
    majorMeasures: Array.isArray(payload.majorMeasures)
      ? payload.majorMeasures.map((item) => normalizeMapperText(item)).filter(Boolean)
      : [],
    opsAssetId: normalizeMapperText(payload.opsAssetId),
    opsAssetTitle: normalizeMapperText(payload.opsAssetTitle),
    opsAssetDescription: normalizeMapperText(payload.opsAssetDescription),
    opsAssetPreviewUrl: normalizeMapperText(payload.opsAssetPreviewUrl),
    opsAssetFileUrl: normalizeMapperText(payload.opsAssetFileUrl),
    opsAssetFileName: normalizeMapperText(payload.opsAssetFileName),
    opsAssetType: normalizeMapperText(
      payload.opsAssetType,
    ) as QuarterlySummaryReport['opsAssetType'],
    opsAssignedBy: normalizeMapperText(payload.opsAssignedBy),
    opsAssignedAt: normalizeMapperText(payload.opsAssignedAt),
    createdAt: normalizeMapperText(payload.createdAt) || report.created_at,
    updatedAt: normalizeMapperText(payload.updatedAt) || report.updated_at,
  };

  return nextReport;
}

export function mapSafetyReportToBadWorkplaceReport(
  report: SafetyReport,
): BadWorkplaceReport | null {
  if (getStoredReportKind(report) !== BAD_WORKPLACE_REPORT_KIND) {
    return null;
  }

  const payload = asMapperRecord(report.payload);
  const meta = asMapperRecord(report.meta);
  const reportMonth =
    normalizeMapperText(payload.reportMonth) ||
    normalizeMapperText(meta.reportMonth);

  const nextReport: BadWorkplaceReport = {
    id: report.report_key,
    siteId: report.site_id,
    title:
      normalizeMapperText(payload.title) ||
      normalizeMapperText(report.report_title) ||
      `${formatReportMonthLabel(reportMonth)} 불량사업장 신고`,
    reportKind: BAD_WORKPLACE_REPORT_KIND,
    reportMonth,
    status: normalizeOperationalStatus(payload.status ?? meta.status, report.status),
    reporterUserId:
      normalizeMapperText(payload.reporterUserId) ||
      normalizeMapperText(meta.reporterUserId),
    reporterName:
      normalizeMapperText(payload.reporterName) ||
      normalizeMapperText(meta.reporterName),
    receiverName: normalizeMapperText(payload.receiverName),
    progressRate: normalizeMapperText(payload.progressRate),
    implementationCount: normalizeMapperText(payload.implementationCount),
    contractPeriod: normalizeMapperText(payload.contractPeriod),
    agencyName: normalizeMapperText(payload.agencyName),
    agencyRepresentative: normalizeMapperText(payload.agencyRepresentative),
    agencyAddress: normalizeMapperText(payload.agencyAddress),
    agencyContact: normalizeMapperText(payload.agencyContact),
    sourceSessionId: normalizeMapperText(payload.sourceSessionId),
    sourceFindingIds: Array.isArray(payload.sourceFindingIds)
      ? payload.sourceFindingIds.map((item) => normalizeMapperText(item)).filter(Boolean)
      : [],
    violations: normalizeBadWorkplaceViolations(payload.violations),
    note: normalizeMapperText(payload.note),
    createdAt: normalizeMapperText(payload.createdAt) || report.created_at,
    updatedAt: normalizeMapperText(payload.updatedAt) || report.updated_at,
  };

  return nextReport;
}

export function buildQuarterlySummaryUpsertInput(
  report: QuarterlySummaryReport,
  site: InspectionSite,
): SafetyUpsertReportInput {
  const normalizedPeriod = normalizeQuarterlyReportPeriod(report);

  return {
    report_key: report.id,
    report_title: report.title,
    site_id: site.id,
    visit_date: report.updatedAt.slice(0, 10) || null,
    payload: {
      ...report,
      ...normalizedPeriod,
      reportKind: QUARTERLY_SUMMARY_REPORT_KIND,
      updatedAt: report.updatedAt,
    },
    meta: {
      reportKind: QUARTERLY_SUMMARY_REPORT_KIND,
      periodStartDate: normalizedPeriod.periodStartDate,
      periodEndDate: normalizedPeriod.periodEndDate,
      quarterKey: normalizedPeriod.quarterKey,
      year: normalizedPeriod.year,
      quarter: normalizedPeriod.quarter,
      status: report.status,
      drafter: report.drafter,
    },
    status: report.status === 'completed' ? 'submitted' : 'draft',
    create_revision: false,
    revision_reason: 'manual_save',
  };
}

export function buildBadWorkplaceUpsertInput(
  report: BadWorkplaceReport,
  site: InspectionSite,
): SafetyUpsertReportInput {
  return {
    report_key: report.id,
    report_title: report.title,
    site_id: site.id,
    visit_date:
      report.violations[0]?.confirmationDate ||
      report.updatedAt.slice(0, 10) ||
      null,
    payload: {
      ...report,
      reportKind: BAD_WORKPLACE_REPORT_KIND,
      updatedAt: report.updatedAt,
    },
    meta: {
      reportKind: BAD_WORKPLACE_REPORT_KIND,
      reportMonth: report.reportMonth,
      reporterUserId: report.reporterUserId,
      reporterName: report.reporterName,
      status: report.status,
    },
    status: report.status === 'completed' ? 'submitted' : 'draft',
    create_revision: false,
    revision_reason: 'manual_save',
  };
}
