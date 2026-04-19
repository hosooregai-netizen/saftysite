import {
  DEFAULT_GUIDANCE_AGENCY,
  getSessionGuidanceDate,
  getSessionProgress,
  normalizeFollowUpResult,
} from '@/constants/inspectionSession';
import {
  createTimestamp,
  generateId,
  normalizeText,
} from '@/constants/inspectionSession/shared';
import {
  countMeaningfulDocument7Findings,
  isMeaningfulDocument7Finding,
} from '@/lib/erpReports/document7FindingCount';
import { formatDateValue } from '@/lib/erpReports/shared';
import type { SafetyUser } from '@/types/backend';
import type { BadWorkplaceReport, BadWorkplaceViolation } from '@/types/erpReports';
import type {
  CurrentHazardFinding,
  InspectionSession,
  InspectionSite,
  PreviousGuidanceFollowUpItem,
} from '@/types/inspectionSession';
import { BAD_WORKPLACE_REPORT_KIND, buildBadWorkplaceReportKey } from './shared';

export const BAD_WORKPLACE_NOTICE_TITLE =
  '기술지도 미이행 등 사망사고 고위험 취약 현장 통보서';
export const BAD_WORKPLACE_ATTACHMENT_DESCRIPTION =
  '기술지도 미이행 등 사망사고 고위험 취약 사항 1부';
export const BAD_WORKPLACE_DEFAULT_AGENCY_NAME = '새롬종합안전';
export const BAD_WORKPLACE_DEFAULT_AGENCY_REPRESENTATIVE = '유정구';

const BAD_WORKPLACE_LEGACY_AGENCY_NAME = 'Safety Guidance API';
const BAD_WORKPLACE_LEGACY_AGENCY_REPRESENTATIVE = '새롬종합안전';
const BAD_WORKPLACE_DEFAULT_NON_COMPLIANCE =
  '기술지도 이후에도 동일 유해위험요인이 개선되지 않아 지속 조치가 필요합니다.';
const BAD_WORKPLACE_PREVIOUS_NON_COMPLIANCE =
  '이전 기술지도 지적사항이 아직 이행되지 않아 후속 조치가 필요합니다.';
const BAD_WORKPLACE_CURRENT_HAZARD_NON_COMPLIANCE =
  '당회차 기술지도에서 신규 위험요인이 확인되어 즉시 조치가 필요합니다.';

