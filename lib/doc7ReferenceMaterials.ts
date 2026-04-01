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
  causativeAgentKey: CausativeAgentKey | '';
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
  ) as CausativeAgentKey | '';

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
  causativeAgentKey: CausativeAgentKey | '',
): string {
  const normalizedAccidentType = normalizeMapperText(accidentType);
  const normalizedCausativeKey = normalizeDoc7CausativeAgentKey(causativeAgentKey);
  const causativeLabel = normalizedCausativeKey
    ? CAUSATIVE_AGENT_LABELS[normalizedCausativeKey] ?? normalizedCausativeKey
    : '';

  const segments = [normalizedAccidentType, causativeLabel].filter(Boolean);
  return segments.join(' / ') || 'DOC7 참고자료';
}

export function matchDoc7ReferenceMaterial(
  items: SafetyDoc7ReferenceMaterialCatalogItem[],
  accidentType: string,
  causativeAgentKey: CausativeAgentKey | '',
): SafetyDoc7ReferenceMaterialCatalogItem | null {
  const normalizedAccidentType = normalizeMapperText(accidentType);
  const normalizedCausativeKey = normalizeDoc7CausativeAgentKey(causativeAgentKey);

  if (!normalizedAccidentType || !normalizedCausativeKey) {
    return null;
  }

  const compatibleCausativeKeys = new Set<CausativeAgentKey | ''>(
    CATALOG_COMPATIBLE_CAUSATIVE_KEYS[normalizedCausativeKey] ?? [
      normalizedCausativeKey,
    ],
  );

  return (
    items.find(
      (item) =>
        item.accidentType === normalizedAccidentType &&
        compatibleCausativeKeys.has(item.causativeAgentKey),
    ) ?? null
  );
}

export function applyDoc7ReferenceMaterialMatch<T extends CurrentHazardFinding>(
  finding: T,
  items: SafetyDoc7ReferenceMaterialCatalogItem[],
): T {
  const matched = matchDoc7ReferenceMaterial(
    items,
    finding.accidentType,
    finding.causativeAgentKey,
  );

  return {
    ...finding,
    referenceMaterial1: matched?.imageUrl ?? '',
    referenceMaterial2: matched?.body ?? '',
  };
}
