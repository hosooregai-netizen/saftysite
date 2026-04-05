import {
  DEFAULT_CASE_FEED,
  LEGAL_REFERENCE_LIBRARY,
  DEFAULT_MEASUREMENT_CRITERIA,
  DEFAULT_SAFETY_INFOS,
  finalizeInspectionSession,
  getSessionGuidanceDate,
} from '@/constants/inspectionSession';
import {
  buildDoc7ReferenceMaterialTitle,
  readDoc7ReferenceMaterialBody,
} from '@/lib/doc7ReferenceMaterials';
import type {
  SafetyCaseCatalogItem,
  SafetyContentItem,
  SafetyDoc7ReferenceMaterialCatalogItem,
  SafetyInfoCatalogItem,
  SafetyLegalReference,
  SafetyMasterData,
  SafetyMeasurementTemplate,
} from '@/types/backend';
import type {
  CaseFeedItem,
  InspectionSession,
  SafetyInfoItem,
} from '@/types/inspectionSession';
import {
  asMapperRecord,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
  normalizeMapperText,
} from './utils';
import { resolveSafetyAssetUrl } from '@/lib/safetyApi/assetUrls';

function normalizeContentDate(value: unknown): string | null {
  const normalized = normalizeMapperText(value);
  return normalized || null;
}

function toDateOnlyValue(value: string | null): string {
  if (!value) {
    return '';
  }

  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  const directMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function isEffectiveForReportDate(
  item: { effectiveFrom: string | null; effectiveTo: string | null; isActive: boolean },
  reportDate: string,
): boolean {
  if (!item.isActive) {
    return false;
  }

  const target = toDateOnlyValue(reportDate);
  if (!target) {
    return true;
  }

  const start = toDateOnlyValue(item.effectiveFrom);
  const end = toDateOnlyValue(item.effectiveTo);

  if (start && target < start) {
    return false;
  }
  if (end && target > end) {
    return false;
  }
  return true;
}

function copyCaseFeedItem(item: CaseFeedItem): CaseFeedItem {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    imageUrl: item.imageUrl,
  };
}

function copySafetyInfoItem(item: SafetyInfoItem): SafetyInfoItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    imageUrl: item.imageUrl,
  };
}

function mapDisasterCaseItem(
  item: SafetyContentItem,
  fallback?: CaseFeedItem,
): SafetyCaseCatalogItem {
  return {
    id: item.id,
    title: normalizeMapperText(item.title) || fallback?.title || '재해 사례',
    summary: contentBodyToText(item.body) || fallback?.summary || '',
    imageUrl: contentBodyToImageUrl(item.body) || fallback?.imageUrl || '',
    effectiveFrom: normalizeContentDate(item.effective_from),
    effectiveTo: normalizeContentDate(item.effective_to),
    isActive: item.is_active,
    sortOrder: item.sort_order,
  };
}

function mapSafetyInfoItem(
  item: SafetyContentItem,
  fallback?: SafetyInfoItem,
): SafetyInfoCatalogItem {
  return {
    id: item.id,
    title: normalizeMapperText(item.title) || fallback?.title || '안전 정보',
    body: contentBodyToText(item.body) || fallback?.body || '',
    imageUrl: contentBodyToImageUrl(item.body) || contentBodyToAssetUrl(item.body) || fallback?.imageUrl || '',
    effectiveFrom: normalizeContentDate(item.effective_from),
    effectiveTo: normalizeContentDate(item.effective_to),
    isActive: item.is_active,
    sortOrder: item.sort_order,
  };
}

function mapLegalReferenceItem(item: SafetyContentItem): SafetyLegalReference {
  const body = asMapperRecord(item.body);

  return {
    id: item.id,
    title: normalizeMapperText(item.title),
    body: contentBodyToText(item.body),
    referenceMaterial1: resolveSafetyAssetUrl(
      normalizeMapperText(body.referenceMaterial1) ||
      normalizeMapperText(body.reference_material_1) ||
      normalizeMapperText(body.material1)
    ),
    referenceMaterial2: resolveSafetyAssetUrl(
      normalizeMapperText(body.referenceMaterial2) ||
      normalizeMapperText(body.reference_material_2) ||
      normalizeMapperText(body.material2)
    ),
  };
}

