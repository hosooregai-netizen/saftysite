import type { InspectionSession } from '@/types/inspectionSession';

/**
 * 분기 종합보고서·불량사업장 신고 등에서 동일하게 쓰는 문서 7 지적 건수 기준.
 * (법령·참고자료만 채운 지적도 실질 건수로 포함)
 */
export function isMeaningfulDocument7Finding(
  finding: InspectionSession['document7Findings'][number],
): boolean {
  return Boolean(
    finding.location ||
      finding.emphasis ||
      finding.improvementPlan ||
      finding.accidentType ||
      finding.causativeAgentKey ||
      finding.metadata ||
      finding.legalReferenceTitle ||
      finding.referenceMaterial1 ||
      finding.referenceMaterial2,
  );
}

export function countMeaningfulDocument7Findings(session: InspectionSession): number {
  return session.document7Findings.filter(isMeaningfulDocument7Finding).length;
}
