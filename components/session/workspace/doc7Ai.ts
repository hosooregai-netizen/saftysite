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
  { type: '떨어짐', keywords: ['추락', '떨어짐', '단부', '개구부', '고소', '난간', '발판'] },
  { type: '전도', keywords: ['넘어짐', '전도'] },
  { type: '깔림', keywords: ['깔림', '뒤집힘', '전복'] },
  { type: '부딪힘', keywords: ['부딪힘', '충돌'] },
  { type: '맞음', keywords: ['낙하', '물체에 맞음', '맞음', '비래'] },
  { type: '붕괴', keywords: ['붕괴', '무너짐'] },
  { type: '끼임', keywords: ['끼임'] },
  { type: '찔림', keywords: ['절단', '베임', '찔림'] },
  { type: '화재·폭발', keywords: ['화재', '폭발', '화상', '용접'] },
  { type: '기타', keywords: ['산소결핍'] },
  { type: '감전', keywords: ['감전', '전기', '배선', '누전'] },
  { type: '충돌', keywords: ['교통사고', '차량', '트럭', '지게차'] },
  { type: '기타', keywords: ['불균형', '무리한 동작', '근골격'] },
  { type: '기타', keywords: ['이상기온', '폭염', '한랭'] },
  { type: '기타', keywords: ['질병', '직업병'] },
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
  if (normalize(item.referenceMaterial1)) return false;
  if (normalize(item.referenceMaterial2)) return false;
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

  return {
    location: buildLocation(report),
    likelihood,
    severity,
    riskLevel: mapLikelihoodSeverityToTriLevel(likelihood, severity),
    accidentType,
    causativeAgentKey,
    emphasis: normalizeLine(report?.hazardFactors ?? report?.metadata ?? ''),
    improvementPlan: mergeImprovementPlan(
      normalizeLine(report?.improvementItems ?? ''),
      catalogPlan,
    ),
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
