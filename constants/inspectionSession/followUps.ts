import { createPreviousGuidanceFollowUpItem } from '@/constants/inspectionSession/itemFactory';
import { getSessionSiteKey } from '@/constants/inspectionSession/sessionIdentity';
import { normalizeText } from '@/constants/inspectionSession/shared';
import type {
  CurrentHazardFinding,
  InspectionSession,
  PreviousGuidanceFollowUpItem,
} from '@/types/inspectionSession';

function hasFindingContent(item: CurrentHazardFinding): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.photoUrl2) ||
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

function normalizeResultText(value: string): string {
  return normalizeText(value).replace(/\s+/g, '').toLowerCase();
}

function isCompletedFollowUpResult(result: string): boolean {
  const normalized = normalizeResultText(result);
  if (!normalized) {
    return false;
  }

  if (
    normalized.includes('미이행') ||
    normalized.includes('부분이행') ||
    normalized.includes('조치중') ||
    normalized.includes('진행중') ||
    normalized.includes('예정') ||
    normalized.includes('보완중') ||
    normalized.includes('대기')
  ) {
    return false;
  }

  return (
    normalized.includes('이행완료') ||
    normalized.includes('시정완료') ||
    normalized.includes('조치완료') ||
    normalized.includes('개선완료') ||
    normalized === '완료' ||
    normalized === '이행'
  );
}

export function buildDerivedFollowUpItems(
  session: InspectionSession,
  sessions: InspectionSession[]
): PreviousGuidanceFollowUpItem[] {
  const previousSessions = sessions
    .filter(
      (item) =>
        item.id !== session.id &&
        getSessionSiteKey(item) === getSessionSiteKey(session) &&
        item.reportNumber < session.reportNumber
    )
    .sort((left, right) => left.reportNumber - right.reportNumber);

  const manualItems = session.document4FollowUps.filter(
    (item) => !item.sourceSessionId || !item.sourceFindingId
  );

  if (previousSessions.length === 0) {
    return [...manualItems];
  }

  const existingByKey = new Map(
    session.document4FollowUps
      .filter((item) => item.sourceSessionId && item.sourceFindingId)
      .map((item) => [createDerivedFollowUpKey(item.sourceSessionId!, item.sourceFindingId!), item])
  );

  const latestFollowUpByKey = new Map<string, PreviousGuidanceFollowUpItem>();
  previousSessions.forEach((previousSession) => {
    previousSession.document4FollowUps.forEach((item) => {
      if (!item.sourceSessionId || !item.sourceFindingId) {
        return;
      }

      latestFollowUpByKey.set(
        createDerivedFollowUpKey(item.sourceSessionId, item.sourceFindingId),
        item
      );
    });
  });

  const derivedItems = previousSessions
    .slice()
    .sort((left, right) => right.reportNumber - left.reportNumber)
    .flatMap((previousSession) =>
      previousSession.document7Findings
        .filter((item) => hasFindingContent(item))
        .filter((item) => {
          const key = createDerivedFollowUpKey(previousSession.id, item.id);
          const latestFollowUp = latestFollowUpByKey.get(key);
          return !latestFollowUp || !isCompletedFollowUpResult(latestFollowUp.result);
        })
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
        })
    )

  return [...derivedItems, ...manualItems];
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


