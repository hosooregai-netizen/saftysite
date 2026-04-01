import { createPreviousGuidanceFollowUpItem } from '@/constants/inspectionSession/itemFactory';
import {
  getSessionGuidanceDate,
  getSessionSiteKey,
} from '@/constants/inspectionSession/sessionIdentity';
import { normalizeText } from '@/constants/inspectionSession/shared';
import type {
  CurrentHazardFinding,
  InspectionSession,
  PreviousGuidanceFollowUpItem,
} from '@/types/inspectionSession';

export const FOLLOW_UP_RESULT_OPTIONS = [
  { value: '이행', label: '이행' },
  { value: '미이행', label: '미이행' },
] as const;

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

export function normalizeFollowUpResult(value: string): '이행' | '미이행' {
  const normalized = normalizeResultText(value);

  if (
    normalized.includes('미이행') ||
    normalized.includes('불이행') ||
    normalized === 'not_implemented'
  ) {
    return '미이행';
  }

  return '이행';
}

export function isImplementedFollowUpResult(result: string): boolean {
  return normalizeFollowUpResult(result) === '이행';
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
    isImplementedFollowUpResult(result)
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
    return [...session.document4FollowUps];
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
  const loadedPreviousSessionIds = new Set(previousSessions.map((item) => item.id));
  const preservedDerivedItems = session.document4FollowUps.filter(
    (item) =>
      Boolean(item.sourceSessionId && item.sourceFindingId) &&
      !loadedPreviousSessionIds.has(item.sourceSessionId!),
  );

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
            guidanceDate: getSessionGuidanceDate(previousSession),
            confirmationDate:
              existing?.confirmationDate || getSessionGuidanceDate(session),
            beforePhotoUrl: item.photoUrl,
            afterPhotoUrl: existing?.afterPhotoUrl || '',
            result: existing?.result || '미이행',
          });
        })
    )

  return [...derivedItems, ...preservedDerivedItems, ...manualItems];
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


