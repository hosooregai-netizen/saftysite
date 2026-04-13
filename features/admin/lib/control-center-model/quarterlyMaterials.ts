import {
  QUARTERLY_MATERIAL_REQUIRED_COUNT,
} from '@/lib/admin/siteContractProfile';
import type { SafetyReport } from '@/types/backend';
import { extractCurrentQuarterKey } from './dates';

function normalizeMaterialText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMaterialKeyPart(value: unknown) {
  return normalizeMaterialText(value).toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
  );
}

function hasMeasurementMaterialContent(item: Record<string, unknown>) {
  return Boolean(
    normalizeMaterialText(item.photoUrl) ||
      normalizeMaterialText(item.instrumentType) ||
      normalizeMaterialText(item.measurementLocation) ||
      normalizeMaterialText(item.measuredValue) ||
      normalizeMaterialText(item.actionTaken),
  );
}

function hasEducationMaterialContent(item: Record<string, unknown>) {
  return Boolean(
    normalizeMaterialText(item.photoUrl) ||
      normalizeMaterialText(item.materialUrl) ||
      normalizeMaterialText(item.materialName) ||
      normalizeMaterialText(item.attendeeCount) ||
      normalizeMaterialText(item.topic) ||
      normalizeMaterialText(item.content),
  );
}

function buildMeasurementMaterialKey(item: Record<string, unknown>, fallbackKey: string) {
  const instrumentType = normalizeMaterialKeyPart(item.instrumentType);
  const measurementLocation = normalizeMaterialKeyPart(item.measurementLocation);
  const measuredValue = normalizeMaterialKeyPart(item.measuredValue);

  if (instrumentType && measurementLocation) return `measurement:${instrumentType}:${measurementLocation}`;
  if (instrumentType) return `measurement:${instrumentType}`;
  if (measurementLocation) return `measurement-location:${measurementLocation}`;
  if (measuredValue) return `measurement-value:${measuredValue}`;
  return fallbackKey;
}

function buildEducationMaterialKey(item: Record<string, unknown>, fallbackKey: string) {
  const materialName = normalizeMaterialKeyPart(item.materialName);
  const topic = normalizeMaterialKeyPart(item.topic);
  const content = normalizeMaterialKeyPart(item.content);

  if (materialName) return `education-material:${materialName}`;
  if (topic) return `education-topic:${topic}`;
  if (content) return `education-content:${content}`;
  return fallbackKey;
}

function resolveReportKind(report: Pick<SafetyReport, 'meta' | 'report_type'>) {
  if (report.report_type) return report.report_type;
  if (!report.meta || typeof report.meta !== 'object') return '';
  return normalizeMaterialText((report.meta as Record<string, unknown>).reportKind);
}

export function buildQuarterlyMaterialCountsBySite(reports: SafetyReport[], quarterKey: string) {
  const countsBySite = new Map<
    string,
    {
      educationKeys: Set<string>;
      measurementKeys: Set<string>;
    }
  >();

  reports.forEach((report) => {
    const siteId = report.site_id?.trim() || '';
    if (!siteId || resolveReportKind(report) !== 'technical_guidance') return;

    const reportQuarterKey =
      extractCurrentQuarterKey(report.visit_date) || extractCurrentQuarterKey(report.updated_at);
    if (!reportQuarterKey || reportQuarterKey !== quarterKey) return;

    const payload = report.payload && typeof report.payload === 'object' ? report.payload : {};
    const measurements = asRecordArray((payload as Record<string, unknown>).document10Measurements);
    const educationRecords = asRecordArray(
      (payload as Record<string, unknown>).document11EducationRecords,
    );
    const bucket = countsBySite.get(siteId) ?? {
      educationKeys: new Set<string>(),
      measurementKeys: new Set<string>(),
    };

    measurements.forEach((item, index) => {
      if (!hasMeasurementMaterialContent(item)) return;
      if (bucket.measurementKeys.size >= QUARTERLY_MATERIAL_REQUIRED_COUNT) return;
      bucket.measurementKeys.add(
        buildMeasurementMaterialKey(item, `measurement-fallback:${report.report_key}:${index}`),
      );
    });

    educationRecords.forEach((item, index) => {
      if (!hasEducationMaterialContent(item)) return;
      if (bucket.educationKeys.size >= QUARTERLY_MATERIAL_REQUIRED_COUNT) return;
      bucket.educationKeys.add(
        buildEducationMaterialKey(item, `education-fallback:${report.report_key}:${index}`),
      );
    });

    countsBySite.set(siteId, bucket);
  });

  return countsBySite;
}
