import { NextResponse } from 'next/server';
import { openAiChat, resolveOpenAiApiKey } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Doc2ProcessNotesRequestBody {
  processWorkContent?: string;
  processWorkerCount?: string;
  processEquipment?: string;
  processTools?: string;
  processHazardousMaterials?: string;
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

export async function POST(request: Request): Promise<Response> {
  try {
    if (!resolveOpenAiApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않아 AI 위험요인을 생성할 수 없습니다.' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Doc2ProcessNotesRequestBody;
    const payload = {
      processWorkContent: body.processWorkContent?.trim() || '',
      processWorkerCount: body.processWorkerCount?.trim() || '',
      processEquipment: body.processEquipment?.trim() || '',
      processTools: body.processTools?.trim() || '',
      processHazardousMaterials: body.processHazardousMaterials?.trim() || '',
    };

    const completion = await openAiChat(
      [
        {
          role: 'system',
          content: [
            '너는 건설현장 기술지도 보고서의 "주요 위험 요인"만 작성하는 한국어 안전전문가다.',
            '입력으로 주어지는 값은 작업현재 공정, 작업 인원, 건설기계 장비, 유해위험기구, 유해위험물질이다.',
            '입력값을 바탕으로 주요 위험 요인 문장만 생성한다.',
            '공사개요, 설명문, 제목, 번호, 서론, 대책, 예방조치, 마크다운은 절대 쓰지 않는다.',
            '반드시 JSON만 반환하고 키는 risk_lines만 사용한다.',
            'risk_lines는 정확히 2개의 짧은 한국어 문장 배열이어야 한다.',
            '각 문장은 실제 현장 보고서 문체로 짧고 단정하게 작성하고, 가능하면 "위험"으로 끝낸다.',
            '문장은 "~ 작업 중 ~로 인한 ~ 위험", "~ 사용 중 ~ 미준수로 인한 ~ 위험", "~ 노출로 인한 ~ 질환 위험" 패턴을 우선 사용한다.',
            '"위험이 있다", "위험이 존재한다" 같은 서술형 표현은 사용하지 않는다.',
            '입력에 있는 공정, 장비, 기구, 물질과 직접 연결되는 위험만 쓴다.',
            '없는 정보를 지어내지 않는다.',
            '추상적인 표현보다 구체적인 위험 상황을 쓴다.',
            '가능하면 추락, 충돌, 협착, 절단/베임, 화재/폭발, 감전, 호흡기 질환, 근골격계 질환 중 해당되는 위험을 반영한다.',
            '가능하면 다음 표현을 우선 활용한다: 추락 위험, 충돌 위험, 협착 위험, 절단, 베임 위험, 화재 위험, 화재, 폭발 위험, 감전 위험, 호흡기 질환 위험, 근골격계 질환 위험, 전도 위험, 붕괴 위험, 맞음 위험.',
            '가능하면 다음 조건 표현을 우선 활용한다: 안전대 미착용, 안전고리 미체결, 아웃트리거 미설치, 2인1조 작업 미준수, 신호수, 유도자 미배치, 방호장치 미설치, 불티 비산, 개인보호구 미착용, 작업발판 미설치, 안전난간 미설치, 출입통제 미흡, 이동경로 이탈, 유해물질 노출, 분진 발생, 용접흄 노출.',
            '고소작업대, 비계, 말비계, 이동식 사다리, 단부, 상부작업, 작업발판 관련 맥락이 보이면 추락 위험을 우선 고려한다.',
            '굴착기, 트럭, 덤프트럭, 롤러, 집게차 등 차량계 장비가 보이면 충돌 또는 협착 위험을 우선 고려한다.',
            '용접기, 연삭기, 절단기, 브레이커, 전기톱 등이 보이면 화재, 절단/베임, 비산물, 근골격계 위험을 우선 고려한다.',
            '페인트, LPG, 산소, 아르곤, 용접봉, 시멘트, 몰탈 등이 보이면 화재/폭발, 유해물질 노출, 호흡기 위험을 우선 고려한다.',
            '같은 의미를 반복하지 않는다.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            '다음 입력만 보고 주요 위험 요인 문장만 생성해줘.',
            `작업현재 공정: ${payload.processWorkContent || '해당없음'}`,
            `작업 인원: ${payload.processWorkerCount || '해당없음'}`,
            `건설기계 장비: ${payload.processEquipment || '해당없음'}`,
            `유해위험기구: ${payload.processTools || '해당없음'}`,
            `유해위험물질: ${payload.processHazardousMaterials || '해당없음'}`,
            '조건:',
            '- risk_lines는 정확히 2개',
            '- 각 문장은 한 줄짜리',
            '- 번호를 붙이지 말 것',
            '- 제목을 쓰지 말 것',
            '- 문장끼리 의미 중복 금지',
            '- JSON만 반환할 것',
          ].join('\n'),
        },
      ],
      {
        temperature: 0.4,
        maxTokens: 220,
      },
    );

    const parsed = extractJsonObject(completion);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.' },
        { status: 502 },
      );
    }

    const riskLines = Array.isArray(parsed.risk_lines)
      ? parsed.risk_lines.filter((item): item is string => typeof item === 'string').slice(0, 2)
      : [];

    if (riskLines.length !== 2) {
      return NextResponse.json(
        { error: 'AI가 주요 위험 요인 2개를 정확히 생성하지 못했습니다. 다시 시도해 주세요.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ riskLines });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'AI 위험요인 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
