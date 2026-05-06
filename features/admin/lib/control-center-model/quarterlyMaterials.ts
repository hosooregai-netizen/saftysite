import {
  QUARTERLY_MATERIAL_REQUIRED_COUNT,
} from '@/lib/admin/siteContractProfile';
import type { SafetyReport } from '@/types/backend';
import { extractCurrentQuarterKey } from './dates';

const MATERIAL_REASON_DEDUPED_SAME_EDUCATION_KEY = 'deduped_same_education_key';
const MATERIAL_REASON_DEDUPED_SAME_MEASUREMENT_KEY = 'deduped_same_measurement_key';
const MATERIAL_REASON_LIMITED_TO_REQUIRED_COUNT = 'limited_to_required_count';

interface MaterialCountDiagnostic {
  rawCount: number;
  distinctCount: number;
  countedCount: number;
  source: string;
  reducedReasons: string[];
}

function normalizeMaterialText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMaterialKeyPart(value: unknown) {
  return normalizeMaterialText(value).toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
}

function readMaterialText(item: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = normalizeMaterialText(item[key]);
    if (value) return value;
  }
  return '';
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
  );
}

function readRecordArray(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const rows = asRecordArray(source[key]);
    if (rows.length > 0) return rows;
  }
  return [];
}

function hasMeasurementMaterialContent(item: Record<string, unknown>) {
  return Boolean(
    readMaterialText(item, 'photoUrl', 'photo_url') ||
      readMaterialText(item, 'instrumentType', 'instrument_type') ||
      readMaterialText(item, 'measurementLocation', 'measurement_location') ||
      readMaterialText(item, 'measuredValue', 'measured_value') ||
      readMaterialText(item, 'safetyCriteria', 'safety_criteria') ||
      readMaterialText(item, 'actionTaken', 'action_taken'),
  );
}

function hasEducationMaterialContent(item: Record<string, unknown>) {
  return Boolean(
    readMaterialText(item, 'photoUrl', 'photo_url') ||
      readMaterialText(item, 'materialUrl', 'material_url') ||
      readMaterialText(item, 'materialName', 'material_name') ||
      readMaterialText(item, 'attendeeCount', 'attendee_count') ||
      normalizeMaterialText(item.topic) ||
      normalizeMaterialText(item.content),
  );
}

function buildMeasurementMaterialKey(item: Record<string, unknown>, fallbackKey: string) {
  const instrumentType = normalizeMaterialKeyPart(readMaterialText(item, 'instrumentType', 'instrument_type'));
  const measurementLocation = normalizeMaterialKeyPart(readMaterialText(item, 'measurementLocation', 'measurement_location'));
  const measuredValue = normalizeMaterialKeyPart(readMaterialText(item, 'measuredValue', 'measured_value'));

  if (instrumentType && measurementLocation && measuredValue) {
    return `measurement:${instrumentType}:${measurementLocation}:${measuredValue}`;
  }
  if (instrumentType && measurementLocation) return `measurement:${instrumentType}:${measurementLocation}`;
  if (instrumentType && measuredValue) return `measurement:${instrumentType}:value:${measuredValue}`;
  if (measurementLocation && measuredValue) return `measurement-location:${measurementLocation}:value:${measuredValue}`;
  if (instrumentType) return `measurement:${instrumentType}`;
  if (measurementLocation) return `measurement-location:${measurementLocation}`;
  if (measuredValue) return `measurement-value:${measuredValue}`;
  return fallbackKey;
}

function buildEducationMaterialKey(item: Record<string, unknown>, fallbackKey: string) {
  const materialName = normalizeMaterialKeyPart(readMaterialText(item, 'materialName', 'material_name'));
  const topic = normalizeMaterialKeyPart(item.topic);
  const content = normalizeMaterialKeyPart(item.content);

  if (materialName) return `education-material:${materialName}`;
  if (topic) return `education-topic:${topic}`;
  if (content) return `education-content:${content}`;
  return fallbackKey;
}

