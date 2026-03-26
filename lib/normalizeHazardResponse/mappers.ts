import { DEFAULT_IMPLEMENTATION_PERIOD } from '@/constants/hazard';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { HazardReportItem } from '@/types/hazard';
import {
  pickNumber,
  pickString,
  safeStringArray,
  toUnknownRecord,
} from './helpers';

type UnknownRecord = Record<string, unknown>;

function mapRiskApiItem(raw: UnknownRecord): HazardReportItem {
  const metadata = pickString(raw, 'metadata');
  const objects = safeStringArray(raw.objects);
  const riskFactor = pickString(raw, 'risk_factor', 'hazardFactors', '유해위험요인');
  const improvements = safeStringArray(raw.improvements);
  const laws = safeStringArray(raw.laws);
  const likelihood =
    pickNumber(raw, 'likelihood', 'risk_likelihood', 'possibility', '가능성(빈도)', '가능성') ??
    1;
  const severity = pickNumber(raw, 'severity', 'risk_severity', '중대성') ?? 1;

  return {
    location: '유해·위험요소',
    locationDetail: pickString(raw, 'locationDetail', '장소'),
    likelihood: String(likelihood),
    severity: String(severity),
    riskAssessmentResult: calculateRiskAssessmentResult(likelihood, severity),
    hazardFactors: riskFactor,
    improvementItems: improvements.length
      ? `[기술적·교육적 필요 강조사항]\n\n${improvements.join('\n')}`
      : '',
    photoUrl: '',
    legalInfo: laws.join('\n'),
    implementationPeriod: DEFAULT_IMPLEMENTATION_PERIOD,
    metadata: metadata || undefined,
    objects: objects.length > 0 ? objects : undefined,
  };
}

function mapDetectedApiItem(raw: UnknownRecord): HazardReportItem {
  const metadata = pickString(raw, 'metadata');
  const detectedObjects = safeStringArray(raw.detected_objects);
  const detectedSituations = safeStringArray(raw.detected_situations);
  const improvements = safeStringArray(raw.improvements);
  const laws = safeStringArray(raw.laws);
  const likelihood = pickString(raw, '가능성(빈도)', '가능성', 'likelihood');
  const severity = pickString(raw, '중대성', 'severity');

  const hazardParts: string[] = [];
  if (metadata) hazardParts.push(metadata);
  if (detectedObjects.length > 0) {
    hazardParts.push(`검출 객체: ${detectedObjects.join(', ')}`);
  }
  if (detectedSituations.length > 0) {
    hazardParts.push(`검출 상황: ${detectedSituations.join(', ')}`);
  }

  return {
    location: '유해·위험요소',
    locationDetail: pickString(raw, 'locationDetail', '장소'),
    likelihood,
    severity,
    riskAssessmentResult: calculateRiskAssessmentResult(likelihood, severity),
    hazardFactors: hazardParts.join('\n\n'),
    improvementItems: improvements.join('\n'),
    photoUrl: '',
    legalInfo: laws.join('\n'),
    implementationPeriod: DEFAULT_IMPLEMENTATION_PERIOD,
  };
}

function toFallbackItem(raw: unknown): HazardReportItem {
  const obj = toUnknownRecord(raw);
  const likelihood = pickString(
    obj,
    'likelihood',
    'risk_likelihood',
    'possibility',
    '가능성(빈도)',
    '가능성'
  );
  const severity = pickString(obj, 'severity', 'risk_severity', '중대성');

  return {
    location:
      pickString(obj, 'location', 'location_label', '위치', 'place') || '유해·위험요소',
    locationDetail: pickString(
      obj,
      'locationDetail',
      'location_detail',
      'locationData',
      'place_detail',
      'placeDetail',
      '장소',
      'place_name'
    ),
    likelihood,
    severity,
    riskAssessmentResult: calculateRiskAssessmentResult(likelihood, severity),
    hazardFactors: pickString(
      obj,
      'hazardFactors',
      'hazard_factors',
      'hazard_factors_text',
      '유해위험요인',
      'factors',
      'risk_factors',
      'metadata'
    ),
    improvementItems: pickString(
      obj,
      'improvementItems',
      'improvement_items',
      'improvement_items_text',
      '개선대책',
      'measures',
      'recommendations',
      'improvements'
    ),
    photoUrl: pickString(
      obj,
      'photoUrl',
      'photo_url',
      'image_url',
      'imageUrl',
      'image',
      'photo'
    ),
    legalInfo: pickString(
      obj,
      'legalInfo',
      'legal_info',
      'legal_data',
      '법령데이터',
      'regulations',
      'law_reference',
      'laws'
    ),
    implementationPeriod: pickString(
      obj,
      'implementationPeriod',
      'implementation_period',
      '이행시기',
      'deadline',
      'timeline'
    ),
  };
}

function isRiskApiShape(raw: UnknownRecord): boolean {
  return (
    'risk_factor' in raw &&
    ('likelihood' in raw ||
      'severity' in raw ||
      'risk_likelihood' in raw ||
      'risk_severity' in raw ||
      'possibility' in raw ||
      '가능성(빈도)' in raw ||
      '가능성' in raw ||
      '중대성' in raw)
  );
}

function isDetectedApiShape(raw: UnknownRecord): boolean {
  if (isRiskApiShape(raw)) return false;

  return (
    'metadata' in raw ||
    'detected_objects' in raw ||
    'improvements' in raw ||
    'laws' in raw
  );
}

export function mapHazardResponseItem(raw: unknown): HazardReportItem {
  const obj = toUnknownRecord(raw);

  if (isRiskApiShape(obj)) return mapRiskApiItem(obj);
  if (isDetectedApiShape(obj)) return mapDetectedApiItem(obj);
  return toFallbackItem(raw);
}

