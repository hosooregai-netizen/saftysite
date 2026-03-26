import { ACCIDENT_TYPE_OPTIONS } from '@/components/session/workspace/constants';
import { analyzeHazardPhotos, checkCausativeAgents } from '@/lib/api';
import { normalizeCausativeAgentResponse } from '@/lib/normalizeCausativeAgentResponse';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import { normalizeRiskNumber } from '@/lib/riskAssessment';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

const ACCIDENT_KEYWORD_MAP: Array<{
  type: (typeof ACCIDENT_TYPE_OPTIONS)[number];
  keywords: string[];
}> = [
  { type: '추락', keywords: ['추락', '단부', '개구부', '고소', '난간', '발판'] },
  { type: '낙하', keywords: ['낙하', '낙하물', '비래', '떨어'] },
  { type: '충돌', keywords: ['충돌', '접촉', '부딪'] },
  { type: '감전', keywords: ['감전', '전기', '누전', '배선'] },
  { type: '끼임', keywords: ['끼임', '협착'] },
  { type: '전도', keywords: ['전도', '미끄', '넘어짐', '전복'] },
  { type: '화재·폭발', keywords: ['화재', '폭발', '인화', '용접'] },
  { type: '붕괴', keywords: ['붕괴', '무너', '도괴'] },
];

function normalizeLine(value: string): string {
  return value.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
}

function buildLocation(
  report?: Awaited<ReturnType<typeof normalizeHazardResponse>>[number]
) {
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

function pickAccidentType(
  report?: Awaited<ReturnType<typeof normalizeHazardResponse>>[number]
) {
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

function pickCausativeAgentKey(raw: Awaited<ReturnType<typeof normalizeCausativeAgentResponse>>) {
  const activeEntry = Object.entries(raw.agents).find(([, checked]) => checked);
  return (activeEntry?.[0] ?? '') as CausativeAgentKey | '';
}

function splitLegalInfo(value: string) {
  return value
    .split(/\n+/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);
}

/** AI 1~3 가능성·중대성 → 세부 지적용 상·중·하 */
function mapLikelihoodSeverityToTriLevel(likelihood: string, severity: string): string {
  const ln = normalizeRiskNumber(likelihood);
  const sn = normalizeRiskNumber(severity);
  if (ln == null || sn == null) return '';
  const score = ln * sn;
  if (score >= 5) return '상';
  if (score >= 3) return '중';
  return '하';
}

/**
 * AI가 필드를 채워도 될지: 유해·위험 관련 값이 하나도 없을 때만 true.
 * 지도요원(작성자 자동 기입 등)은 제외.
 */
export function isFindingEmptyForAiAutofill(item: CurrentHazardFinding): boolean {
  const t = (s: string | null | undefined) => String(s ?? '').trim();
  if (item.carryForward) return false;
  if (t(item.location)) return false;
  if (t(item.likelihood) || t(item.severity)) return false;
  if (t(item.riskLevel)) return false;
  if (t(item.accidentType)) return false;
  if (item.causativeAgentKey) return false;
  if (t(item.emphasis)) return false;
  if (t(item.improvementPlan)) return false;
  if (t(item.legalReferenceId)) return false;
  if (t(item.legalReferenceTitle)) return false;
  if (t(item.referenceMaterial1)) return false;
  if (t(item.referenceMaterial2)) return false;
  if (t(item.metadata)) return false;
  return true;
}

export async function buildHazardFindingAutoFill(
  file: File
): Promise<Partial<CurrentHazardFinding>> {
  const [hazardReports, causativeReport] = await Promise.all([
    normalizeHazardResponse(await analyzeHazardPhotos([file]), [file]),
    normalizeCausativeAgentResponse(await checkCausativeAgents([file]), file),
  ]);
  const report = hazardReports[0];
  const likelihood = report?.likelihood ?? '';
  const severity = report?.severity ?? '';
  const laws = splitLegalInfo(report?.legalInfo ?? '');

  return {
    location: buildLocation(report),
    likelihood: '',
    severity: '',
    riskLevel: mapLikelihoodSeverityToTriLevel(likelihood, severity),
    accidentType: pickAccidentType(report),
    causativeAgentKey: pickCausativeAgentKey(causativeReport),
    metadata: normalizeLine(report?.metadata ?? ''),
    emphasis: normalizeLine(report?.hazardFactors ?? report?.metadata ?? ''),
    improvementPlan: normalizeLine(report?.improvementItems ?? ''),
    referenceMaterial1: laws[0] ?? '',
    referenceMaterial2: laws[1] ?? '',
  };
}

export async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

