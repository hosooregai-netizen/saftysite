import type { HazardReportItem } from '@/types/hazard';

type UnknownRecord = Record<string, unknown>;

function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item)).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return '';
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeString(item)).filter(Boolean);
}

function pickString(obj: UnknownRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (value != null && value !== '') return safeString(value);
  }
  return '';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mapRiskApiItem(raw: UnknownRecord): HazardReportItem {
  const metadata = pickString(raw, 'metadata');
  const objects = safeStringArray(raw.objects);
  const riskFactor = pickString(raw, 'risk_factor');
  const improvements = safeStringArray(raw.improvements);
  const laws = safeStringArray(raw.laws);
  const likelihood = typeof raw.likelihood === 'number' ? raw.likelihood : 1;
  const severity = typeof raw.severity === 'number' ? raw.severity : 1;
  const score = likelihood * severity;

  let riskLabel = '';
  if (score >= 1 && score <= 2) riskLabel = '낮음';
  else if (score >= 3 && score <= 4) riskLabel = '보통';
  else if (score >= 5) riskLabel = '높음';

  return {
    location: '유해·위험요소',
    locationDetail: pickString(raw, 'filename'),
    riskAssessmentResult: riskLabel ? `${riskLabel} (${score})` : '',
    hazardFactors: riskFactor,
    improvementItems: improvements.length
      ? `[기술·교육 필요 강조사항]\n\n${improvements.join('\n')}`
      : '',
    photoUrl: '',
    legalInfo: laws.join('\n'),
    implementationPeriod: '',
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
    locationDetail: pickString(raw, 'filename'),
    riskAssessmentResult:
      detectedSituations.length > 0 ? `검출 위험 ${detectedSituations.length}건` : '',
    hazardFactors: hazardParts.join('\n\n'),
    improvementItems: improvements.join('\n'),
    photoUrl: '',
    legalInfo: laws.join('\n'),
    implementationPeriod: '',
  };
}

function toFallbackItem(raw: unknown): HazardReportItem {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as UnknownRecord;

  return {
    location:
      pickString(obj, 'location', 'location_label', '위치', 'place') ||
      '유해·위험요소',
    locationDetail: pickString(
      obj,
      'locationDetail',
      'location_detail',
      'locationData',
      'place_detail',
      'placeDetail',
      '장소',
      'place_name',
      'filename'
    ),
    riskAssessmentResult: pickString(
      obj,
      'riskAssessmentResult',
      'risk_assessment_result',
      'assessment_result',
      '위험도평가결과',
      'risk_level',
      'riskLevel'
    ),
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
      '지도사항',
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
  return 'risk_factor' in raw && ('likelihood' in raw || 'severity' in raw);
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

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object') {
    const obj = raw as UnknownRecord;
    const candidate =
      obj.results ??
      obj.data ??
      obj.items ??
      obj.analyses ??
      obj.reports ??
      obj.hazards ??
      obj.list ??
      [];

    return Array.isArray(candidate) ? candidate : [candidate];
  }

  return [];
}

function mapItem(raw: unknown): HazardReportItem {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as UnknownRecord;

  if (isRiskApiShape(obj)) return mapRiskApiItem(obj);
  if (isDetectedApiShape(obj)) return mapDetectedApiItem(obj);
  return toFallbackItem(raw);
}

export async function normalizeHazardResponse(
  raw: unknown,
  uploadedFiles?: File[]
): Promise<HazardReportItem[]> {
  const array = extractArray(raw);

  if (array.length === 0) {
    const item = mapItem(raw);
    if (uploadedFiles?.[0]) {
      item.photoUrl = await fileToDataUrl(uploadedFiles[0]);
    }
    return [item];
  }

  const items: HazardReportItem[] = [];
  for (let index = 0; index < array.length; index += 1) {
    const item = mapItem(array[index]);
    if (uploadedFiles?.[index]) {
      item.photoUrl = await fileToDataUrl(uploadedFiles[index]);
    }
    items.push(item);
  }

  return items;
}
