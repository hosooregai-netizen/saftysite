import type {
  GenerateTechnicalGuidancePhotoDraftInput,
  TechnicalGuidancePhotoObservation,
  TechnicalGuidancePreviousReportSummary,
} from '@/types/legacyTechnicalGuidance';

function formatObservation(item: TechnicalGuidancePhotoObservation, index: number) {
  const lines = [
    `${index + 1}. photoId=${item.photoId}`,
    `intent=${item.intent}`,
    `caption=${item.caption || '(empty)'}`,
    `hazards=${item.observedHazards.join(', ') || '(none)'}`,
    `location=${item.locationHint || '(unknown)'}`,
    `confidence=${item.confidence}`,
  ];
  if (item.observedText?.trim()) {
    lines.push(`observedText=${item.observedText.trim()}`);
  }
  return lines.join(' | ');
}

function formatPreviousReport(item: TechnicalGuidancePreviousReportSummary, index: number) {
  return [
    `${index + 1}. report=${item.legacyReportId}`,
    `date=${item.reportDate}`,
    `site=${item.siteName}`,
    `variant=${item.variantProfileId}`,
    `doc5=${item.doc5Summary || '(empty)'}`,
    `keywords=${item.findingKeywords.join(', ') || '(none)'}`,
  ].join(' | ');
}

export const TECHNICAL_GUIDANCE_PHOTO_DRAFT_SYSTEM_PROMPT = `
당신은 건설현장 기술지도 보고서 초안 작성 보조입니다.

목표:
- 기존 보고서를 복사하지 않고, 제공된 새 사진 관찰값을 기준으로 새 기술지도 보고서 초안을 만듭니다.
- 이전 보고서는 문체, 반복 위험 패턴, 체크 포인트 참고용으로만 사용합니다.
- 입력에 없는 현장 고유 사실, 법령 번호, 수치, 계측값은 지어내지 마세요.
- 최종 업무용 양식은 기존 HWPX 템플릿이 담당하므로, 당신은 섹션별 구조 초안만 반환합니다.

출력 규칙:
- 반드시 JSON만 반환합니다.
- 키는 정확히 다음만 사용합니다:
  doc3Scenes, doc5SummaryHint, doc7Findings, doc10Measurements, doc11EducationRecords, doc12Activities, reviewChecklist, lowConfidenceFields, warnings
- doc3Scenes는 최대 6개, doc7Findings는 최대 5개로 제한합니다.
- doc7Findings는 사진 근거가 약하면 lowConfidenceFields와 warnings에 명시합니다.
- 이전 보고서 내용을 그대로 베끼지 마세요.
`.trim();

export function buildTechnicalGuidancePhotoDraftUserContent(
  input: GenerateTechnicalGuidancePhotoDraftInput,
): string {
  const site = input.site ?? {};
  const meta = input.reportMeta ?? {};
  const observations = input.photoObservations
    .map((item, index) => formatObservation(item, index))
    .join('\n');
  const previousReports = input.previousReports
    .map((item, index) => formatPreviousReport(item, index))
    .join('\n');

  return [
    '다음 자료를 근거로 새 기술지도 보고서 섹션 초안을 만드세요.',
    '',
    `[site] siteName=${site.siteName ?? ''} customerName=${site.customerName ?? ''} assigneeName=${site.assigneeName ?? ''}`,
    `[reportMeta] ${JSON.stringify(meta, null, 0)}`,
    `[variantProfileId] ${input.variantProfileId}`,
    `[formatContractId] ${input.formatContractId}`,
    '',
    '[photoObservations]',
    observations || '(none)',
    '',
    '[previousReportsForStyleOnly]',
    previousReports || '(none)',
    '',
    'doc3Scenes는 현장 전경/작업 장면 요약, doc7Findings는 위험요인 지적, doc10/doc11/doc12는 사진 근거가 있을 때만 보수적으로 채우세요.',
  ].join('\n');
}