function resolveReportKind(report: Pick<SafetyReport, 'meta' | 'report_type'>) {
  const meta = report.meta && typeof report.meta === 'object'
    ? (report.meta as Record<string, unknown>)
    : {};
  const normalized = normalizeMaterialText(
    report.report_type ||
      meta.reportKind ||
      meta.report_type ||
      meta.reportType,
  ).toLowerCase();
  if (normalized === 'quarterly_summary' || normalized === 'quarterly_report') {
    return 'quarterly_report';
  }
  if (normalized === 'bad_workplace') return 'bad_workplace';
  return 'technical_guidance';
}

function calculateMaterialCountedCount(distinctCount: number) {
  return Math.min(Math.max(0, distinctCount), QUARTERLY_MATERIAL_REQUIRED_COUNT);
}

function buildMaterialCountDiagnostic(
  rawCount: number,
  distinctCount: number,
  dedupedReason: string,
): MaterialCountDiagnostic {
  const countedCount = calculateMaterialCountedCount(distinctCount);
  return {
    rawCount,
    distinctCount,
    countedCount,
    source: 'report_payload',
    reducedReasons: [
      rawCount > distinctCount ? dedupedReason : '',
      distinctCount > countedCount ? MATERIAL_REASON_LIMITED_TO_REQUIRED_COUNT : '',
    ].filter(Boolean),
  };
}

export function buildQuarterlyMaterialCountsBySite(reports: SafetyReport[], quarterKey: string) {
  const countsBySite = new Map<
    string,
    {
      education: MaterialCountDiagnostic;
      educationKeys: Set<string>;
      educationRawCount: number;
      measurement: MaterialCountDiagnostic;
      measurementKeys: Set<string>;
      measurementRawCount: number;
    }
  >();

  reports.forEach((report) => {
    const siteId = report.site_id?.trim() || '';
    if (!siteId || resolveReportKind(report) !== 'technical_guidance') return;

    const reportQuarterKey =
      extractCurrentQuarterKey(report.visit_date) || extractCurrentQuarterKey(report.updated_at);
    if (!reportQuarterKey || reportQuarterKey !== quarterKey) return;

    const payload = report.payload && typeof report.payload === 'object' ? report.payload : {};
    const payloadRecord = payload as Record<string, unknown>;
    const measurements = readRecordArray(
      payloadRecord,
      'document10Measurements',
      'document_10_measurements',
      'measurements',
    );
    const educationRecords = readRecordArray(
      payloadRecord,
      'document11EducationRecords',
      'document_11_education_records',
      'educationRecords',
      'education_records',
    );
    const bucket = countsBySite.get(siteId) ?? {
      education: buildMaterialCountDiagnostic(0, 0, MATERIAL_REASON_DEDUPED_SAME_EDUCATION_KEY),
      educationKeys: new Set<string>(),
      educationRawCount: 0,
      measurement: buildMaterialCountDiagnostic(0, 0, MATERIAL_REASON_DEDUPED_SAME_MEASUREMENT_KEY),
      measurementKeys: new Set<string>(),
      measurementRawCount: 0,
    };

    measurements.forEach((item, index) => {
      if (!hasMeasurementMaterialContent(item)) return;
      bucket.measurementRawCount += 1;
      bucket.measurementKeys.add(
        buildMeasurementMaterialKey(item, `measurement-fallback:${report.report_key}:${index}`),
      );
    });

    educationRecords.forEach((item, index) => {
      if (!hasEducationMaterialContent(item)) return;
      bucket.educationRawCount += 1;
      bucket.educationKeys.add(
        buildEducationMaterialKey(item, `education-fallback:${report.report_key}:${index}`),
      );
    });

    bucket.education = buildMaterialCountDiagnostic(
      bucket.educationRawCount,
      bucket.educationKeys.size,
      MATERIAL_REASON_DEDUPED_SAME_EDUCATION_KEY,
    );
    bucket.measurement = buildMaterialCountDiagnostic(
      bucket.measurementRawCount,
      bucket.measurementKeys.size,
      MATERIAL_REASON_DEDUPED_SAME_MEASUREMENT_KEY,
    );
    countsBySite.set(siteId, bucket);
  });

  return countsBySite;
}
