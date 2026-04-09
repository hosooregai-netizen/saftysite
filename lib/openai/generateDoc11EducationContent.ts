'use client';

export interface Doc11EducationGenerationInput {
  topic: string;
  attendeeCount: string;
  materialName: string;
  photoUrl?: string;
}

function normalizeCount(value: string) {
  const digits = value.replace(/[^\d]/g, '').trim();
  return digits || value.trim();
}

function buildRiskAndMeasureByTopic(topic: string) {
  const normalized = topic.replace(/\s+/g, '').toLowerCase();

  if (normalized.includes('추락') || normalized.includes('고소') || normalized.includes('비계') || normalized.includes('사다리')) {
    return {
      shortTopic: '추락주의',
      risks: '높은 작업장, 불안정한 발판, 안전장치 미비',
      measures: '안전대 착용, 작업 전 점검, 안전망 설치',
      caseText:
        '고소작업 중 작업발판 고정이 미흡한 상태에서 근로자가 균형을 잃고 추락할 수 있으므로, 작업 전 작업발판 상태와 안전대 체결 여부를 확인할 것.',
    };
  }

  if (normalized.includes('감전') || normalized.includes('전기') || normalized.includes('배선')) {
    return {
      shortTopic: '감전주의',
      risks: '노출 배선, 임시전원 사용, 접지 불량',
      measures: '전원 차단, 절연보호구 착용, 배선 상태 점검',
      caseText:
        '임시배선 피복 손상 상태에서 작업 중 감전사고가 발생할 수 있으므로, 작업 전 전원 차단과 누전차단기 작동 상태를 확인할 것.',
    };
  }

  if (normalized.includes('화재') || normalized.includes('용접') || normalized.includes('불티') || normalized.includes('폭발')) {
    return {
      shortTopic: '화재주의',
      risks: '불티 비산, 가연물 적치, 소화설비 미비',
      measures: '가연물 제거, 화기감시자 배치, 소화기 비치',
      caseText:
        '용접 작업 중 불티가 주변 가연물에 착화되어 화재가 발생할 수 있으므로, 작업 전 화재위험물 제거와 소화설비 비치 상태를 확인할 것.',
    };
  }

  return {
    shortTopic: topic.trim() || '안전교육',
    risks: '작업 전 위험요인 공유 미흡, 보호구 착용 미흡, 작업환경 점검 부족',
    measures: '작업 전 위험성평가 확인, 보호구 착용, 작업구간 사전점검',
    caseText:
      '작업 전 위험요인 공유가 부족한 상태에서 부주의로 사고가 발생할 수 있으므로, 작업 시작 전 핵심 위험요인과 예방대책을 충분히 전달할 것.',
  };
}

export function buildLocalDoc11EducationContent(
  input: Doc11EducationGenerationInput,
): string {
  const topic = input.topic.trim();
  const count = normalizeCount(input.attendeeCount);
  const profile = buildRiskAndMeasureByTopic(topic);

  return [
    `참석인원 : ${count || '2'} 명`,
    `-${profile.shortTopic}`,
    `-주요위험요인 : ${profile.risks}`,
    `-안전대책 : ${profile.measures}`,
    `-사고사례 및 예방대책 : ${profile.caseText}`,
  ].join('\n');
}

export async function generateStructuredDoc11EducationContent(
  input: Doc11EducationGenerationInput,
): Promise<string> {
  const response = await fetch('/api/ai/doc11-education-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };

  if (!response.ok || !payload.text?.trim()) {
    throw new Error(payload.error?.trim() || '교육내용 AI 생성에 실패했습니다.');
  }

  return payload.text.trim();
}
