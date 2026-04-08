import disasterCaseCatalogRaw from '@/data/disaster-case-catalog.json';
import { LEGAL_REFERENCE_LIBRARY } from '@/constants/inspectionSession';
import { CATALOG_COMPATIBLE_CAUSATIVE_KEYS,
  getCompatibleDoc7AccidentTypes,
} from '@/constants/inspectionSession/doc7Catalog';
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
  recommendedCausativeKey: CausativeAgentKey;
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

const CAUSATIVE_TO_LEGAL_REFERENCE_ID: Partial<Record<CausativeAgentKey, string>> = {
  '1_단부_개구부': 'rule-43',
  '3_지붕': 'rule-43',
  '4_비계_작업발판': 'rule-43',
  '6_고소작업대': 'rule-43',
  '7_사다리': 'rule-43',
  '8_달비계': 'rule-43',
  '10_이동식비계': 'rule-43',
  '11_거푸집동바리': 'rule-43',
  edge_opening: 'rule-43',
  roof: 'rule-43',
  ladder: 'rule-43',
  suspended_scaffold: 'rule-43',
  mobile_scaffold: 'rule-43',
  horse_scaffold: 'rule-43',
  scaffold_platform: 'rule-43',
  form_support: 'rule-43',
  '5_굴착기': 'rule-386',
  '9_크레인': 'rule-386',
  '12_이동식크레인': 'rule-386',
  excavator: 'rule-386',
  mobile_crane: 'rule-386',
  transport_machine: 'rule-386',
  construction_machine_other: 'rule-386',
  '2_철골': 'act-36',
  '13_화재_폭발': 'act-36',
  '14_기타_위험요인': 'act-36',
  steel_frame: 'act-36',
  power_tool: 'act-36',
  abnormal_temperature: 'act-36',
  oxygen_deficiency: 'act-36',
  materials: 'act-36',
  combustibles: 'act-36',
  other_causative: 'act-36',
  aerial_work_platform: 'rule-43',
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
  return getCompatibleDoc7AccidentTypes(accidentType);
}

function getCompatibleCausativeKeys(value?: CausativeAgentKey | ''): CausativeAgentKey[] {
  if (!value) return [];
  return CATALOG_COMPATIBLE_CAUSATIVE_KEYS[value] ?? [value];
}

function scoreEntry(entry: DisasterCaseCatalogEntry, query: DisasterCaseQuery): number {
  let score = 0;

  if (
    query.causativeAgentKey &&
    getCompatibleCausativeKeys(query.causativeAgentKey).includes(entry.recommendedCausativeKey)
  ) {
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
    for (const key of getCompatibleCausativeKeys(query.causativeAgentKey)) {
      const id = CAUSATIVE_TO_LEGAL_REFERENCE_ID[key];
      const matched = LEGAL_REFERENCE_LIBRARY.find((item) => item.id === id);
      if (matched) {
        return matched;
      }
    }
  }

  const normalized = normalizeText(query.text).toLowerCase();
  if (/(단부|개구부|난간|발판|비계|사다리|달비계|고소작업대|지붕)/.test(normalized)) {
    return LEGAL_REFERENCE_LIBRARY.find((item) => item.id === 'rule-43') || null;
  }

  if (/(중량물|크레인|굴착기|지게차|트럭|하역|운반|건설기계|인양)/.test(normalized)) {
    return LEGAL_REFERENCE_LIBRARY.find((item) => item.id === 'rule-386') || null;
  }

  return LEGAL_REFERENCE_LIBRARY.find((item) => item.id === 'act-36') || null;
}

export function getDisasterCaseCatalog(): DisasterCaseCatalogEntry[] {
  return disasterCaseCatalog;
}