function mapMeasurementTemplateItem(item: SafetyContentItem): SafetyMeasurementTemplate | null {
  const body = asMapperRecord(item.body);
  const title = normalizeMapperText(item.title);
  const instrumentName =
    normalizeMapperText(body.instrumentName) ||
    normalizeMapperText(body.instrument_name) ||
    normalizeMapperText(body.equipmentName) ||
    normalizeMapperText(body.equipment_name) ||
    normalizeMapperText(body.measurementName) ||
    normalizeMapperText(body.measurement_name) ||
    title;
  const safetyCriteria =
    normalizeMapperText(body.safetyCriteria) ||
    normalizeMapperText(body.safety_criteria) ||
    (Array.isArray(body.safety_standard)
      ? body.safety_standard
          .map((entry) => normalizeMapperText(entry))
          .filter(Boolean)
          .join('\n')
      : '') ||
    contentBodyToText(item.body) ||
    DEFAULT_MEASUREMENT_CRITERIA;

  if (!instrumentName && !safetyCriteria) {
    return null;
  }

  const fallbackInstrument =
    instrumentName ||
    title ||
    normalizeMapperText(item.code) ||
    `계측 템플릿 ${item.sort_order + 1}`;

  return {
    id: item.id,
    title: title || instrumentName || 'measurement-template',
    instrumentName: fallbackInstrument,
    safetyCriteria: safetyCriteria || DEFAULT_MEASUREMENT_CRITERIA,
    effectiveFrom: normalizeContentDate(item.effective_from),
    effectiveTo: normalizeContentDate(item.effective_to),
    isActive: item.is_active,
    sortOrder: item.sort_order,
  };
}

function mapDoc7ReferenceMaterialItem(
  item: SafetyContentItem,
): SafetyDoc7ReferenceMaterialCatalogItem | null {
  const body = readDoc7ReferenceMaterialBody(item.body);
  const title =
    normalizeMapperText(item.title) ||
    buildDoc7ReferenceMaterialTitle(body.accidentType, body.causativeAgentKey);

  if (!body.accidentType || !body.causativeAgentKey || (!body.body && !body.imageUrl)) {
    return null;
  }

  return {
    id: item.id,
    title,
    accidentType: body.accidentType,
    causativeAgentKey: body.causativeAgentKey,
    body: body.body,
    imageUrl: body.imageUrl,
    referenceTitle1: body.referenceTitle1,
    referenceTitle2: body.referenceTitle2,
    effectiveFrom: normalizeContentDate(item.effective_from),
    effectiveTo: normalizeContentDate(item.effective_to),
    isActive: item.is_active,
    sortOrder: item.sort_order,
  };
}

