import type { TechnicalGuidanceOverview } from '@/types/inspectionSession';

export type Doc2ProcessNoteInput = Pick<
  TechnicalGuidanceOverview,
  | 'processWorkerCount'
  | 'processEquipment'
  | 'processTools'
  | 'processHazardousMaterials'
  | 'processWorkContent'
>;

const FALLBACK_RISK_RULES: Array<{ keywords: string[]; sentence: string }> = [
  {
    keywords: ['철거', '해체', '텍스철거'],
    sentence: '철거 작업 중 낙하물, 비산물 및 구조물 불안정으로 인한 맞음, 붕괴 위험',
  },
  {
    keywords: ['도장', '방수', '페인트'],
    sentence: '도장 작업 중 화학물질 노출과 불티, 정전기 등으로 인한 화재 및 건강장해 위험',
  },
  {
    keywords: ['용접', '금속', '창호'],
    sentence: '용접 및 금속 작업 중 불티 비산과 고온 접촉으로 인한 화재, 화상 위험',
  },
  {
    keywords: ['굴착', '상수도', '되메우기', '토공'],
    sentence: '굴착 작업 중 장비 작업반경 내 접근과 토사 붕괴로 인한 충돌, 협착 위험',
  },
  {
    keywords: ['청소', '정리'],
    sentence: '정리 작업 중 미끄럼, 걸림, 장애물 방치로 인한 전도 위험',
  },
  {
    keywords: ['벌목'],
    sentence: '벌목 작업 중 전도목과 장비 작업반경 내 접근으로 인한 맞음, 충돌 위험',
  },
  {
    keywords: ['사다리', '말비계', '비계', '고소작업대'],
    sentence: '고소 작업 장비 및 가설설비 사용 중 전도, 추락 위험',
  },
  {
    keywords: ['브레이커', '연삭기', '절단기', '전기톱', '용접기'],
    sentence: '유해위험기구 사용 중 절단, 베임, 감전 및 비산물에 의한 부상 위험',
  },
  {
    keywords: ['트럭', '굴착기', '롤러', '덤프트럭', '집게차'],
    sentence: '건설기계 장비 운행 및 후진 작업 중 근로자와의 충돌, 협착 위험',
  },
  {
    keywords: ['lpg', '산소', '아르곤', '용접봉', '페인트', '시멘트', '몰탈'],
    sentence: '유해위험물질 취급 중 화재, 폭발, 분진 및 흄 노출에 따른 건강장해 위험',
  },
];

function normalizeRequiredValue(value: string) {
  const trimmed = value.trim();
  return trimmed || '미입력';
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed || '해당없음';
}

function formatWorkerCount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '미입력';
  return /명$/.test(trimmed) ? trimmed : `${trimmed}명`;
}

export function buildDoc2OverviewLines(input: Doc2ProcessNoteInput) {
  return [
    `작업현재 공정 : ${normalizeRequiredValue(input.processWorkContent)} / 작업 인원 : ${formatWorkerCount(input.processWorkerCount)} / 유해위험물질 : ${normalizeOptionalValue(input.processHazardousMaterials)}`,
    `건설기계 장비 : ${normalizeOptionalValue(input.processEquipment)} / 유해위험기구 : ${normalizeOptionalValue(input.processTools)}`,
  ];
}

export function buildDoc2RiskFallback(input: Doc2ProcessNoteInput) {
  const source = [
    input.processWorkContent,
    input.processEquipment,
    input.processTools,
    input.processHazardousMaterials,
  ]
    .join(' ')
    .toLowerCase();

  const matches = FALLBACK_RISK_RULES.filter((rule) =>
    rule.keywords.some((keyword) => source.includes(keyword.toLowerCase())),
  ).map((rule) => rule.sentence);

  if (matches.length === 0) {
    return [
      '작업 공정과 장비 사용 중 작업 절차 미준수로 인한 충돌, 협착 및 전도 위험',
      '작업 전 점검 미흡과 보호구 착용 불량으로 인한 추락, 맞음 위험',
    ];
  }

  const unique = matches.filter((sentence, index) => matches.indexOf(sentence) === index);
  if (unique.length === 1) {
    unique.push('작업 전 점검 미흡과 보호구 착용 불량으로 인한 추락, 맞음 위험');
  }

  return unique.slice(0, 2);
}

export function buildDoc2ProcessNotesDraft(
  input: Doc2ProcessNoteInput,
  riskLines = buildDoc2RiskFallback(input),
) {
  const overviewLines = buildDoc2OverviewLines(input);
  const normalizedRiskLines = riskLines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);

  while (normalizedRiskLines.length < 2) {
    normalizedRiskLines.push('작업 전 점검 미흡과 보호구 착용 불량으로 인한 추락, 맞음 위험');
  }

  return [
    ...overviewLines,
    `주요 위험 요인 1) ${normalizedRiskLines[0]}`,
    `2) ${normalizedRiskLines[1]}`,
  ].join('\n');
}
