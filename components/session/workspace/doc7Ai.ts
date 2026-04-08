'use client';

import {
  ACCIDENT_TYPE_OPTIONS,
  normalizeDoc7CausativeAgentKey,
} from '@/constants/inspectionSession/doc7Catalog';
import { analyzeHazardPhotos, checkCausativeAgents } from '@/lib/safetyApi/ai';
import {
  buildCatalogImprovementPlan,
  getRecommendedDisasterCases,
  getRecommendedLegalReference,
} from '@/lib/disasterCaseCatalog';
import { normalizeCausativeAgentResponse } from '@/lib/normalizeCausativeAgentResponse';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import { normalizeRiskNumber } from '@/lib/riskAssessment';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

const ACCIDENT_KEYWORD_MAP: Array<{
  keywords: string[];
  type: (typeof ACCIDENT_TYPE_OPTIONS)[number];
}> = [
  {
    type: '\uB5A8\uC5B4\uC9D0',
    keywords: ['\uCD94\uB77D', '\uB5A8\uC5B4\uC9D0', '\uB2E8\uBD80', '\uAC1C\uAD6C\uBD80', '\uACE0\uC18C', '\uB09C\uAC04', '\uBC1C\uD310'],
  },
  {
    type: '\uB118\uC5B4\uC9D0',
    keywords: ['\uB118\uC5B4\uC9D0', '\uBBF8\uB044\uB7EC\uC9D0', '\uBBF8\uB044\uB7EC\uC838', '\uD5DB\uB514\uB518'],
  },
  {
    type: '\uAE54\uB9BC/\uB4A4\uC9D1\uD798',
    keywords: ['\uAE54\uB9BC', '\uC555\uCC29', '\uC804\uB3C4', '\uC804\uBCF5', '\uB9E4\uBAB0', '\uB4A4\uC9D1\uD798'],
  },
  { type: '\uBD80\uB51B\uD798', keywords: ['\uBD80\uB51B\uD798', '\uCDA9\uB3CC'] },
  {
    type: '\uBB3C\uCCB4\uC5D0 \uB9DE\uC74C',
    keywords: ['\uB099\uD558', '\uBB3C\uCCB4\uC5D0 \uB9DE\uC74C', '\uB9DE\uC74C', '\uBE44\uB798'],
  },
  { type: '\uBB34\uB108\uC9D0', keywords: ['\uBD95\uAD34', '\uBB34\uB108\uC9D0'] },
  { type: '\uB07C\uC784', keywords: ['\uB07C\uC784'] },
  {
    type: '\uC808\uB2E8/\uBCA0\uC784/\uCC14\uB9BC',
    keywords: ['\uC808\uB2E8', '\uBCA0\uC784', '\uCC14\uB9BC'],
  },
  {
    type: '\uD654\uC7AC/\uD3ED\uBC1C',
    keywords: ['\uD654\uC7AC', '\uD3ED\uBC1C', '\uD654\uC0C1', '\uC811\uCD09'],
  },
  { type: '\uC0B0\uC18C\uACB0\uD54D', keywords: ['\uC0B0\uC18C\uACB0\uD54D'] },
  { type: '\uAC10\uC804', keywords: ['\uAC10\uC804', '\uC804\uAE30', '\uBC30\uC120', '\uCDA9\uC804'] },
  {
    type: '\uAD50\uD1B5\uC0AC\uACE0',
    keywords: ['\uAD50\uD1B5\uC0AC\uACE0', '\uCC28\uB7C9', '\uD2B8\uB7ED', '\uC9C0\uAC8C\uCC28'],
  },
  {
    type: '\uBD88\uADE0\uD615 \uBC0F \uBB34\uB9AC\uD55C \uB3D9\uC791',
    keywords: ['\uBD88\uADE0\uD615', '\uBB34\uB9AC\uD55C \uB3D9\uC791', '\uADFC\uACE8\uACA9'],
  },
  {
    type: '\uC774\uC0C1 \uAE30\uC628',
    keywords: ['\uC774\uC0C1 \uAE30\uC628', '\uC774\uC0C1\uAE30\uC628', '\uD3ED\uC5FC', '\uD55C\uB7AD'],
  },
  {
    type: '\uC5C5\uBB34\uC0C1 \uC9C8\uBCD1',
    keywords: ['\uC5C5\uBB34\uC0C1 \uC9C8\uBCD1', '\uC9C8\uBCD1', '\uC9C1\uC5C5\uBCD1'],
  },
];

function normalizeLine(value: string): string {
  return value.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
}

