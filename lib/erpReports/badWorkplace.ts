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
  InspectionSession,
  InspectionSite,
  PreviousGuidanceFollowUpItem,
} from '@/types/inspectionSession';
import { BAD_WORKPLACE_REPORT_KIND, buildBadWorkplaceReportKey } from './shared';

export const BAD_WORKPLACE_NOTICE_TITLE =
  '기술지도 미이행 등 사망사고 고위험 취약 현장 통보서';
export const BAD_WORKPLACE_ATTACHMENT_DESCRIPTION =
  '기술지도 미이행 등 사망사고 고위험 취약 사항 1부';
export const BAD_WORKPLACE_DEFAULT_AGENCY_NAME = '한국종합안전';
export const BAD_WORKPLACE_DEFAULT_AGENCY_REPRESENTATIVE = '장정규';
const BAD_WORKPLACE_LEGACY_AGENCY_NAME = 'Safety Guidance API';
const BAD_WORKPLACE_LEGACY_AGENCY_REPRESENTATIVE = '한국종합안전';
const BAD_WORKPLACE_DEFAULT_NON_COMPLIANCE =
  '기술지도 이후에도 동일 유해·위험요인이 개선되지 않아 지속 조치가 필요합니다.';

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

/** 요약 카드와 표기에서 공통으로 쓰는 문서 7 지적 건수 */
export function countDocument7FindingsForDisplay(session: InspectionSession | null): number {
  if (!session) return 0;
  return countMeaningfulDocument7Findings(session);
}

/** 개요 입력의 진행률이 없으면 섹션 완료율(%)을 사용 */
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

export function buildBadWorkplaceViolations(
  session: InspectionSession | null,
  sourceMode: BadWorkplaceReport['sourceMode'],
  findingIds?: string[],
): BadWorkplaceViolation[] {
  if (!session) return [];
  if (findingIds && findingIds.length === 0) return [];

  const guidanceDate = getSessionGuidanceDate(session);
  const findings = getBadWorkplaceSelectableFindings(session).filter(
    (finding) => !findingIds || findingIds.includes(finding.id),
  );

  return findings.map((finding) => {
    const followUp = getBadWorkplaceFollowUpForFinding(session, finding.id);

    return {
      id: generateId('bad-workplace-item'),
      sourceFindingId: finding.id,
      legalReference:
        finding.legalReferenceTitle ||
        finding.referenceMaterial2 ||
        finding.referenceMaterial1,
      hazardFactor:
        finding.hazardDescription ||
        finding.emphasis ||
        finding.metadata ||
        finding.location ||
        finding.accidentType,
      improvementMeasure: finding.improvementRequest || finding.improvementPlan,
      guidanceDate: normalizeText(followUp?.guidanceDate) || guidanceDate,
      nonCompliance:
        sourceMode === 'current_new_hazard'
          ? '당회차 기술지도에서 신규 유해위험요인이 확인되어 즉시 조치가 필요합니다.'
          : buildViolationNonCompliance(followUp?.result || '') ||
            '이전 기술지도 지적사항이 아직 이행되지 않아 후속 조치가 필요합니다.',
      confirmationDate: normalizeText(followUp?.confirmationDate),
      accidentType: finding.accidentType,
      causativeAgentKey: finding.causativeAgentKey,
    };
  });
}

export function syncBadWorkplaceReportSource(
  report: BadWorkplaceReport,
  session: InspectionSession | null,
  selectedFindingIds?: string[],
): BadWorkplaceReport {
  const violations = buildBadWorkplaceViolations(
    session,
    report.sourceMode,
    selectedFindingIds,
  );
  const guidanceDate = (session ? getSessionGuidanceDate(session) : '') || report.guidanceDate;
  const nextReporterName = normalizeText(session?.meta.drafter) || report.reporterName;
  const shouldResetAssigneeContact =
    Boolean(normalizeText(session?.meta.drafter)) &&
    normalizePersonName(nextReporterName) !== normalizePersonName(report.reporterName);

  return {
    ...report,
    progressRate: getSessionProgressRateValue(session),
    implementationCount:
      session?.document2Overview.visitCount || report.implementationCount,
    guidanceDate,
    confirmationDate: report.confirmationDate || getTodayDateValue(),
    reporterName: nextReporterName,
    assigneeContact: shouldResetAssigneeContact ? '' : report.assigneeContact,
    sourceSessionId: session?.id || '',
    sourceFindingIds: violations.map((item) => item.sourceFindingId),
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
  const sourceMode: BadWorkplaceReport['sourceMode'] = 'previous_unresolved';
  const violations = buildBadWorkplaceViolations(sourceSession, sourceMode);
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
    };
  }

  return {
    id: buildBadWorkplaceReportKey(site.id, reportMonth, reporter?.id || 'anonymous'),
    siteId: site.id,
    title: `${reportMonth} 불량사업장 신고서`,
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
    sourceMode,
    sourceFindingIds: violations.map((item) => item.sourceFindingId),
    violations,
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
