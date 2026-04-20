import { CAUSATIVE_AGENT_LABELS } from '@/constants/inspectionSession/doc7Catalog';
import { getRecommendedLegalReference } from '@/lib/disasterCaseCatalog';
import {
  applyDoc7ReferenceMaterialMatch,
  getDoc7ReferenceMatchKeys,
} from '@/lib/doc7ReferenceMaterials';
import { normalizeMapperText } from '@/lib/safetyApiMappers/utils';
import type {
  SafetyDoc7ReferenceMaterialCatalogItem,
  SafetyHazardCountermeasureCatalogItem,
  SafetyLegalReference,
} from '@/types/backend';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

interface Doc7AutoCompletionContext {
  doc7ReferenceMaterials: SafetyDoc7ReferenceMaterialCatalogItem[];
  hazardCountermeasureCatalog: SafetyHazardCountermeasureCatalogItem[];
  legalReferences: SafetyLegalReference[];
}

interface Doc7AutoSuggestion {
  controlMeasure: string;
  legalReferenceId: string;
  legalReferenceTitle: string;
  referenceLawTitles: string[];
}

function normalizeText(value: unknown): string {
  return normalizeMapperText(value).replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[^0-9A-Za-z가-힣]+/)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length >= 2),
    ),
  );
}

function splitReferenceTitles(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((entry) => normalizeText(entry))
        .filter(Boolean),
    ),
  );
}