function buildLocation(report?: Awaited<ReturnType<typeof normalizeHazardResponse>>[number]) {
  if (!report) return '';

  const candidates = [
    report.locationDetail,
    report.metadata,
    report.objects?.slice(0, 2).join(', '),
    report.hazardFactors,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeLine(candidate || '')
      .replace(/\b(현장|사진|이미지|작업|상태|모습)\b/g, '')
      .replace(/[,:/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normalized) return normalized.slice(0, 32);
  }

  return '';
}

function pickAccidentType(report?: Awaited<ReturnType<typeof normalizeHazardResponse>>[number]) {
  if (!report) return '';

  const source = [report.metadata, report.hazardFactors, report.improvementItems]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const entry of ACCIDENT_KEYWORD_MAP) {
    if (entry.keywords.some((keyword) => source.includes(keyword))) {
      return entry.type;
    }
  }

  return '';
}

function pickCausativeAgentKey(
  raw: Awaited<ReturnType<typeof normalizeCausativeAgentResponse>>,
): CausativeAgentKey | '' {
  const activeEntry = Object.entries(raw.agents).find(([, checked]) => checked);
  return normalizeDoc7CausativeAgentKey((activeEntry?.[0] ?? '') as CausativeAgentKey | '') as CausativeAgentKey | '';
}

function mergeImprovementPlan(aiPlan: string, catalogPlan: string) {
  const segments = [aiPlan, catalogPlan].map((value) => value.trim()).filter(Boolean);
  return segments.filter((value, index) => segments.indexOf(value) === index).join('\n');
}

function mapLikelihoodSeverityToTriLevel(likelihood: string, severity: string): string {
  const likelihoodNumber = normalizeRiskNumber(likelihood);
  const severityNumber = normalizeRiskNumber(severity);
  if (likelihoodNumber == null || severityNumber == null) return '';

  const score = likelihoodNumber * severityNumber;
  if (score >= 5) return '상';
  if (score >= 3) return '중';
  return '하';
}

export function isFindingEmptyForAiAutofill(item: CurrentHazardFinding): boolean {
  const normalize = (value: string | null | undefined) => String(value ?? '').trim();

  if (item.carryForward) return false;
  if (normalize(item.location)) return false;
  if (normalize(item.likelihood) || normalize(item.severity)) return false;
  if (normalize(item.riskLevel)) return false;
  if (normalize(item.accidentType)) return false;
  if (item.causativeAgentKey) return false;
  if (normalize(item.emphasis)) return false;
  if (normalize(item.improvementPlan)) return false;
  if (normalize(item.legalReferenceId)) return false;
  if (normalize(item.legalReferenceTitle)) return false;
  if (normalize(item.referenceMaterialImage || item.referenceMaterial1)) return false;
  if (normalize(item.referenceMaterialDescription || item.referenceMaterial2)) return false;
  if (normalize(item.metadata)) return false;
  return true;
}

export async function buildHazardFindingAutoFill(
  file: File,
): Promise<Partial<CurrentHazardFinding>> {
  const [hazardReports, causativeReport] = await Promise.all([
    normalizeHazardResponse(await analyzeHazardPhotos([file]), [file]),
    normalizeCausativeAgentResponse(await checkCausativeAgents([file]), file),
  ]);
  const report = hazardReports[0];
  const likelihood = report?.likelihood ?? '';
  const severity = report?.severity ?? '';
  const accidentType = pickAccidentType(report);
  const causativeAgentKey = pickCausativeAgentKey(causativeReport);
  const queryText = [
    report?.metadata,
    report?.hazardFactors,
    report?.improvementItems,
    report?.locationDetail,
  ]
    .filter(Boolean)
    .join(' ');
  const catalogPlan = buildCatalogImprovementPlan({
    accidentType,
    causativeAgentKey,
    text: queryText,
  });
  const recommendedLegalReference = getRecommendedLegalReference({
    accidentType,
    causativeAgentKey,
    text: queryText,
  });
  const recommendedCases = getRecommendedDisasterCases(
    {
      accidentType,
      causativeAgentKey,
      text: queryText,
    },
    2,
  );
  const relatedCaseSummary =
    recommendedCases.length > 0
      ? `재해사례 추천: ${recommendedCases.map((item) => item.title).join(', ')}`
      : '';
  const mergedImprovementPlan = mergeImprovementPlan(
    normalizeLine(report?.improvementItems ?? ''),
    catalogPlan,
  );

  return {
    location: buildLocation(report),
    likelihood,
    severity,
    riskLevel: mapLikelihoodSeverityToTriLevel(likelihood, severity),
    accidentType,
    causativeAgentKey,
    emphasis: normalizeLine(report?.hazardFactors ?? report?.metadata ?? ''),
    improvementPlan: mergedImprovementPlan,
    improvementRequest: mergedImprovementPlan,
    legalReferenceId: recommendedLegalReference?.id ?? '',
    legalReferenceTitle: recommendedLegalReference?.title ?? '',
    metadata: [normalizeLine(report?.metadata ?? ''), relatedCaseSummary]
      .filter(Boolean)
      .join('\n'),
  };
}

export async function assetUrlToFile(assetUrl: string, filename: string) {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error('사진 파일을 다시 불러오는 중 오류가 발생했습니다.');
  }

  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