function filterCatalogItemsByDate<T extends { effectiveFrom: string | null; effectiveTo: string | null; isActive: boolean; sortOrder: number }>(
  items: T[],
  reportDate: string,
): T[] {
  return items
    .filter((item) => isEffectiveForReportDate(item, reportDate))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getCaseFeedForReportDate(
  masterData: SafetyMasterData,
  reportDate: string,
): CaseFeedItem[] {
  const filtered = filterCatalogItemsByDate(masterData.caseFeed, reportDate);
  const source = filtered.length > 0 ? filtered.slice(0, 4) : DEFAULT_CASE_FEED;
  return source.map(copyCaseFeedItem);
}

export function getSafetyInfosForReportDate(
  masterData: SafetyMasterData,
  reportDate: string,
): SafetyInfoItem[] {
  const filtered = filterCatalogItemsByDate(masterData.safetyInfos, reportDate);
  const source = filtered.length > 0 ? filtered.slice(0, 1) : DEFAULT_SAFETY_INFOS.slice(0, 1);
  return source.map(copySafetyInfoItem);
}

/** 동일 장비명이 여러 건이면 select에 한 줄만 보이므로 첫 항목만 유지 */
function dedupeMeasurementTemplatesByName(
  items: SafetyMeasurementTemplate[],
): SafetyMeasurementTemplate[] {
  const seen = new Set<string>();
  const out: SafetyMeasurementTemplate[] = [];
  for (const item of items) {
    const key = item.instrumentName.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function getMeasurementTemplatesForReportDate(
  masterData: SafetyMasterData,
  reportDate: string,
): SafetyMeasurementTemplate[] {
  const fromServer = filterCatalogItemsByDate(masterData.measurementTemplates, reportDate);
  return dedupeMeasurementTemplatesByName(fromServer);
}

export function getDoc7ReferenceMaterialsForReportDate(
  masterData: SafetyMasterData,
  reportDate: string,
): SafetyDoc7ReferenceMaterialCatalogItem[] {
  return filterCatalogItemsByDate(masterData.doc7ReferenceMaterials, reportDate);
}

export function resolveMeasurementTemplate(
  masterData: SafetyMasterData,
  instrumentType: string,
  reportDate: string,
): SafetyMeasurementTemplate | null {
  const normalizedInstrument = normalizeMapperText(instrumentType).toLowerCase();
  if (!normalizedInstrument) {
    return null;
  }

  return (
    getMeasurementTemplatesForReportDate(masterData, reportDate).find(
      (item) => item.instrumentName.trim().toLowerCase() === normalizedInstrument,
    ) ?? null
  );
}

export function buildSafetyMasterData(items: SafetyContentItem[]): SafetyMasterData {
  const disasterCases = items
    .filter((item) => item.content_type === 'disaster_case')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => mapDisasterCaseItem(item, DEFAULT_CASE_FEED[index]));

  const safetyInfos = items
    .filter((item) => item.content_type === 'safety_news')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => mapSafetyInfoItem(item, DEFAULT_SAFETY_INFOS[index]));

  const legalReferences = items
    .filter((item) => item.content_type === 'legal_reference')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(mapLegalReferenceItem)
    .filter((item) => item.title || item.body);

  const correctionResultOptions = items
    .filter((item) => item.content_type === 'correction_result_option')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item) => normalizeMapperText(item.title) || contentBodyToText(item.body))
    .filter(Boolean);

  const measurementTemplates = items
    .filter((item) => item.content_type === 'measurement_template')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(mapMeasurementTemplateItem)
    .filter((item): item is SafetyMeasurementTemplate => Boolean(item));

  const doc7ReferenceMaterials = items
    .filter((item) => item.content_type === 'doc7_reference_material')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(mapDoc7ReferenceMaterialItem)
    .filter((item): item is SafetyDoc7ReferenceMaterialCatalogItem => Boolean(item));

  return {
    caseFeed:
      disasterCases.length > 0
        ? disasterCases
        : DEFAULT_CASE_FEED.map((item, index) => ({
            ...copyCaseFeedItem(item),
            effectiveFrom: null,
            effectiveTo: null,
            isActive: true,
            sortOrder: index,
          })),
    safetyInfos:
      safetyInfos.length > 0
        ? safetyInfos
        : DEFAULT_SAFETY_INFOS.map((item, index) => ({
            ...copySafetyInfoItem(item),
            effectiveFrom: null,
            effectiveTo: null,
            isActive: true,
            sortOrder: index,
          })),
    legalReferences:
      legalReferences.length > 0
        ? legalReferences
        : LEGAL_REFERENCE_LIBRARY.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            referenceMaterial1: item.referenceMaterial1,
            referenceMaterial2: item.referenceMaterial2,
          })),
    correctionResultOptions,
    measurementTemplates,
    doc7ReferenceMaterials,
  };
}

export function mergeMasterDataIntoSession(
  session: InspectionSession,
  masterData: SafetyMasterData,
): InspectionSession {
  const reportDate = getSessionGuidanceDate(session);

  return finalizeInspectionSession({
    ...session,
    document13Cases: getCaseFeedForReportDate(masterData, reportDate),
    document14SafetyInfos: getSafetyInfosForReportDate(masterData, reportDate),
  });
}
