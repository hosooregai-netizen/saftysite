import type { ChartEntry } from '@/components/session/workspace/utils';
import { hasFindingContent, normalizeText } from '@/components/session/workspace/utils';
import type {
  CurrentHazardFinding,
  FutureProcessRiskPlan,
  InspectionSession,
} from '@/types/inspectionSession';

const MAX_DOC5_SUMMARY_LENGTH = 700;

export interface Doc5StructuredSummaryPayload {
  siteName: string;
  reportDate: string;
  progressRate: string;
  workerCount: string;
  processWorkContent: string;
  processSurroundings: string;
  currentAccidentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  findings: CurrentHazardFinding[];
  futurePlans: FutureProcessRiskPlan[];
}

function clampSummaryText(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= MAX_DOC5_SUMMARY_LENGTH) {
    return normalized;
  }

  return normalized.slice(0, MAX_DOC5_SUMMARY_LENGTH).trim();
}

function formatTopEntries(entries: ChartEntry[], limit = 2) {
  const filtered = entries.filter((entry) => entry.count > 0).slice(0, limit);
  if (filtered.length === 0) {
    return '';
  }

  return filtered.map((entry) => `${entry.label} ${entry.count}건`).join(', ');
}

function deriveSeason(reportDate: string) {
  const monthText = normalizeText(reportDate).slice(5, 7);
  const month = Number.parseInt(monthText, 10);

  if (month >= 3 && month <= 5) return '봄철';
  if (month >= 6 && month <= 8) return '하절기';
  if (month >= 9 && month <= 11) return '가을철';
  if (month === 12 || month === 1 || month === 2) return '동절기';
  return '계절 특성';
}

function pickRepresentativeFinding(findings: CurrentHazardFinding[]) {
  const scored = findings
    .filter(hasFindingContent)
    .map((finding) => {
      const riskScore =
        (Number.parseInt(normalizeText(finding.riskLevel), 10) || 0) * 10 +
        (normalizeText(finding.accidentType).includes('추락') ? 5 : 0) +
        (normalizeText(finding.emphasis).includes('추락') ? 5 : 0);

      return { finding, riskScore };
    })
    .sort((left, right) => right.riskScore - left.riskScore);

  return scored[0]?.finding ?? null;
}

function summarizeEnvironment(
  session: InspectionSession,
  findings: CurrentHazardFinding[],
) {
  const surroundings = normalizeText(session.document2Overview.processSurroundings);
  if (surroundings) {
    return surroundings;
  }

  const locations = findings
    .map((finding) => normalizeText(finding.location))
    .filter(Boolean)
    .slice(0, 2);
  if (locations.length > 0) {
    return locations.join(', ');
  }

  return '현장 작업구간';
}

function summarizeCurrentRisks(findings: CurrentHazardFinding[]) {
  const risks = findings
    .flatMap((finding) => [
      normalizeText(finding.accidentType),
      normalizeText(finding.emphasis),
      normalizeText(finding.hazardDescription),
    ])
    .filter(Boolean);

  const uniqueRisks = Array.from(new Set(risks));
  if (uniqueRisks.length === 0) {
    return '주요 위험요인 점검 필요';
  }

  return uniqueRisks.slice(0, 2).join(', ');
}

function summarizeFuturePlan(futurePlans: FutureProcessRiskPlan[]) {
  const primaryPlan = futurePlans.find(
    (plan) =>
      normalizeText(plan.processName) ||
      normalizeText(plan.hazard) ||
      normalizeText(plan.countermeasure),
  );

  if (!primaryPlan) {
    return '향후공정 계획은 미정이나 추락 위험요인 점검은 선제적으로 병행해야 합니다.';
  }

  const processName = normalizeText(primaryPlan.processName) || '향후 공정';
  const hazard = normalizeText(primaryPlan.hazard) || '위험요인 관리';
  const countermeasure = normalizeText(primaryPlan.countermeasure);
  const base = `${processName} 예정으로 ${hazard} 관리가 필요합니다.`;

  if (countermeasure && countermeasure.includes('추락')) {
    return `${base} ${countermeasure}`;
  }

  return `${base} 추락 위험요인 점검과 작업발판 확인을 함께 진행해야 합니다.`;
}

function ensureFallRiskMention(text: string) {
  if (text.includes('추락')) {
    return text;
  }

  return `${text} 추락 위험요인 점검 필요`;
}

function toNounEnding(text: string) {
  return text
    .replace(/\s*입니다\.?$/g, '')
    .replace(/\s*됩니다\.?$/g, '')
    .replace(/\s*필요합니다\.?$/g, ' 필요')
    .replace(/\s*요구됩니다\.?$/g, ' 요구')
    .replace(/\s*우려됩니다\.?$/g, ' 우려')
    .replace(/\s*예정입니다\.?$/g, ' 예정')
    .replace(/\s*중심입니다\.?$/g, ' 중심')
    .replace(/\s*흐름입니다\.?$/g, ' 흐름')
    .replace(/\s*\.$/g, '')
    .trim();
}

