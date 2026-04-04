import {
  CATALOG_COMPATIBLE_CAUSATIVE_KEYS,
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

export interface Doc7ReferenceMaterialBodyValue {
  accidentType: string;
  body: string;
  causativeAgentKey: string;
  imageName: string;
  imageUrl: string;
  referenceTitle1: string;
  referenceTitle2: string;
}

export function readDoc7ReferenceMaterialBody(
  body: unknown,
): Doc7ReferenceMaterialBodyValue {
  const record = asMapperRecord(body);
  const normalizedCausativeKey = normalizeMapperText(
    record.causativeAgentKey ?? record.causative_agent_key,
  );

  return {
    accidentType: normalizeMapperText(record.accidentType ?? record.accident_type),
    body: contentBodyToText(body),
    causativeAgentKey: normalizeDoc7CausativeAgentKey(normalizedCausativeKey),
    imageName:
      contentBodyToAssetName(body) ||
      normalizeMapperText(record.imageName ?? record.image_name),
    imageUrl: contentBodyToImageUrl(body),
    referenceTitle1: normalizeMapperText(
      record.referenceTitle1 ?? record.reference_title_1 ?? record.imageTitle ?? record.image_title,
    ),
    referenceTitle2: normalizeMapperText(
      record.referenceTitle2 ?? record.reference_title_2 ?? record.bodyTitle ?? record.body_title,
    ),
  };
}

export function buildDoc7ReferenceMaterialTitle(
  accidentType: string,
  causativeAgentKey: string,
): string {
  const normalizedAccidentType = normalizeMapperText(accidentType);
  const normalizedCausativeKey = normalizeDoc7CausativeAgentKey(causativeAgentKey);
  const causativeLabel = normalizedCausativeKey
    ? CAUSATIVE_AGENT_LABELS[normalizedCausativeKey as CausativeAgentKey] ??
      normalizedCausativeKey
    : '';

  const segments = [normalizedAccidentType, causativeLabel].filter(Boolean);
  return segments.join(' / ') || 'DOC7 참고자료';
}

export function matchDoc7ReferenceMaterial(
  items: SafetyDoc7ReferenceMaterialCatalogItem[],
  accidentType: string,
  causativeAgentKey: string,
): SafetyDoc7ReferenceMaterialCatalogItem | null {
  const normalizedAccidentType = normalizeMapperText(accidentType);
  const normalizedCausativeKey = normalizeDoc7CausativeAgentKey(causativeAgentKey);

  if (!normalizedAccidentType || !normalizedCausativeKey) {
    return null;
  }

  const compatibleList =
    CATALOG_COMPATIBLE_CAUSATIVE_KEYS[normalizedCausativeKey as CausativeAgentKey] ?? [
      normalizedCausativeKey,
    ];
  const compatibleCausativeKeys = new Set<string>(compatibleList);

  return (
    items.find(
      (item) =>
        item.accidentType === normalizedAccidentType &&
        compatibleCausativeKeys.has(item.causativeAgentKey),
    ) ?? null
  );
}

export function getDoc7ReferenceMatchKeys(finding: CurrentHazardFinding): {
  accidentType: string;
  causativeAgentKey: string;
} {
  const refAccidentType = normalizeMapperText(finding.referenceCatalogAccidentType);
  const refCausativeKey = normalizeDoc7CausativeAgentKey(finding.referenceCatalogCausativeAgentKey);

  return {
    accidentType: refAccidentType || finding.accidentType,
    causativeAgentKey: refCausativeKey || finding.causativeAgentKey,
  };
}

export function applyDoc7ReferenceMaterialMatch<T extends CurrentHazardFinding>(
  finding: T,
  items: SafetyDoc7ReferenceMaterialCatalogItem[],
): T {
  const { accidentType, causativeAgentKey } = getDoc7ReferenceMatchKeys(finding);
  const matched = matchDoc7ReferenceMaterial(items, accidentType, causativeAgentKey);

  return {
    ...finding,
    referenceMaterial1: matched?.imageUrl ?? '',
    referenceMaterial2: matched?.body ?? '',
    referenceMaterialImage: matched?.imageUrl ?? '',
    referenceMaterialDescription: matched?.body ?? '',
  };
}