function buildFindingSearchText(finding: CurrentHazardFinding): string {
  const { accidentType, causativeAgentKey } = getDoc7ReferenceMatchKeys(finding);
  const causativeLabel = causativeAgentKey
    ? CAUSATIVE_AGENT_LABELS[causativeAgentKey as CausativeAgentKey] ?? causativeAgentKey
    : '';

  return [
    accidentType,
    causativeLabel,
    finding.hazardDescription,
    finding.improvementRequest || finding.improvementPlan,
    finding.location,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(' ');
}

function buildCatalogSearchText(item: SafetyHazardCountermeasureCatalogItem): string {
  return [
    item.title,
    item.category,
    item.expectedRisk,
    item.countermeasure,
    item.legalReference,
    item.note,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(' ');
}

function scoreHazardCountermeasureItem(
  item: SafetyHazardCountermeasureCatalogItem,
  finding: CurrentHazardFinding,
): number {
  const { accidentType, causativeAgentKey } = getDoc7ReferenceMatchKeys(finding);
  const accident = normalizeText(accidentType).toLowerCase();
  const causativeLabel = causativeAgentKey
    ? normalizeText(
        CAUSATIVE_AGENT_LABELS[causativeAgentKey as CausativeAgentKey] ?? causativeAgentKey,
      ).toLowerCase()
    : '';
  const queryText = buildFindingSearchText(finding).toLowerCase();
  const haystack = buildCatalogSearchText(item).toLowerCase();
  const tokens = tokenize(queryText);
  let score = 0;

  if (!haystack) {
    return 0;
  }

  if (accident && haystack.includes(accident)) {
    score += 6;
  }
  if (causativeLabel && haystack.includes(causativeLabel)) {
    score += 8;
  }

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }

  if (tokens.length > 0 && normalizeText(item.expectedRisk)) {
    const expectedRisk = normalizeText(item.expectedRisk).toLowerCase();
    for (const token of tokens) {
      if (expectedRisk.includes(token)) {
        score += 2;
      }
    }
  }

  return score;
}

export function matchHazardCountermeasureCatalog(
  items: SafetyHazardCountermeasureCatalogItem[],
  finding: CurrentHazardFinding,
): SafetyHazardCountermeasureCatalogItem | null {
  const ranked = items
    .map((item) => ({ item, score: scoreHazardCountermeasureItem(item, finding) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.item.sortOrder - right.item.sortOrder,
    );

  return ranked[0]?.item ?? null;
}

function resolveUploadedLegalReference(
  items: SafetyLegalReference[],
  query: string,
): SafetyLegalReference | null {
  const normalizedQuery = normalizeText(query).toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  for (const item of items) {
    const title = normalizeText(item.title).toLowerCase();
    const body = normalizeText(item.body).toLowerCase();
    if (title === normalizedQuery || title.includes(normalizedQuery) || normalizedQuery.includes(title)) {
      return item;
    }
    if (body && body.includes(normalizedQuery)) {
      return item;
    }
  }

  for (const titleCandidate of splitReferenceTitles(query)) {
    const normalizedTitle = titleCandidate.toLowerCase();
    const exact =
      items.find((item) => normalizeText(item.title).toLowerCase() === normalizedTitle) ?? null;
    if (exact) {
      return exact;
    }
  }

  return null;
}

function buildDoc7AutoSuggestion(
  finding: CurrentHazardFinding,
  context: Doc7AutoCompletionContext,
): Doc7AutoSuggestion {
  const matchedCountermeasure = matchHazardCountermeasureCatalog(
    context.hazardCountermeasureCatalog,
    finding,
  );
  const queryText = buildFindingSearchText(finding);
  const staticLegalReference = getRecommendedLegalReference({
    accidentType: getDoc7ReferenceMatchKeys(finding).accidentType,
    causativeAgentKey: getDoc7ReferenceMatchKeys(finding).causativeAgentKey as
      | CausativeAgentKey
      | '',
    text: queryText,
  });

  const uploadedByCountermeasure = matchedCountermeasure?.legalReference
    ? resolveUploadedLegalReference(
        context.legalReferences,
        matchedCountermeasure.legalReference,
      )
    : null;
  const uploadedByStatic = staticLegalReference
    ? resolveUploadedLegalReference(context.legalReferences, staticLegalReference.title)
    : null;
  const legalReferenceTitle = normalizeText(
    uploadedByCountermeasure?.title ||
      uploadedByStatic?.title ||
      matchedCountermeasure?.legalReference ||
      staticLegalReference?.title,
  );
  const referenceLawTitles = splitReferenceTitles(legalReferenceTitle);

  return {
    controlMeasure: normalizeText(matchedCountermeasure?.countermeasure),
    legalReferenceId:
      uploadedByCountermeasure?.id || uploadedByStatic?.id || staticLegalReference?.id || '',
    legalReferenceTitle,
    referenceLawTitles,
  };
}

function shouldReplaceAutoValue(
  currentValue: string,
  previousAutoValue: string,
): boolean {
  const normalizedCurrent = normalizeText(currentValue);
  if (!normalizedCurrent) {
    return true;
  }
  return normalizedCurrent === normalizeText(previousAutoValue);
}

function shouldReplaceReferenceLawTitles(
  currentTitles: string[] | undefined,
  previousAutoTitles: string[],
): boolean {
  if (!currentTitles || currentTitles.length === 0) {
    return true;
  }
  const currentNormalized = currentTitles.map((item) => normalizeText(item)).filter(Boolean);
  const previousNormalized = previousAutoTitles.map((item) => normalizeText(item)).filter(Boolean);
  if (currentNormalized.length !== previousNormalized.length) {
    return false;
  }
  return currentNormalized.every((entry, index) => entry === previousNormalized[index]);
}

export function applyDoc7AutoCompletionMatch<T extends CurrentHazardFinding>(
  finding: T,
  context: Doc7AutoCompletionContext,
): T {
  const previousSuggestion = buildDoc7AutoSuggestion(finding, context);
  const withReferenceMaterial = applyDoc7ReferenceMaterialMatch(
    finding,
    context.doc7ReferenceMaterials,
  );
  const nextSuggestion = buildDoc7AutoSuggestion(withReferenceMaterial, context);
  const matchedCountermeasure = matchHazardCountermeasureCatalog(
    context.hazardCountermeasureCatalog,
    withReferenceMaterial,
  );
  const nextFinding = {
    ...withReferenceMaterial,
    hazardCountermeasureItemId: matchedCountermeasure?.id ?? '',
  };

  if (
    shouldReplaceAutoValue(withReferenceMaterial.emphasis, previousSuggestion.controlMeasure)
  ) {
    nextFinding.emphasis = nextSuggestion.controlMeasure;
  }

  if (
    shouldReplaceAutoValue(
      withReferenceMaterial.legalReferenceTitle,
      previousSuggestion.legalReferenceTitle,
    )
  ) {
    nextFinding.legalReferenceId = nextSuggestion.legalReferenceId;
    nextFinding.legalReferenceTitle = nextSuggestion.legalReferenceTitle;
    nextFinding.referenceLawTitles = nextSuggestion.referenceLawTitles;
  } else if (
    shouldReplaceReferenceLawTitles(
      withReferenceMaterial.referenceLawTitles,
      previousSuggestion.referenceLawTitles,
    )
  ) {
    nextFinding.referenceLawTitles = nextSuggestion.referenceLawTitles;
  }

  return nextFinding;
}
