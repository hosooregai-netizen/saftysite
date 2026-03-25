import { hasFindingContent } from '@/components/session/workspace/utils';
import type { ChartEntry } from '@/components/session/workspace/utils';
import type { InspectionSession } from '@/types/inspectionSession';
import { clampDoc5SummaryText } from '@/lib/openai/doc5SummaryPrompt';

const MAX = 500;

/** 규칙 기반 초안 — AI와 동일한 3줄 포맷 */
export function buildLocalDoc5SummaryDraft(
  session: InspectionSession,
  currentAccidentEntries: ChartEntry[],
  currentAgentEntries: ChartEntry[]
): string {
  const findings = session.document7Findings.filter(hasFindingContent);
  if (findings.length === 0) {
    return '문서 7에 분석된 위험요인이 아직 없어 기술지도 총평 초안을 만들 수 없습니다.';
  }

  const topAccidents = currentAccidentEntries.filter((item) => item.count > 0).slice(0, 2);
  const topAgents = currentAgentEntries.filter((item) => item.count > 0).slice(0, 2);

  const trendParts: string[] = [`금회 주요 위험요인 ${findings.length}건이 확인됨.`];
  if (topAccidents.length > 0) {
    trendParts.push(`지적유형은 ${topAccidents.map((i) => `${i.label} ${i.count}건`).join(', ')}.`);
  }
  if (topAgents.length > 0) {
    trendParts.push(`기인물은 ${topAgents.map((i) => `${i.label} ${i.count}건`).join(', ')} 중심.`);
  }
  const line1 = `【지적·기인물 경향】 ${trendParts.join(' ')}`;

  const focusLines = findings.slice(0, 2).map((item) => {
    const location = item.location || '주요 작업구간';
    const hazard = item.emphasis || item.accidentType || '위험요인';
    const action = item.improvementPlan || '즉시 시정과 보호조치 강화가 필요함';
    return `${location}에서 ${hazard}가 확인되어 ${action}`;
  });
  const line2 = `【세부 지적 요지】 ${focusLines.join(' 또한 ')}`;

  const line3 =
    '【조치·관리 권고】 작업 전 위험성평가, 보호구 착용 확인, 작업구간 정리정돈과 즉시 시정조치를 병행하는 현장 관리가 필요함.';

  const out = `${line1}\n${line2}\n${line3}`;
  return clampDoc5SummaryText(out, MAX);
}
