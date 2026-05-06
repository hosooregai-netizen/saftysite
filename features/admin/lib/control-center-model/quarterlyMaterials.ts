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

function readMaterialKeyPart(item: Record<string, unknown>, ...keys: string[]) {
  return normalizeMaterialKeyPart(readMaterialText(item, ...keys));
}

function readNestedValue(source: Record<string, unknown>, ...path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
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
  const includeId = Boolean(
    readMaterialKeyPart(item, 'measurementLocation', 'measurement_location') ||
      readMaterialKeyPart(item, 'measuredValue', 'measured_value') ||
      readMaterialKeyPart(item, 'photoUrl', 'photo_url') ||
      readMaterialKeyPart(item, 'actionTaken', 'action_taken'),
  );
  const parts = [
    includeId && readMaterialKeyPart(item, 'id', '_id')
      ? `id=${readMaterialKeyPart(item, 'id', '_id')}`
      : '',
    readMaterialKeyPart(item, 'instrumentType', 'instrument_type')
      ? `instrument_type=${readMaterialKeyPart(item, 'instrumentType', 'instrument_type')}`
      : '',
    readMaterialKeyPart(item, 'measurementLocation', 'measurement_location')
      ? `measurement_location=${readMaterialKeyPart(item, 'measurementLocation', 'measurement_location')}`
      : '',
    readMaterialKeyPart(item, 'measuredValue', 'measured_value')
      ? `measured_value=${readMaterialKeyPart(item, 'measuredValue', 'measured_value')}`
      : '',
    readMaterialKeyPart(item, 'photoUrl', 'photo_url')
      ? `photo_url=${readMaterialKeyPart(item, 'photoUrl', 'photo_url')}`
      : '',
    readMaterialKeyPart(item, 'safetyCriteria', 'safety_criteria')
      ? `safety_criteria=${readMaterialKeyPart(item, 'safetyCriteria', 'safety_criteria')}`
      : '',
    readMaterialKeyPart(item, 'actionTaken', 'action_taken')
      ? `action_taken=${readMaterialKeyPart(item, 'actionTaken', 'action_taken')}`
      : '',
  ].filter(Boolean);
  return parts.length > 0 ? `measurement|${parts.join('|')}` : fallbackKey;
}

function buildEducationMaterialKey(item: Record<string, unknown>, fallbackKey: string) {
  const parts = [
    readMaterialKeyPart(item, 'id', '_id') ? `id=${readMaterialKeyPart(item, 'id', '_id')}` : '',
    readMaterialKeyPart(item, 'materialUrl', 'material_url')
      ? `material_url=${readMaterialKeyPart(item, 'materialUrl', 'material_url')}`
      : '',
    readMaterialKeyPart(item, 'photoUrl', 'photo_url')
      ? `photo_url=${readMaterialKeyPart(item, 'photoUrl', 'photo_url')}`
      : '',
    readMaterialKeyPart(item, 'materialName', 'material_name')
      ? `material_name=${readMaterialKeyPart(item, 'materialName', 'material_name')}`
      : '',
    readMaterialKeyPart(item, 'attendeeCount', 'attendee_count')
      ? `attendee_count=${readMaterialKeyPart(item, 'attendeeCount', 'attendee_count')}`
      : '',
    readMaterialKeyPart(item, 'topic') ? `topic=${readMaterialKeyPart(item, 'topic')}` : '',
    readMaterialKeyPart(item, 'content') ? `content=${readMaterialKeyPart(item, 'content')}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? `education|${parts.join('|')}` : fallbackKey;
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

function resolveMaterialReportQuarterKey(report: SafetyReport) {
  const payload = report.payload && typeof report.payload === 'object'
    ? (report.payload as Record<string, unknown>)
    : {};
  const meta = report.meta && typeof report.meta === 'object'
    ? (report.meta as Record<string, unknown>)
    : {};
  return (
    extractCurrentQuarterKey(report.visit_date) ||
    extractCurrentQuarterKey(normalizeMaterialText(readNestedValue(payload, 'document2Overview', 'guidanceDate'))) ||
    extractCurrentQuarterKey(normalizeMaterialText(readNestedValue(payload, 'document2', 'guidanceDate'))) ||
    extractCurrentQuarterKey(normalizeMaterialText(meta.guidanceDate)) ||
    extractCurrentQuarterKey(normalizeMaterialText(meta.guidance_date)) ||
    extractCurrentQuarterKey(normalizeMaterialText(meta.reportDate)) ||
    extractCurrentQuarterKey(normalizeMaterialText(meta.report_date)) ||
    extractCurrentQuarterKey(report.updated_at)
  );
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

    const reportQuarterKey = resolveMaterialReportQuarterKey(report);
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