function sortSessionsByDateDesc(sessions: InspectionSession[]) {
  return [...sessions].sort((left, right) => {
    const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
    const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

function normalizePersonName(value: string | null | undefined) {
  return normalizeText(value).replace(/\s+/g, '');
}

function buildAssigneeContact(
  reporter: Pick<SafetyUser, 'name' | 'phone'> | null,
  session: InspectionSession | null,
) {
  const phone = reporter?.phone?.trim() || '';
  if (!phone) return '';

  const sessionDrafter = normalizePersonName(session?.meta.drafter);
  const reporterName = normalizePersonName(reporter?.name);

  if (!sessionDrafter || (reporterName && reporterName === sessionDrafter)) {
    return phone;
  }

  return '';
}

function buildReporterName(
  session: InspectionSession | null,
  reporter: Pick<SafetyUser, 'name'> | null,
  site: InspectionSite,
) {
  return normalizeText(session?.meta.drafter) || reporter?.name?.trim() || site.assigneeName || '';
}

export function normalizeBadWorkplaceAgencyName(value: string | null | undefined) {
  const normalized = normalizeText(value);
  const collapsed = normalized.replace(/\s+/g, '').toLowerCase();

  if (
    !collapsed ||
    collapsed === BAD_WORKPLACE_LEGACY_AGENCY_NAME.replace(/\s+/g, '').toLowerCase() ||
    collapsed === normalizeText(DEFAULT_GUIDANCE_AGENCY).replace(/\s+/g, '').toLowerCase()
  ) {
    return BAD_WORKPLACE_DEFAULT_AGENCY_NAME;
  }

  return normalized;
}

export function normalizeBadWorkplaceAgencyRepresentative(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized || normalized === BAD_WORKPLACE_LEGACY_AGENCY_REPRESENTATIVE) {
    return BAD_WORKPLACE_DEFAULT_AGENCY_REPRESENTATIVE;
  }

  return normalized;
}

export function getBadWorkplaceSourceSessions(siteSessions: InspectionSession[]) {
  return sortSessionsByDateDesc(siteSessions);
}

export function getBadWorkplaceSelectableFindings(session: InspectionSession | null) {
  if (!session) return [];
  return session.document7Findings.filter((finding) => isMeaningfulDocument7Finding(finding));
}

export function countDocument7FindingsForDisplay(session: InspectionSession | null): number {
  if (!session) return 0;
  return countMeaningfulDocument7Findings(session);
}

export function formatSessionProgressRateDisplay(session: InspectionSession | null): string {
  if (!session) return '-';
  const raw = normalizeText(session.document2Overview.progressRate);
  if (raw) {
    return /%$/.test(raw) ? raw : `${raw}%`;
  }
  const pct = getSessionProgress(session).percentage;
  return `${pct}%`;
}

function getSessionProgressRateValue(session: InspectionSession | null): string {
  if (!session) return '';
  return formatSessionProgressRateDisplay(session);
}

function isPendingFollowUpResult(result: string) {
  const normalized = normalizeText(result).replace(/\s+/g, '').toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes('미이행') ||
    normalized.includes('불이행') ||
    normalized.includes('부분이행') ||
    normalized.includes('조치중') ||
    normalized.includes('진행중') ||
    normalized.includes('예정') ||
    normalized.includes('보완중') ||
    normalized.includes('대기') ||
    normalized === 'not_implemented'
  );
}

function shouldPreferFollowUp(
  candidate: PreviousGuidanceFollowUpItem,
  current: PreviousGuidanceFollowUpItem | null,
) {
  if (!current) return true;

  const confirmationDelta = normalizeText(candidate.confirmationDate).localeCompare(
    normalizeText(current.confirmationDate),
  );
  if (confirmationDelta !== 0) {
    return confirmationDelta > 0;
  }

  const guidanceDelta = normalizeText(candidate.guidanceDate).localeCompare(
    normalizeText(current.guidanceDate),
  );
  if (guidanceDelta !== 0) {
    return guidanceDelta > 0;
  }

  return normalizeText(candidate.result).length > normalizeText(current.result).length;
}

export function getBadWorkplaceFollowUpForFinding(
  session: InspectionSession | null,
  findingId: string,
): PreviousGuidanceFollowUpItem | null {
  if (!session || !findingId) return null;

  return session.document4FollowUps.reduce<PreviousGuidanceFollowUpItem | null>((best, item) => {
    if (item.sourceFindingId !== findingId) {
      return best;
    }

    return shouldPreferFollowUp(item, best) ? item : best;
  }, null);
}

function buildViolationNonCompliance(result: string) {
  const normalized = normalizeText(result);
  if (!normalized) {
    return BAD_WORKPLACE_DEFAULT_NON_COMPLIANCE;
  }

  if (isPendingFollowUpResult(normalized) || normalizeFollowUpResult(normalized) === '미이행') {
    return normalized.length <= 8 ? BAD_WORKPLACE_DEFAULT_NON_COMPLIANCE : normalized;
  }

  return '';
}

function getTodayDateValue() {
  return formatDateValue(new Date());
}

function buildViolationLegalReference(finding: CurrentHazardFinding | null) {
  if (!finding) return '';
  return (
    finding.legalReferenceTitle ||
    finding.referenceMaterial2 ||
    finding.referenceMaterial1
  );
}

function buildViolationHazardFactor(finding: CurrentHazardFinding | null) {
  if (!finding) return '';
  return (
    finding.hazardDescription ||
    finding.emphasis ||
    finding.metadata ||
    finding.location ||
    finding.accidentType
  );
}

function buildViolationImprovementMeasure(finding: CurrentHazardFinding | null) {
  if (!finding) return '';
  return finding.improvementRequest || finding.improvementPlan;
}

function buildBadWorkplaceSourceFindingIds(violations: BadWorkplaceViolation[]) {
  return [...new Set(
    violations
      .filter((item) => item.originKind !== 'manual')
      .map((item) => normalizeText(item.sourceFindingId))
      .filter(Boolean),
  )];
}

function findSourceFinding(
  selectedSession: InspectionSession,
  siteSessions: InspectionSession[],
  followUp: PreviousGuidanceFollowUpItem,
) {
  const sourceFindingId = normalizeText(followUp.sourceFindingId);
  if (!sourceFindingId) {
    return null;
  }

  const sourceSessionId = normalizeText(followUp.sourceSessionId);
  if (sourceSessionId) {
    const sourceSession =
      siteSessions.find((session) => session.id === sourceSessionId) ?? null;
    const sourceFinding =
      sourceSession?.document7Findings.find((finding) => finding.id === sourceFindingId) ?? null;
    if (sourceSession && sourceFinding) {
      return {
        finding: sourceFinding,
        session: sourceSession,
      };
    }
  }

  const currentFinding =
    selectedSession.document7Findings.find((finding) => finding.id === sourceFindingId) ?? null;
  if (currentFinding) {
    return {
      finding: currentFinding,
      session: selectedSession,
    };
  }

  return null;
}

function buildPreviousUnresolvedViolation(
  selectedSession: InspectionSession,
  siteSessions: InspectionSession[],
  followUp: PreviousGuidanceFollowUpItem,
): BadWorkplaceViolation {
  const resolved = findSourceFinding(selectedSession, siteSessions, followUp);
  const resolvedFinding = resolved?.finding ?? null;
  const resolvedSession = resolved?.session ?? null;
  const normalizedSourceFindingId =
    normalizeText(resolvedFinding?.id) || normalizeText(followUp.sourceFindingId);

  return {
    id: generateId('bad-workplace-item'),
    sourceFindingId: normalizedSourceFindingId,
    legalReference: buildViolationLegalReference(resolvedFinding),
    hazardFactor:
      buildViolationHazardFactor(resolvedFinding) || normalizeText(followUp.location),
    improvementMeasure: buildViolationImprovementMeasure(resolvedFinding),
    nonCompliance:
      buildViolationNonCompliance(followUp.result || '') ||
      normalizeText(followUp.result) ||
      BAD_WORKPLACE_PREVIOUS_NON_COMPLIANCE,
    guidanceDate:
      normalizeText(followUp.guidanceDate) ||
      (resolvedSession ? getSessionGuidanceDate(resolvedSession) : '') ||
      getSessionGuidanceDate(selectedSession),
    confirmationDate: normalizeText(followUp.confirmationDate),
    accidentType: normalizeText(resolvedFinding?.accidentType),
    causativeAgentKey: resolvedFinding?.causativeAgentKey || '',
    originKind: 'previous_unresolved',
    originKey: `previous_unresolved:${selectedSession.id}:${followUp.id}`,
    originSessionId: selectedSession.id,
    originFindingId: normalizedSourceFindingId || undefined,
  };
}

function buildCurrentHazardViolation(
  session: InspectionSession,
  finding: CurrentHazardFinding,
): BadWorkplaceViolation {
  const followUp = getBadWorkplaceFollowUpForFinding(session, finding.id);

  return {
    id: generateId('bad-workplace-item'),
    sourceFindingId: finding.id,
    legalReference: buildViolationLegalReference(finding),
    hazardFactor: buildViolationHazardFactor(finding),
    improvementMeasure: buildViolationImprovementMeasure(finding),
    nonCompliance: BAD_WORKPLACE_CURRENT_HAZARD_NON_COMPLIANCE,
    guidanceDate: normalizeText(followUp?.guidanceDate) || getSessionGuidanceDate(session),
    confirmationDate: normalizeText(followUp?.confirmationDate),
    accidentType: finding.accidentType,
    causativeAgentKey: finding.causativeAgentKey,
    originKind: 'current_new_hazard',
    originKey: `current_new_hazard:${session.id}:${finding.id}`,
    originSessionId: session.id,
    originFindingId: finding.id,
  };
}

function buildAutomaticBadWorkplaceViolations(
  session: InspectionSession | null,
  siteSessions: InspectionSession[],
) {
  if (!session) return [];

  const previousViolations = session.document4FollowUps.map((followUp) =>
    buildPreviousUnresolvedViolation(session, siteSessions, followUp),
  );
  const currentViolations = getBadWorkplaceSelectableFindings(session).map((finding) =>
    buildCurrentHazardViolation(session, finding),
  );

  return [...previousViolations, ...currentViolations];
}

function getManualBadWorkplaceViolations(violations: BadWorkplaceViolation[]) {
  return violations.filter((violation) => violation.originKind === 'manual');
}

export function createEmptyManualBadWorkplaceViolation(
  session: InspectionSession | null,
  report?: Pick<BadWorkplaceReport, 'guidanceDate'> | null,
): BadWorkplaceViolation {
  const id = generateId('bad-workplace-item');
  return {
    id,
    sourceFindingId: '',
    legalReference: '',
    hazardFactor: '',
    improvementMeasure: '',
    nonCompliance: '',
    guidanceDate: (session ? getSessionGuidanceDate(session) : '') || report?.guidanceDate || '',
    confirmationDate: '',
    accidentType: '',
    causativeAgentKey: '',
    originKind: 'manual',
    originKey: `manual:${id}`,
    originSessionId: '',
  };
}

export function syncBadWorkplaceReportSource(
  report: BadWorkplaceReport,
  session: InspectionSession | null,
  siteSessions: InspectionSession[],
): BadWorkplaceReport {
  const violations = [
    ...buildAutomaticBadWorkplaceViolations(session, siteSessions),
    ...getManualBadWorkplaceViolations(report.violations),
  ];
  const guidanceDate = (session ? getSessionGuidanceDate(session) : '') || report.guidanceDate;
  const nextReporterName = normalizeText(session?.meta.drafter) || report.reporterName;
  const shouldResetAssigneeContact =
    Boolean(normalizeText(session?.meta.drafter)) &&
    normalizePersonName(nextReporterName) !== normalizePersonName(report.reporterName);

  return {
    ...report,
    progressRate: getSessionProgressRateValue(session),
    implementationCount: session?.document2Overview.visitCount || report.implementationCount,
    guidanceDate,
    confirmationDate: report.confirmationDate || getTodayDateValue(),
    reporterName: nextReporterName,
    assigneeContact: shouldResetAssigneeContact ? '' : report.assigneeContact,
    sourceSessionId: session?.id || '',
    sourceMode: 'combined',
    sourceFindingIds: buildBadWorkplaceSourceFindingIds(violations),
    violations,
  };
}

export function buildInitialBadWorkplaceReport(
  site: InspectionSite,
  siteSessions: InspectionSession[],
  reporter: Pick<SafetyUser, 'id' | 'name' | 'phone' | 'organization_name'> | null,
  reportMonth: string,
  existing?: BadWorkplaceReport | null,
): BadWorkplaceReport {
  const timestamp = createTimestamp();
  const sourceSession = getBadWorkplaceSourceSessions(siteSessions)[0] || null;
  const violations = buildAutomaticBadWorkplaceViolations(sourceSession, siteSessions);
  const guidanceDate = sourceSession ? getSessionGuidanceDate(sourceSession) : '';
  const reporterName = buildReporterName(sourceSession, reporter, site);

  if (existing) {
    const persistedSnapshot = Object.fromEntries(
      Object.entries(existing.siteSnapshot ?? {}).filter(([, value]) =>
        typeof value === 'string' ? value.trim().length > 0 : Boolean(value),
      ),
    );

    return {
      ...existing,
      siteSnapshot: {
        ...site.adminSiteSnapshot,
        ...persistedSnapshot,
      },
      receiverName:
        existing.receiverName ||
        existing.siteSnapshot?.siteManagerName ||
        site.adminSiteSnapshot.siteManagerName,
      progressRate: existing.progressRate || getSessionProgressRateValue(sourceSession),
      implementationCount:
        existing.implementationCount ||
        sourceSession?.document2Overview.visitCount ||
        String(siteSessions.length || ''),
      guidanceDate: existing.guidanceDate || guidanceDate,
      confirmationDate: existing.confirmationDate || getTodayDateValue(),
      reporterName: existing.reporterName || reporterName,
      assigneeContact: existing.assigneeContact || buildAssigneeContact(reporter, sourceSession),
      agencyName: normalizeBadWorkplaceAgencyName(
        existing.agencyName || reporter?.organization_name || DEFAULT_GUIDANCE_AGENCY,
      ),
      agencyRepresentative: normalizeBadWorkplaceAgencyRepresentative(
        existing.agencyRepresentative,
      ),
      notificationDate:
        existing.notificationDate || existing.updatedAt.slice(0, 10) || timestamp.slice(0, 10),
      attachmentDescription:
        existing.attachmentDescription || BAD_WORKPLACE_ATTACHMENT_DESCRIPTION,
      sourceSessionId: existing.sourceSessionId || sourceSession?.id || '',
      sourceMode: 'combined',
      sourceFindingIds:
        existing.sourceFindingIds.length > 0
          ? existing.sourceFindingIds
          : buildBadWorkplaceSourceFindingIds(existing.violations),
    };
  }

  return {
    id: buildBadWorkplaceReportKey(site.id, reportMonth, reporter?.id || 'anonymous'),
    siteId: site.id,
    title: `${reportMonth} 불량사업장 신고`,
    reportKind: BAD_WORKPLACE_REPORT_KIND,
    dispatchCompleted: false,
    reportMonth,
    status: 'draft',
    controllerReview: null,
    siteSnapshot: { ...site.adminSiteSnapshot },
    reporterUserId: reporter?.id || '',
    reporterName,
    receiverName: site.adminSiteSnapshot.siteManagerName,
    progressRate: getSessionProgressRateValue(sourceSession),
    implementationCount:
      sourceSession?.document2Overview.visitCount || String(siteSessions.length || ''),
    contractPeriod: site.adminSiteSnapshot.constructionPeriod,
    agencyName: normalizeBadWorkplaceAgencyName(
      reporter?.organization_name || DEFAULT_GUIDANCE_AGENCY,
    ),
    agencyRepresentative: normalizeBadWorkplaceAgencyRepresentative(null),
    agencyAddress: site.adminSiteSnapshot.headquartersAddress,
    agencyContact: reporter?.phone || site.adminSiteSnapshot.headquartersContact,
    guidanceDate,
    confirmationDate: getTodayDateValue(),
    assigneeContact: buildAssigneeContact(reporter, sourceSession),
    notificationDate: timestamp.slice(0, 10),
    recipientOfficeName: '',
    attachmentDescription: BAD_WORKPLACE_ATTACHMENT_DESCRIPTION,
    sourceSessionId: sourceSession?.id || '',
    sourceMode: 'combined',
    sourceFindingIds: buildBadWorkplaceSourceFindingIds(violations),
    violations,
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
