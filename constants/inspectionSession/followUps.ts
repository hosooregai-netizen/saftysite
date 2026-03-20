import { createPreviousGuidanceFollowUpItem } from '@/constants/inspectionSession/itemFactory';
import { getSessionSiteKey } from '@/constants/inspectionSession/sessionIdentity';
import { normalizeText } from '@/constants/inspectionSession/shared';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  CurrentHazardFinding,
  InspectionSession,
  PreviousGuidanceFollowUpItem,
} from '@/types/inspectionSession';

function hasFindingContent(item: CurrentHazardFinding): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.location) ||
      normalizeText(item.likelihood) ||
      normalizeText(item.severity) ||
      normalizeText(item.accidentType) ||
      normalizeText(item.causativeAgentKey) ||
      normalizeText(item.inspector) ||
      normalizeText(item.emphasis) ||
      normalizeText(item.improvementPlan) ||
      normalizeText(item.legalReferenceTitle)
  );
}

function createDerivedFollowUpKey(sourceSessionId: string, sourceFindingId: string) {
  return `${sourceSessionId}::${sourceFindingId}`;
}

export function buildDerivedFollowUpItems(
  session: InspectionSession,
  sessions: InspectionSession[]
): PreviousGuidanceFollowUpItem[] {
  const previousSession = sessions
    .filter(
      (item) =>
        item.id !== session.id &&
        getSessionSiteKey(item) === getSessionSiteKey(session) &&
        item.reportNumber < session.reportNumber
    )
    .sort((left, right) => right.reportNumber - left.reportNumber)[0];

  const manualItems = session.document4FollowUps.filter(
    (item) => !item.sourceSessionId || !item.sourceFindingId
  );

  if (!previousSession) {
    const nextItems = [...manualItems];
    while (nextItems.length < 3) {
      nextItems.push(createPreviousGuidanceFollowUpItem({ confirmationDate: session.meta.reportDate }));
    }
    return nextItems;
  }

  const existingByKey = new Map(
    session.document4FollowUps
      .filter((item) => item.sourceSessionId && item.sourceFindingId)
      .map((item) => [createDerivedFollowUpKey(item.sourceSessionId!, item.sourceFindingId!), item])
  );

  const derivedItems = previousSession.document7Findings
    .filter((item) => hasFindingContent(item) && item.carryForward)
    .map((item) => {
      const key = createDerivedFollowUpKey(previousSession.id, item.id);
      const existing = existingByKey.get(key);
      return createPreviousGuidanceFollowUpItem({
        id: existing?.id,
        sourceSessionId: previousSession.id,
        sourceFindingId: item.id,
        location: item.location,
        guidanceDate: previousSession.meta.reportDate,
        confirmationDate: existing?.confirmationDate || session.meta.reportDate,
        beforePhotoUrl: item.photoUrl,
        afterPhotoUrl: existing?.afterPhotoUrl || '',
        result: existing?.result || '',
      });
    });

  const nextItems = [...derivedItems, ...manualItems];
  while (nextItems.length < 3) {
    nextItems.push(createPreviousGuidanceFollowUpItem({ confirmationDate: session.meta.reportDate }));
  }
  return nextItems;
}

export function areFollowUpItemsEqual(
  left: PreviousGuidanceFollowUpItem[],
  right: PreviousGuidanceFollowUpItem[]
): boolean {
  return left.length === right.length && left.every((item, index) => {
    const other = right[index];
    return !!other &&
      item.id === other.id &&
      item.sourceSessionId === other.sourceSessionId &&
      item.sourceFindingId === other.sourceFindingId &&
      item.location === other.location &&
      item.guidanceDate === other.guidanceDate &&
      item.confirmationDate === other.confirmationDate &&
      item.beforePhotoUrl === other.beforePhotoUrl &&
      item.afterPhotoUrl === other.afterPhotoUrl &&
      item.result === other.result;
  });
}

export function getRecommendedCausativeAgentKeys(
  findings: CurrentHazardFinding[]
): Set<CausativeAgentKey> {
  return new Set(
    findings
      .map((item) => item.causativeAgentKey)
      .filter((item): item is CausativeAgentKey => Boolean(item))
  );
}
