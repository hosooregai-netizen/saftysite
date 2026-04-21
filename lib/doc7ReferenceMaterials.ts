import {
  CAUSATIVE_AGENT_LABELS,
  normalizeDoc7CausativeAgentKey,
} from '@/constants/inspectionSession/doc7Catalog';
import {
  asMapperRecord,
  contentBodyToAssetName,
  contentBodyToImageUrl,
  contentBodyToText,
  normalizeMapperText,
} from '@/lib/safetyApiMappers/utils';
import type { SafetyDoc7ReferenceMaterialCatalogItem } from '@/types/backend';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

export const DOC7_REFERENCE_GENERAL_CAUSATIVE = '일반';

export interface Doc7ReferenceMaterialBodyValue {
  accidentType: string;
  body: string;
  causativeAgentKey: string;
  imageName: string;
  imageUrl: string;
}

function decodeAssetNameFromUrl(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  try {
    const url = new URL(normalized, 'https://local.invalid');
    const lastSegment = url.pathname.split('/').filter(Boolean).pop() ?? '';
    return decodeURIComponent(lastSegment).trim();
  } catch {
    return '';
  }
}

export function normalizeDoc7ReferenceMaterialCausativeValue(
  value: string | null | undefined,
  options?: { fallbackToGeneral?: boolean },
): string {
  const normalized = normalizeMapperText(value);
  const normalizedKey = normalizeDoc7CausativeAgentKey(normalized);
  const label =
    CAUSATIVE_AGENT_LABELS[normalizedKey as CausativeAgentKey] ?? normalizedKey;

  if (label) {
    return label;
  }

  return options?.fallbackToGeneral ? DOC7_REFERENCE_GENERAL_CAUSATIVE : '';
}

export function readDoc7ReferenceMaterialBody(
  body: unknown,
): Doc7ReferenceMaterialBodyValue {
  const record = asMapperRecord(body);
  const imageUrl = contentBodyToImageUrl(body);

  return {
    accidentType: normalizeMapperText(record.accidentType ?? record.accident_type),
    body: contentBodyToText(body),
    causativeAgentKey: normalizeDoc7ReferenceMaterialCausativeValue(
      normalizeMapperText(record.causativeAgentKey ?? record.causative_agent_key),
      { fallbackToGeneral: true },
    ),
    imageName:
      contentBodyToAssetName(body) ||
      decodeAssetNameFromUrl(imageUrl) ||
      normalizeMapperText(record.imageName ?? record.image_name),
    imageUrl,
  };
}

export function buildDoc7ReferenceMaterialTitle(
  accidentType: string,
  causativeAgentKey: string,
): string {
  const normalizedAccidentType = normalizeMapperText(accidentType);
  const normalizedCausativeKey = normalizeDoc7ReferenceMaterialCausativeValue(
    causativeAgentKey,
    { fallbackToGeneral: true },
  );

  const segments = [normalizedAccidentType, normalizedCausativeKey].filter(Boolean);
  return segments.join(' / ') || 'DOC7 참고자료';
}

export function buildDoc7ReferenceMaterialLabel(
  item:
    | Pick<SafetyDoc7ReferenceMaterialCatalogItem, 'accidentType' | 'causativeAgentKey'>
    | Pick<Doc7ReferenceMaterialBodyValue, 'accidentType' | 'causativeAgentKey'>,
): string {
  const accidentType = normalizeMapperText(item.accidentType);
  const causative = normalizeDoc7ReferenceMaterialCausativeValue(item.causativeAgentKey, {
    fallbackToGeneral: true,
  });

  if (!accidentType) {
    return causative ? `기타(${causative})` : '기타';
  }

  return `${accidentType}(${causative})`;
}

export function buildDoc7ReferenceMaterialSearchText(
  item: Pick<SafetyDoc7ReferenceMaterialCatalogItem, 'accidentType' | 'causativeAgentKey' | 'body'>,
): string {
  return [
    normalizeMapperText(item.accidentType),
    normalizeDoc7ReferenceMaterialCausativeValue(item.causativeAgentKey, {
      fallbackToGeneral: true,
    }),
    normalizeMapperText(item.body),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function applyDoc7ReferenceMaterialSelection<T extends CurrentHazardFinding>(
  finding: T,
  item:
    | Pick<SafetyDoc7ReferenceMaterialCatalogItem, 'body' | 'imageUrl'>
    | null,
): T {
  const imageUrl = item?.imageUrl?.trim() ?? '';
  const body = item?.body?.trim() ?? '';

  return {
    ...finding,
    referenceMaterial1: imageUrl,
    referenceMaterial2: body,
    referenceMaterialImage: imageUrl,
    referenceMaterialDescription: body,
  };
}

export function clearDoc7ReferenceMaterialSelection<T extends CurrentHazardFinding>(
  finding: T,
): T {
  return applyDoc7ReferenceMaterialSelection(finding, null);
}

export function decodeDoc7ReferenceAssetName(value: string): string {
  return decodeAssetNameFromUrl(value);
}