export function buildDoc5StructuredSummaryPayload(
  session: InspectionSession,
  currentAccidentEntries: ChartEntry[],
  currentAgentEntries: ChartEntry[],
  cumulativeAccidentEntries: ChartEntry[],
  cumulativeAgentEntries: ChartEntry[],
): Doc5StructuredSummaryPayload {
  return {
    siteName: normalizeText(session.meta.siteName),
    reportDate: normalizeText(session.meta.reportDate),
    progressRate: normalizeText(session.document2Overview.progressRate),
    workerCount: normalizeText(session.document2Overview.processWorkerCount),
    processWorkContent: normalizeText(session.document2Overview.processWorkContent),
    processSurroundings: normalizeText(session.document2Overview.processSurroundings),
    currentAccidentEntries,
    cumulativeAccidentEntries,
    currentAgentEntries,
    cumulativeAgentEntries,
    findings: session.document7Findings.filter(hasFindingContent),
    futurePlans: session.document8Plans.filter(
      (plan) =>
        Boolean(
          normalizeText(plan.processName) ||
            normalizeText(plan.hazard) ||
            normalizeText(plan.countermeasure),
        ),
    ),
  };
}

export function buildLocalDoc5SummaryDraft(
  session: InspectionSession,
  currentAccidentEntries: ChartEntry[],
  currentAgentEntries: ChartEntry[],
  cumulativeAccidentEntries: ChartEntry[],
  cumulativeAgentEntries: ChartEntry[],
): string {
  const findings = session.document7Findings.filter(hasFindingContent);
  if (findings.length === 0) {
    return clampSummaryText(
      [
        '공정률과 출역 근로자 정보 확인 후 현재 공정 전반에 대한 요약 필요',
        '문서7 지적사항 부족으로 재해유형 및 추세 분석 자료 보완 필요',
        '대표 지적사례 확인 전 단계로 주요 위험구간 재점검 필요',
        '현재 작업환경과 공정내 위험요인 전반에 대한 재확인 필요',
        '향후공정 검토와 함께 추락 위험요인 우선 점검 필요',
      ].join('\n'),
    );
  }

  const payload = buildDoc5StructuredSummaryPayload(
    session,
    currentAccidentEntries,
    currentAgentEntries,
    cumulativeAccidentEntries,
    cumulativeAgentEntries,
  );

  const season = deriveSeason(payload.reportDate);
  const topCurrentAccidents = formatTopEntries(payload.currentAccidentEntries);
  const topCumulativeAccidents = formatTopEntries(payload.cumulativeAccidentEntries);
  const topAgents = formatTopEntries(payload.currentAgentEntries);
  const representativeFinding = pickRepresentativeFinding(payload.findings);
  const environment = summarizeEnvironment(session, payload.findings);
  const currentRisks = summarizeCurrentRisks(payload.findings);
  const futureLine = ensureFallRiskMention(summarizeFuturePlan(payload.futurePlans));

  const progressText = payload.progressRate
    ? `공정율 ${payload.progressRate}`
    : '공정율 미입력';
  const workerText = payload.workerCount
    ? `출역 근로자 ${payload.workerCount}명`
    : '근로자 수 확인 필요';
  const processText = payload.processWorkContent || '주요 공정 확인 필요';

  const line1 = `${progressText}, ${season}, ${workerText} 조건에서 ${processText} 중심 관리 필요`;
  const line2 = `금회 ${topCurrentAccidents || '재해유형 집계 없음'} 중심, 누적 ${topCumulativeAccidents || '추세 자료 없음'} 흐름${topAgents ? `, 기인물 ${topAgents} 비중` : ''}`;
  const line3 = representativeFinding
    ? `${normalizeText(representativeFinding.location) || '주요 작업구간'}에서 ${normalizeText(representativeFinding.emphasis) || normalizeText(representativeFinding.accidentType) || '위험요인'} 관련 지적 확인, ${normalizeText(representativeFinding.improvementPlan) || '즉시 개선조치'} 중심 대응 필요`
    : '대표 지적사례 확인 전 단계로 주요 위험구간 중심 관리 필요';
  const line4Base = `${environment} 조건에서 ${currentRisks} 중심 관리 필요`;
  const line4 = ensureFallRiskMention(line4Base);
  const line5 = futureLine;

  return clampSummaryText(
    [line1, line2, line3, line4, line5].map(toNounEnding).join('\n'),
  );
}
