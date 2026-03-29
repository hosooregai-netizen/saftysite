import disasterCaseCatalogRaw from '@/data/disaster-case-catalog.json';
import { LEGAL_REFERENCE_LIBRARY } from '@/constants/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

export interface DisasterCaseCatalogEntry {
  id: string;
  sheetName: string;
  sheetCategory: string;
  index: number;
  title: string;
  accidentCategory: string;
  detailLabel: string;
  description: string;
  preventionMeasure: string;
  imagePath: string;
  recommendedAccidentType: string;
  recommendedCausativeKey: CausativeAgentKey | '14_기타_위험요인';
  searchKeywords: string[];
}

interface DisasterCaseQuery {
  accidentType?: string;
  causativeAgentKey?: CausativeAgentKey | '';
  text?: string;
}

type LegalReferenceItem = (typeof LEGAL_REFERENCE_LIBRARY)[number];

const disasterCaseCatalog = disasterCaseCatalogRaw as DisasterCaseCatalogEntry[];

const STOPWORDS = new Set([
  '현장',
  '작업',
  '상태',
  '위험',
  '위험요인',
  '안전',
  '개선',
  '대책',
  '재해',
  '사망',
  '근로자',
  '시설',
]);

const ACCIDENT_CATEGORY_ALIASES: Record<string, string[]> = {
  추락: ['추락', '떨어짐'],
  떨어짐: ['추락', '떨어짐'],
  낙하: ['맞음', '낙하'],
  맞음: ['맞음', '낙하'],
  부딪힘: ['부딪힘', '충돌'],
  충돌: ['부딪힘', '충돌'],
  끼임: ['끼임'],
  깔림: ['깔림', '매몰', '붕괴'],
  매몰: ['매몰', '깔림', '붕괴'],
  붕괴: ['매몰', '깔림', '붕괴'],
  감전: ['감전'],
  화재·폭발: ['화상', '화재·폭발'],
  화상: ['화상', '화재·폭발'],
  전도: ['깔림', '전도'],
  찔림: ['찔림'],
  기타: ['기타', '매몰', '찔림'],
};

const CAUSATIVE_TO_LEGAL_REFERENCE_ID: Partial<Record<CausativeAgentKey, string>> = {
  '1_단부_개구부': 'rule-43',
  '3_지붕': 'rule-43',
  '4_비계_작업발판': 'rule-43',
  '6_고소작업대': 'rule-43',
  '7_사다리': 'rule-43',
  '8_달비계': 'rule-43',
  '10_이동식비계': 'rule-43',
  '11_거푸집동바리': 'rule-43',
  '5_굴착기': 'rule-386',
  '9_트럭': 'rule-386',
  '12_이동식크레인': 'rule-386',
  '2_철골': 'act-36',
  '13_화재_폭발': 'act-36',
  '14_기타_위험요인': 'act-36',
};

function normalizeText(value: string | undefined | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string | undefined | null): string[] {
  return normalizeText(value)
    .split(/[^0-9A-Za-z가-힣]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function getAccidentAliases(accidentType?: string): string[] {
  if (!accidentType) return [];
  return ACCIDENT_CATEGORY_ALIASES[accidentType] || [accidentType];
}

function scoreEntry(entry: DisasterCaseCatalogEntry, query: DisasterCaseQuery): number {
  let score = 0;

  if (query.causativeAgentKey && entry.recommendedCausativeKey === query.causativeAgentKey) {
    score += 6;
  }

  if (query.accidentType) {
    const aliases = getAccidentAliases(query.accidentType);
    if (aliases.includes(entry.accidentCategory) || aliases.includes(entry.recommendedAccidentType)) {
      score += 4;
    }
  }

  const inputTokens = tokenize(query.text);
  for (const token of inputTokens) {
    if (entry.searchKeywords.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export function getRecommendedDisasterCases(
  query: DisasterCaseQuery,
  limit = 4
): DisasterCaseCatalogEntry[] {
  return [...disasterCaseCatalog]
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      left.entry.sheetCategory.localeCompare(right.entry.sheetCategory, 'ko') ||
      left.entry.index - right.entry.index
    )
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export function buildCatalogImprovementPlan(query: DisasterCaseQuery): string {
  const measures = getRecommendedDisasterCases(query, 2)
    .map((entry) => normalizeText(entry.preventionMeasure))
    .filter(Boolean);

  const deduped = measures.filter((measure, index) => measures.indexOf(measure) === index);
  return deduped.map((measure) => `- ${measure}`).join('\n');
}

export function getRecommendedLegalReference(
  query: DisasterCaseQuery
): LegalReferenceItem | null {
  if (query.causativeAgentKey) {
    const id = CAUSATIVE_TO_LEGAL_REFERENCE_ID[query.causativeAgentKey];
    const matched = LEGAL_REFERENCE_LIBRARY.find((item) => item.id === id);
    if (matched) return matched;
  }

  const normalized = normalizeText(query.text).toLowerCase();
  if (/(단부|개구부|난간|발판|비계|사다리|달비계|고소작업대|지붕)/.test(normalized)) {
    return LEGAL_REFERENCE_LIBRARY.find((item) => item.id === 'rule-43') || null;
  }

  if (/(중량물|양중|트럭|크레인|굴착기|천공기|적재함)/.test(normalized)) {
    return LEGAL_REFERENCE_LIBRARY.find((item) => item.id === 'rule-386') || null;
  }

  return LEGAL_REFERENCE_LIBRARY.find((item) => item.id === 'act-36') || null;
}

export function getDisasterCaseCatalog(): DisasterCaseCatalogEntry[] {
  return disasterCaseCatalog;
}
