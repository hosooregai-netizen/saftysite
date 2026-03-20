import {
  DEFAULT_CASE_FEED,
  DEFAULT_SAFETY_INFOS,
  LEGAL_REFERENCE_LIBRARY,
  finalizeInspectionSession,
} from '@/constants/inspectionSession';
import type {
  SafetyContentItem,
  SafetyLegalReference,
  SafetyMasterData,
} from '@/types/backend';
import type {
  CaseFeedItem,
  InspectionSession,
  SafetyInfoItem,
} from '@/types/inspectionSession';
import {
  asMapperRecord,
  contentBodyToImageUrl,
  contentBodyToText,
  normalizeMapperText,
} from './utils';

function mapDisasterCaseItem(
  item: SafetyContentItem,
  fallback?: CaseFeedItem
): CaseFeedItem {
  return {
    id: item.id,
    title: normalizeMapperText(item.title) || fallback?.title || '재해 사례',
    summary: contentBodyToText(item.body) || fallback?.summary || '',
    imageUrl: contentBodyToImageUrl(item.body) || fallback?.imageUrl || '',
  };
}

function mapSafetyInfoItem(
  item: SafetyContentItem,
  fallback?: SafetyInfoItem
): SafetyInfoItem {
  return {
    id: item.id,
    title: normalizeMapperText(item.title) || fallback?.title || '안전 정보',
    body: contentBodyToText(item.body) || fallback?.body || '',
    imageUrl: contentBodyToImageUrl(item.body) || fallback?.imageUrl || '',
  };
}

function mapLegalReferenceItem(item: SafetyContentItem): SafetyLegalReference {
  const body = asMapperRecord(item.body);

  return {
    id: item.id,
    title: normalizeMapperText(item.title),
    body: contentBodyToText(item.body),
    referenceMaterial1:
      normalizeMapperText(body.referenceMaterial1) ||
      normalizeMapperText(body.reference_material_1) ||
      normalizeMapperText(body.material1),
    referenceMaterial2:
      normalizeMapperText(body.referenceMaterial2) ||
      normalizeMapperText(body.reference_material_2) ||
      normalizeMapperText(body.material2),
  };
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
    .map((item) => normalizeMapperText(item.title))
    .filter(Boolean);

  const measurementTemplates = items
    .filter((item) => item.content_type === 'measurement_template')
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item) => contentBodyToText(item.body) || normalizeMapperText(item.title))
    .filter(Boolean);

  return {
    caseFeed:
      disasterCases.length > 0 ? disasterCases : DEFAULT_CASE_FEED.map((item) => ({ ...item })),
    safetyInfos:
      safetyInfos.length > 0 ? safetyInfos : DEFAULT_SAFETY_INFOS.map((item) => ({ ...item })),
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
  };
}

export function mergeMasterDataIntoSession(
  session: InspectionSession,
  masterData: SafetyMasterData
): InspectionSession {
  return finalizeInspectionSession({
    ...session,
    document13Cases: masterData.caseFeed.map((item) => ({ ...item })),
    document14SafetyInfos: masterData.safetyInfos.map((item) => ({ ...item })),
  });
}
