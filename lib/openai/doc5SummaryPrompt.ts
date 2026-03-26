import { CAUSATIVE_AGENT_LABELS } from '@/components/session/workspace/constants';
import type { ChartEntry } from '@/components/session/workspace/utils';
import type { CurrentHazardFinding } from '@/types/inspectionSession';

export const DOC5_SUMMARY_SYSTEM_PROMPT = `
당신은 건설현장 기술지도 결과보고서용 「기술지도 총평」 작성 보조입니다.

사용자 메시지의 [5. 지적유형·기인물 통계]와 [7. 세부 지적]만 근거로 작성하세요. 입력에 없는 사실·수치·현장명은 지어내지 마세요.

[출력 형식 — 반드시 아래 3줄만, 줄바꿈(\\n)으로 구분]
1행: 【지적·기인물 경향】 금회·누적 통계에서 드러나는 지적유형·기인물 경향을 한 문장으로 요약 (집계가 없으면 "집계 없음" 수준으로만 표현)
2행: 【세부 지적 요지】 문서7 세부 지적의 위치·위험·개선 방향을 1~2문장으로 요약
3행: 【조치·관리 권고】 종합 권고를 한 문장으로 (위험성평가·시정조치·현장 관리 등)

[형식 규칙]
- 【】 괄호와 레이블(지적·기인물 경향 / 세부 지적 요지 / 조치·관리 권고)은 반드시 유지.
- 3줄 외의 문장·머리말·맺음말을 추가하지 마세요.
- 마크다운(#, *, - 목록), 번호 매기기 금지.
- 한국어, 보고서체.
- 공백 포함 500자 이내(반드시 준수).
`.trim();

export type Doc5SummaryPromptInput = {
  currentAccidentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  findings: CurrentHazardFinding[];
};

function formatChartBlock(title: string, entries: ChartEntry[]): string {
  const lines = entries.filter((e) => e.count > 0).map((e) => `${e.label}: ${e.count}건`);
  const body = lines.length > 0 ? lines.join('\n') : '집계된 건수 없음';
  return `### ${title}\n${body}`;
}

function causativeLabel(key: CurrentHazardFinding['causativeAgentKey']): string {
  if (!key) return '';
  return CAUSATIVE_AGENT_LABELS[key] ?? key;
}

function formatFindingBlock(findings: CurrentHazardFinding[]): string {
  if (findings.length === 0) {
    return '(세부 지적 없음)';
  }
  return findings
    .map((f, index) => {
      const agent = causativeLabel(f.causativeAgentKey);
      const parts = [
        f.location?.trim() && `위치: ${f.location.trim()}`,
        f.accidentType?.trim() && `지적유형(재해형태): ${f.accidentType.trim()}`,
        agent && `기인물: ${agent}`,
        f.riskLevel?.trim() && `위험등급: ${f.riskLevel.trim()}`,
        f.emphasis?.trim() && `중점사항: ${f.emphasis.trim()}`,
        f.improvementPlan?.trim() && `개선계획: ${f.improvementPlan.trim()}`,
      ].filter(Boolean);
      return `${index + 1}. ${parts.join(' / ')}`;
    })
    .join('\n');
}

/** 모델에 넣을 사용자 메시지 본문(통계 + 세부 지적). */
export function buildDoc5SummaryUserContent(input: Doc5SummaryPromptInput): string {
  const { currentAccidentEntries, cumulativeAccidentEntries, currentAgentEntries, cumulativeAgentEntries, findings } =
    input;

  const stats = [
    formatChartBlock('지적유형별 금회', currentAccidentEntries),
    formatChartBlock('지적유형별 누적', cumulativeAccidentEntries),
    formatChartBlock('기인물별 금회', currentAgentEntries),
    formatChartBlock('기인물별 누적', cumulativeAgentEntries),
  ].join('\n\n');

  const detail = formatFindingBlock(findings);

  return [
    '다음 자료만 참고하여 기술지도 총평을 작성하세요.',
    '',
    '[5. 지적유형·기인물 통계]',
    stats,
    '',
    '[7. 현존 유해·위험요인 세부 지적 (금회 입력분)]',
    detail,
  ].join('\n');
}

/** 모델이 길이를 넘겼을 때 안전하게 자릅니다. */
export function clampDoc5SummaryText(text: string, maxChars: number): string {
  const t = text.replace(/\r\n/g, '\n').trim();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars);
}

/** 연속 빈 줄 정리 등 가벼운 정규화 */
export function normalizeDoc5SummaryOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

