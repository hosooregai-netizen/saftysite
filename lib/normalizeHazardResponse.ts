import type { HazardReportItem } from '@/types/hazard';

type UnknownRecord = Record<string, unknown>;

function safeStr(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(safeStr).join('\n');
  if (typeof val === 'object') return JSON.stringify(val);
  return '';
}

function safeArr(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map((v) => safeStr(v)).filter(Boolean);
}

function pick(obj: UnknownRecord, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== '') return safeStr(v);
  }
  return '';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 새 API 응답 구조 (metadata, objects, risk_factor, improvements, laws, likelihood, severity) */
function mapNewApiItem(
  raw: UnknownRecord,
  index: number,
  uploadedFiles?: File[]
): HazardReportItem {
  const metadata = pick(raw, 'metadata');
  const objects = safeArr(raw.objects);
  const riskFactor = pick(raw, 'risk_factor');
  const improvements = safeArr(raw.improvements);
  const laws = safeArr(raw.laws);
  const likelihood = typeof raw.likelihood === 'number' ? raw.likelihood : 1;
  const severity = typeof raw.severity === 'number' ? raw.severity : 1;

  const product = likelihood * severity;
  let riskLabel = '';
  if (product >= 1 && product <= 2) riskLabel = '낮음';
  else if (product >= 3 && product <= 4) riskLabel = '보통';
  else if (product >= 5 && product <= 9) riskLabel = '높음';
  const riskAssessmentResult =
    riskLabel ? `${riskLabel} (${product})` : '';

  const improvementText = improvements.join('\n');
  const improvementItems = improvementText
    ? `[기술지도요원 강조사항]\n\n${improvementText}`
    : '';

  return {
    location: '유해·위험장소',
    locationDetail: pick(raw, 'filename') || '',
    riskAssessmentResult,
    hazardFactors: riskFactor,
    improvementItems,
    photoUrl: '',
    legalInfo: laws.join('\n'),
    implementationPeriod: '',
    metadata: metadata || undefined,
    objects: objects.length > 0 ? objects : undefined,
  };
}

/** 기존 API 응답 구조 (filename, metadata, detected_objects, improvements, laws 등) */
function mapApiItem(
  raw: UnknownRecord,
  index: number,
  uploadedFiles?: File[]
): HazardReportItem {
  const metadata = pick(raw, 'metadata');
  const detectedObjects = safeArr(raw.detected_objects);
  const detectedSituations = safeArr(raw.detected_situations);
  const improvements = safeArr(raw.improvements);
  const laws = safeArr(raw.laws);

  const hazardParts: string[] = [];
  if (metadata) hazardParts.push(metadata);
  if (detectedObjects.length)
    hazardParts.push('검출 객체: ' + detectedObjects.join(', '));
  if (detectedSituations.length)
    hazardParts.push('검출 상황: ' + detectedSituations.join(', '));

  const hazardFactors = hazardParts.join('\n\n');
  const improvementItems = improvements.join('\n');
  const legalInfo = laws.join('\n');

  return {
    location: '유해·위험장소',
    locationDetail: pick(raw, 'filename') || '',
    riskAssessmentResult:
      detectedSituations.length > 0
        ? `검출 위험 ${detectedSituations.length}건`
        : '',
    hazardFactors,
    improvementItems,
    photoUrl: '',
    legalInfo,
    implementationPeriod: '',
  };
}

/** 기타 구조용 fallback */
function toItem(raw: unknown): HazardReportItem {
  const o = (raw && typeof raw === 'object' ? raw : {}) as UnknownRecord;
  return {
    location:
      pick(o, 'location', 'location_label', '유해위험장소', 'place') ||
      '유해·위험장소',
    locationDetail: pick(
      o,
      'locationDetail',
      'location_detail',
      'locationData',
      'place_detail',
      'placeDetail',
      '장소',
      'place_name',
      'filename'
    ),
    riskAssessmentResult: pick(
      o,
      'riskAssessmentResult',
      'risk_assessment_result',
      'assessment_result',
      '위험성평가결과',
      'risk_level',
      'riskLevel'
    ),
    hazardFactors: pick(
      o,
      'hazardFactors',
      'hazard_factors',
      'hazard_factors_text',
      '유해위험요인',
      'factors',
      'risk_factors',
      'metadata'
    ),
    improvementItems: pick(
      o,
      'improvementItems',
      'improvement_items',
      'improvement_items_text',
      '지적사항',
      '재해예방대책',
      'measures',
      'recommendations',
      'improvements'
    ),
    photoUrl: pick(
      o,
      'photoUrl',
      'photo_url',
      'image_url',
      'imageUrl',
      'image',
      'photo'
    ),
    legalInfo: pick(
      o,
      'legalInfo',
      'legal_info',
      'legal_data',
      '법률데이터',
      'regulations',
      'law_reference',
      'laws'
    ),
    implementationPeriod: pick(
      o,
      'implementationPeriod',
      'implementation_period',
      '이행시기',
      'deadline',
      'timeline'
    ),
  };
}

function isNewApiShape(raw: UnknownRecord): boolean {
  return 'risk_factor' in raw && ('likelihood' in raw || 'severity' in raw);
}

function isApiShape(raw: UnknownRecord): boolean {
  if (isNewApiShape(raw)) return false;
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
    const o = raw as UnknownRecord;
    const arr =
      o.results ??
      o.data ??
      o.items ??
      o.analyses ??
      o.reports ??
      o.hazards ??
      o.list ??
      [];
    return Array.isArray(arr) ? arr : [arr];
  }
  return [];
}

export async function normalizeHazardResponse(
  raw: unknown,
  uploadedFiles?: File[]
): Promise<HazardReportItem[]> {
  const arr = extractArray(raw);

  if (arr.length === 0) {
    const single = (raw && typeof raw === 'object' ? raw : {}) as UnknownRecord;
    const item = isNewApiShape(single)
      ? mapNewApiItem(single, 0, uploadedFiles)
      : isApiShape(single)
        ? mapApiItem(single, 0, uploadedFiles)
        : toItem(raw);
    if (uploadedFiles?.[0]) {
      item.photoUrl = await fileToBase64(uploadedFiles[0]);
    }
    return [item];
  }

  const items: HazardReportItem[] = [];
  for (let i = 0; i < arr.length; i++) {
    const el = arr[i];
    const o = (el && typeof el === 'object' ? el : {}) as UnknownRecord;
    const item = isNewApiShape(o)
      ? mapNewApiItem(o, i, uploadedFiles)
      : isApiShape(o)
        ? mapApiItem(o, i, uploadedFiles)
        : toItem(el);
    if (uploadedFiles?.[i]) {
      item.photoUrl = await fileToBase64(uploadedFiles[i]);
    }
    items.push(item);
  }
  return items;
}
