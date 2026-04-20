import type { SafetyHazardCountermeasureCatalogItem } from '@/types/backend';
import type {
  CurrentHazardFinding,
  FutureProcessRiskPlan,
} from '@/types/inspectionSession';

export type HazardCountermeasureCatalogMatchField =
  | 'title'
  | 'expectedRisk'
  | 'countermeasure'
  | 'legalReference';

export interface HazardCountermeasureCatalogBodyValue {
  category: string;
  expectedRisk: string;
  countermeasure: string;
  legalReference: string;
  note: string;
}

function readBodyText(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function readHazardCountermeasureCatalogBody(
  body: unknown,
): HazardCountermeasureCatalogBodyValue {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  return {
    category: readBodyText(record, 'category', 'division', 'group'),
    expectedRisk: readBodyText(record, 'expectedRisk', 'expected_risk', 'hazard', 'risk'),
    countermeasure: readBodyText(
      record,
      'countermeasure',
      'managementMeasure',
      'management_measure',
      'safetyMeasure',
      'safety_measure',
      'body',
    ),
    legalReference: readBodyText(
      record,
      'legalReference',
      'legal_reference',
      'legalInfo',
    ),
    note: readBodyText(record, 'note', 'remark'),
  };
}

function normalizeSearchText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function getItemFieldText(
  item: SafetyHazardCountermeasureCatalogItem,
  field: HazardCountermeasureCatalogMatchField,
) {
  if (field === 'title') return item.title;
  if (field === 'expectedRisk') return item.expectedRisk;
  if (field === 'countermeasure') return item.countermeasure;
  return item.legalReference;
}

export function getHazardCountermeasureFieldText(
  item: SafetyHazardCountermeasureCatalogItem,
  field: HazardCountermeasureCatalogMatchField,
) {
  return getItemFieldText(item, field);
}

export function buildHazardCountermeasureLawTitles(value: string) {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildHazardCountermeasureSearchHaystack(
  item: SafetyHazardCountermeasureCatalogItem,
) {
  return normalizeSearchText(
    [
      item.category,
      item.title,
      item.expectedRisk,
      item.countermeasure,
      item.legalReference,
      item.note,
    ].join(' '),
  );
}

export function findHazardCountermeasureCatalogItem(
  items: SafetyHazardCountermeasureCatalogItem[],
  itemId: string,
) {
  const normalizedId = itemId.trim();
  if (!normalizedId) {
    return null;
  }

  return items.find((item) => item.id === normalizedId) ?? null;
}

export function getHazardCountermeasureRecommendations(
  items: SafetyHazardCountermeasureCatalogItem[],
  query: string,
  field: HazardCountermeasureCatalogMatchField,
  options: { excludeId?: string; limit?: number } = {},
) {
  const normalizedQuery = normalizeSearchText(query);
  const limit = Math.max(1, options.limit ?? 6);
  const excludedId = options.excludeId?.trim() || '';

  const ranked = items
    .filter((item) => item.id !== excludedId)
    .map((item) => {
      if (!normalizedQuery) {
        return { item, score: 3 };
      }

      const fieldValue = normalizeSearchText(getItemFieldText(item, field));
      const haystack = buildHazardCountermeasureSearchHaystack(item);

      if (fieldValue === normalizedQuery) {
        return { item, score: 0 };
      }
      if (fieldValue.includes(normalizedQuery)) {
        return { item, score: 1 };
      }
      if (haystack.includes(normalizedQuery)) {
        return { item, score: 2 };
      }
      return null;
    })
    .filter(
      (
        entry,
      ): entry is {
        item: SafetyHazardCountermeasureCatalogItem;
        score: number;
      } => Boolean(entry),
    )
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }
      if (left.item.sortOrder !== right.item.sortOrder) {
        return left.item.sortOrder - right.item.sortOrder;
      }
      return left.item.title.localeCompare(right.item.title, 'ko');
    });

  return ranked.slice(0, limit).map((entry) => entry.item);
}

export function applyHazardCountermeasureSelectionToFinding<
  T extends CurrentHazardFinding,
>(
  finding: T,
  item: SafetyHazardCountermeasureCatalogItem,
): T {
  return {
    ...finding,
    hazardCountermeasureItemId: item.id,
    improvementPlan: item.expectedRisk,
    improvementRequest: item.expectedRisk,
    emphasis: item.countermeasure,
    legalReferenceId: '',
    legalReferenceTitle: item.legalReference,
    referenceLawTitles: buildHazardCountermeasureLawTitles(item.legalReference),
  };
}

export function clearHazardCountermeasureSelectionFromFinding<
  T extends CurrentHazardFinding,
>(
  finding: T,
): T {
  return {
    ...finding,
    hazardCountermeasureItemId: '',
  };
}

export function applyHazardCountermeasureSelectionToFuturePlan<
  T extends FutureProcessRiskPlan,
>(
  plan: T,
  item: SafetyHazardCountermeasureCatalogItem,
): T {
  return {
    ...plan,
    hazardCountermeasureItemId: item.id,
    processName: item.title,
    hazard: item.expectedRisk,
    countermeasure: item.countermeasure,
    source: 'api',
  };
}

export function clearHazardCountermeasureSelectionFromFuturePlan<
  T extends FutureProcessRiskPlan,
>(
  plan: T,
): T {
  return {
    ...plan,
    hazardCountermeasureItemId: '',
    source: 'manual',
  };
}

export function buildHazardCountermeasureFallbackCatalog(
  items: Array<{
    processName: string;
    hazard: string;
    countermeasure: string;
  }>,
): SafetyHazardCountermeasureCatalogItem[] {
  return items.map((item, index) => ({
    id: `fallback-hazard-countermeasure-${index + 1}`,
    title: item.processName,
    category: '',
    expectedRisk: item.hazard,
    countermeasure: item.countermeasure,
    legalReference: '',
    note: '',
    effectiveFrom: null,
    effectiveTo: null,
    isActive: true,
    sortOrder: index,
  }));
}
