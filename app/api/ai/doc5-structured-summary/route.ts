import { NextResponse } from 'next/server';
import { openAiChat, resolveOpenAiApiKey } from '@/lib/openai';
import type { ChartEntry } from '@/components/session/workspace/utils';
import type { CurrentHazardFinding, FutureProcessRiskPlan } from '@/types/inspectionSession';
import type { Doc5StructuredSummaryPayload } from '@/lib/openai/doc5SummaryLocalDraft';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Doc5StructuredSummaryResponseShape {
  progressOverview?: string;
  accidentTrend?: string;
  findingCase?: string;
  workEnvironmentRisk?: string;
  futureProcessFocus?: string;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const normalized = text.trim();

  try {
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start < 0 || end <= start) return null;

    try {
      return JSON.parse(normalized.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function sanitizeLine(value: string) {
  return value
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/^(공정율|공정률|계절|근로자|재해유형|추세|지적사례|작업환경|공정내 위험|향후공정|중점관리)\s*[:：-]?\s*/g, '')
    .replace(/\s*입니다\.?$/g, '')
    .replace(/\s*합니다\.?$/g, '')
    .replace(/\s*됩니다\.?$/g, '')
    .replace(/\s*필요합니다\.?$/g, ' 필요')
    .replace(/\s*요구됩니다\.?$/g, ' 요구')
    .replace(/\s*예정입니다\.?$/g, ' 예정')
    .replace(/\s*존재합니다\.?$/g, ' 존재')
    .replace(/\s*\.$/g, '')
    .trim();
}

function summarizeEntries(entries: ChartEntry[]) {
  return entries
    .filter((entry) => entry.count > 0)
    .slice(0, 3)
    .map((entry) => `${entry.label} ${entry.count}건`)
    .join(', ');
}

function summarizeFindings(findings: CurrentHazardFinding[]) {
  return findings.slice(0, 4).map((finding) => ({
    location: finding.location,
    accidentType: finding.accidentType,
    emphasis: finding.emphasis,
    hazardDescription: finding.hazardDescription,
    improvementPlan: finding.improvementPlan,
    riskLevel: finding.riskLevel,
  }));
}

function summarizeFuturePlans(futurePlans: FutureProcessRiskPlan[]) {
  return futurePlans.slice(0, 3).map((plan) => ({
    processName: plan.processName,
    hazard: plan.hazard,
    countermeasure: plan.countermeasure,
    note: plan.note,
  }));
}

function buildPromptLines(payload: Doc5StructuredSummaryPayload) {
  const lines = ['아래 기술지도 보고서 정보를 바탕으로 doc5 총평을 구조화해줘.'];

  if (payload.siteName) lines.push(`현장명: ${payload.siteName}`);
  if (payload.reportDate) lines.push(`보고일자: ${payload.reportDate}`);
  if (payload.progressRate) lines.push(`공정률: ${payload.progressRate}`);
  if (payload.workerCount) lines.push(`출역 근로자수: ${payload.workerCount}`);
  if (payload.processWorkContent) lines.push(`현재 작업공정: ${payload.processWorkContent}`);
  if (payload.processSurroundings) lines.push(`주변환경: ${payload.processSurroundings}`);

  const currentAccidents = summarizeEntries(payload.currentAccidentEntries);
  const cumulativeAccidents = summarizeEntries(payload.cumulativeAccidentEntries);
  const currentAgents = summarizeEntries(payload.currentAgentEntries);
  const cumulativeAgents = summarizeEntries(payload.cumulativeAgentEntries);
  const findingSummary = summarizeFindings(payload.findings);
  const futurePlanSummary = summarizeFuturePlans(payload.futurePlans);

  if (currentAccidents) lines.push(`금회 재해유형 통계: ${currentAccidents}`);
  if (cumulativeAccidents) lines.push(`누적 재해유형 통계: ${cumulativeAccidents}`);
  if (currentAgents) lines.push(`금회 기인물 통계: ${currentAgents}`);
  if (cumulativeAgents) lines.push(`누적 기인물 통계: ${cumulativeAgents}`);
  if (findingSummary.length > 0) lines.push(`문서7 지적사항: ${JSON.stringify(findingSummary)}`);
  if (futurePlanSummary.length > 0) lines.push(`문서8 향후공정: ${JSON.stringify(futurePlanSummary)}`);

  lines.push('입력되지 않은 값은 억지로 언급하지 말고 자연스럽게 생략해줘.');
  lines.push('"미입력", "자료 없음", "누락" 같은 표현을 본문에 쓰지 말아줘.');
  lines.push('반드시 JSON만 반환해줘.');

  return lines.join('\n');
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (!resolveOpenAiApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않아 총평 AI 생성을 진행할 수 없습니다.' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Doc5StructuredSummaryPayload;
    const payload: Doc5StructuredSummaryPayload = {
      siteName: body.siteName?.trim() || '',
      reportDate: body.reportDate?.trim() || '',
      progressRate: body.progressRate?.trim() || '',
      workerCount: body.workerCount?.trim() || '',
      processWorkContent: body.processWorkContent?.trim() || '',
      processSurroundings: body.processSurroundings?.trim() || '',
      currentAccidentEntries: Array.isArray(body.currentAccidentEntries) ? body.currentAccidentEntries : [],
      cumulativeAccidentEntries: Array.isArray(body.cumulativeAccidentEntries)
        ? body.cumulativeAccidentEntries
        : [],
      currentAgentEntries: Array.isArray(body.currentAgentEntries) ? body.currentAgentEntries : [],
      cumulativeAgentEntries: Array.isArray(body.cumulativeAgentEntries)
        ? body.cumulativeAgentEntries
        : [],
      findings: Array.isArray(body.findings) ? body.findings : [],
      futurePlans: Array.isArray(body.futurePlans) ? body.futurePlans : [],
    };

    const completion = await openAiChat(
      [
        {
          role: 'system',
          content: `
너는 건설현장 기술지도 보고서 5번 문서의 총평을 작성하는 한국어 안전전문가다.

반드시 아래 5개 항목만 작성한다.
- progressOverview
- accidentTrend
- findingCase
- workEnvironmentRisk
- futureProcessFocus

작성 규칙:
- JSON만 반환한다.
- 각 값은 한 줄짜리 짧은 한국어 문장 1개다.
- 각 값은 보고서 메모처럼 명사형으로 마무리한다.
- "~입니다", "~합니다", "~됩니다" 같은 서술형 종결은 쓰지 않는다.
- 공정률, 재해유형, 지적사례, 추세, 계절, 근로자, 작업환경, 공정내 위험, 향후공정을 반영한다.
- 문장 앞에 "공정률:", "재해유형:" 같은 라벨을 붙이지 않는다.
- 입력되지 않은 값은 자연스럽게 생략하고, "미입력", "자료 없음", "누락" 같은 표현을 문장에 쓰지 않는다.
- 제공된 자료만 사용하고 없는 사실은 지어내지 않는다.
- workEnvironmentRisk 또는 futureProcessFocus에는 반드시 "추락 위험" 또는 "추락 위험요인"을 직접 포함한다.
- 보고서 문체로 쓰고, 불필요한 서론·결론·번호·마크다운은 쓰지 않는다.

출력 예시:
{
  "progressOverview": "철거작업 진행 구간, 6명 근로자 투입 상태의 집중관리 필요",
  "accidentTrend": "금회 추락·감전 중심, 누적 추락 반복 양상의 위험유형 분포",
  "findingCase": "임시 작업발판 사용 구간의 추락 위험 지적, 안전한 작업발판 확보 필요",
  "workEnvironmentRisk": "바닥 단차와 개구부가 혼재된 작업환경으로 추락 위험 상존",
  "futureProcessFocus": "향후 자재 반입 작업 시 중량물 낙하와 추락 위험요인 점검 필요"
}
          `.trim(),
        },
        {
          role: 'user',
          content: buildPromptLines(payload),
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 420,
      },
    );

    const parsed = extractJsonObject(completion) as Doc5StructuredSummaryResponseShape | null;
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 총평 응답을 해석하지 못했습니다. 다시 시도해 주세요.' },
        { status: 502 },
      );
    }

    const values = [
      typeof parsed.progressOverview === 'string' ? parsed.progressOverview : '',
      typeof parsed.accidentTrend === 'string' ? parsed.accidentTrend : '',
      typeof parsed.findingCase === 'string' ? parsed.findingCase : '',
      typeof parsed.workEnvironmentRisk === 'string' ? parsed.workEnvironmentRisk : '',
      typeof parsed.futureProcessFocus === 'string' ? parsed.futureProcessFocus : '',
    ].map(sanitizeLine);

    if (values.some((value) => !value.trim())) {
      return NextResponse.json(
        { error: 'AI 총평 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.' },
        { status: 502 },
      );
    }

    if (!values.some((line) => line.includes('추락 위험') || line.includes('추락 위험요인'))) {
      values[4] = `${values[4]} 추락 위험요인 점검 필요`;
    }

    return NextResponse.json({ text: values.join('\n') });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '총평 AI 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
