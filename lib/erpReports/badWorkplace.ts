import {
  DEFAULT_GUIDANCE_AGENCY,
  getSessionGuidanceDate,
  getSessionProgress,
} from '@/constants/inspectionSession';
import { createTimestamp, generateId } from '@/constants/inspectionSession/shared';
import {
  countMeaningfulDocument7Findings,
  isMeaningfulDocument7Finding,
} from '@/lib/erpReports/document7FindingCount';
import type { SafetyUser } from '@/types/backend';
import type { BadWorkplaceReport, BadWorkplaceViolation } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { BAD_WORKPLACE_REPORT_KIND, buildBadWorkplaceReportKey } from './shared';

function sortSessionsByDateDesc(sessions: InspectionSession[]) {
  return [...sessions].sort((left, right) => {
    const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
    const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

export function getBadWorkplaceSourceSessions(siteSessions: InspectionSession[]) {
  return sortSessionsByDateDesc(siteSessions);
}

export function getBadWorkplaceSelectableFindings(session: InspectionSession | null) {
  if (!session) return [];
  return session.document7Findings.filter((finding) => isMeaningfulDocument7Finding(finding));
}

/** 요약·목록에 표시할 문서7 지적 건수 (분기 보고서 이행현황과 동일한 실질 내용 기준) */
export function countDocument7FindingsForDisplay(session: InspectionSession | null): number {
  if (!session) return 0;
  return countMeaningfulDocument7Findings(session);
}

/** 개요에 입력된 진행률이 없으면 섹션 완료율(%)을 사용 */
export function formatSessionProgressRateDisplay(session: InspectionSession | null): string {
  if (!session) return '-';
  const raw = session.document2Overview.progressRate?.trim();
  if (raw) {
    return /%$/.test(raw) ? raw : `${raw}%`;
  }
  const pct = getSessionProgress(session).percentage;
  return `${pct}%`;
}

export function buildBadWorkplaceViolations(
  session: InspectionSession | null,
  findingIds?: string[],
): BadWorkplaceViolation[] {
  if (!session) return [];
  if (findingIds && findingIds.length === 0) return [];

  const findings = getBadWorkplaceSelectableFindings(session).filter(
    (finding) => !findingIds || findingIds.includes(finding.id),
  );

  return findings.map((finding) => ({
    id: generateId('bad-workplace-item'),
    sourceFindingId: finding.id,
    legalReference:
      finding.legalReferenceTitle ||
      finding.referenceMaterial2 ||
      finding.referenceMaterial1,
    hazardFactor:
      finding.emphasis ||
      finding.metadata ||
      finding.location ||
      finding.accidentType,
    improvementMeasure: finding.improvementPlan,
    nonCompliance:
      '기술지도 이후에도 동일 유해위험요인이 개선되지 않아 후속 조치가 필요합니다.',
    confirmationDate: getSessionGuidanceDate(session),
    accidentType: finding.accidentType,
    causativeAgentKey: finding.causativeAgentKey,
  }));
}

export function syncBadWorkplaceReportSource(
  report: BadWorkplaceReport,
  session: InspectionSession | null,
  selectedFindingIds?: string[],
): BadWorkplaceReport {
  const violations = buildBadWorkplaceViolations(session, selectedFindingIds);

  return {
    ...report,
    progressRate: session?.document2Overview.progressRate || '',
    implementationCount:
      session?.document2Overview.visitCount || report.implementationCount,
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
  if (existing) {
    return existing;
  }

  const timestamp = createTimestamp();
  const sourceSession = getBadWorkplaceSourceSessions(siteSessions)[0] || null;
  const violations = buildBadWorkplaceViolations(sourceSession);

  return {
    id: buildBadWorkplaceReportKey(site.id, reportMonth, reporter?.id || 'anonymous'),
    siteId: site.id,
    title: `${reportMonth} 불량사업장 신고서`,
    reportKind: BAD_WORKPLACE_REPORT_KIND,
    reportMonth,
    status: 'draft',
    controllerReview: null,
    reporterUserId: reporter?.id || '',
    reporterName: reporter?.name || '',
    receiverName: site.adminSiteSnapshot.siteManagerName,
    progressRate: sourceSession?.document2Overview.progressRate || '',
    implementationCount:
      sourceSession?.document2Overview.visitCount || String(siteSessions.length || ''),
    contractPeriod: site.adminSiteSnapshot.constructionPeriod,
    agencyName: reporter?.organization_name || DEFAULT_GUIDANCE_AGENCY,
    agencyRepresentative: reporter?.name || '',
    agencyAddress: site.adminSiteSnapshot.headquartersAddress,
    agencyContact: reporter?.phone || site.adminSiteSnapshot.headquartersContact,
    sourceSessionId: sourceSession?.id || '',
    sourceFindingIds: violations.map((item) => item.sourceFindingId),
    violations,
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
