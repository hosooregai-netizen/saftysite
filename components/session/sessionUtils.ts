import {
  DEFAULT_PREVIOUS_GUIDANCE_RESULT,
  createInspectionHazardItem,
  getSessionSiteKey,
  getSessionSortTime,
  normalizePreviousGuidanceResult,
} from '@/constants/inspectionSession';
import type { HazardReportItem } from '@/types/hazard';
import type {
  DraftState,
  InspectionHazardItem,
  InspectionSession,
  PreviousGuidanceItem,
} from '@/types/inspectionSession';

const LEGACY_GUIDANCE_STATUS_LABELS = {
  implemented: '이행',
  partial: '부분 이행',
  notImplemented: '미이행',
  pending: '검토중',
} as const;

export const DRAFT_OPTIONS: Array<{ value: DraftState; label: string }> = [
  { value: 'draft', label: '초안' },
  { value: 'reviewed', label: '검토 완료' },
];

export function formatDateTime(value: string | null): string {
  if (!value) return '기록 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function summarize(text: string, fallback: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return fallback;
  return normalized.length > 72 ? `${normalized.slice(0, 72)}...` : normalized;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

export function toInspectionHazardItem(
  report: HazardReportItem
): InspectionHazardItem {
  return {
    ...createInspectionHazardItem(),
    ...report,
  };
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function getGuidanceSourceKey(
  sourceSessionId?: string,
  sourceHazardId?: string
): string {
  if (!sourceSessionId || !sourceHazardId) {
    return '';
  }

  return `${sourceSessionId}::${sourceHazardId}`;
}

function getGuidanceFallbackKey(locationDetail: string, previousPhotoUrl: string): string {
  return `${normalizeText(locationDetail)}::${normalizeText(previousPhotoUrl)}`;
}

function createDerivedGuidanceId(sourceSessionId: string, sourceHazardId: string): string {
  return `guidance-${sourceSessionId}-${sourceHazardId}`;
}

function getHazardLocationLabel(
  report: Pick<HazardReportItem, 'location' | 'locationDetail'>
): string {
  const location = normalizeText(report.location);
  const locationDetail = normalizeText(report.locationDetail);

  if (location && locationDetail) {
    return `${location} / ${locationDetail}`;
  }

  return locationDetail || location;
}

function buildGuidanceTitle(
  report: Pick<HazardReportItem, 'location' | 'locationDetail' | 'hazardFactors'>
): string {
  const locationLabel = getHazardLocationLabel(report);
  if (locationLabel) return locationLabel;

  return summarize(report.hazardFactors, '이전 유해위험 항목');
}

function buildLegacyImplementationResult(item: PreviousGuidanceItem | undefined): string {
  if (!item) return DEFAULT_PREVIOUS_GUIDANCE_RESULT;

  const explicitResult = normalizeText(item.implementationResult);
  if (explicitResult) return normalizePreviousGuidanceResult(explicitResult);

  const statusLabel =
    item.status && item.status !== 'pending'
      ? LEGACY_GUIDANCE_STATUS_LABELS[item.status]
      : '';
  const note = normalizeText(item.note);

  return normalizePreviousGuidanceResult(statusLabel || note);
}

function findExistingGuidanceItem(
  items: PreviousGuidanceItem[],
  sourceSessionId: string | undefined,
  sourceHazardId: string | undefined,
  locationDetail: string,
  previousPhotoUrl: string
): PreviousGuidanceItem | undefined {
  const sourceKey = getGuidanceSourceKey(sourceSessionId, sourceHazardId);
  const fallbackKey = getGuidanceFallbackKey(locationDetail, previousPhotoUrl);

  return items.find((item) => {
    if (
      sourceKey &&
      getGuidanceSourceKey(item.sourceSessionId, item.sourceHazardId) === sourceKey
    ) {
      return true;
    }

    return (
      getGuidanceFallbackKey(
        normalizeText(item.locationDetail || item.title),
        normalizeText(item.photoUrl || item.previousPhotoUrl)
      ) === fallbackKey
    );
  });
}

function resolveGuidanceDate(
  item: PreviousGuidanceItem,
  sessionsById: Map<string, InspectionSession>,
  fallbackDate: string
): string {
  const explicitDate = normalizeText(item.guidanceDate);
  if (explicitDate) {
    return explicitDate;
  }

  const sourceSessionDate = normalizeText(
    item.sourceSessionId ? sessionsById.get(item.sourceSessionId)?.cover.inspectionDate : ''
  );

  return sourceSessionDate || fallbackDate;
}

function buildGuidanceItemFromHazard(
  hazard: InspectionHazardItem,
  sourceSession: InspectionSession,
  currentSession: InspectionSession
): PreviousGuidanceItem {
  const locationDetail = getHazardLocationLabel(hazard) || buildGuidanceTitle(hazard);
  const previousPhotoUrl = normalizeText(hazard.photoUrl);
  const existingItem = findExistingGuidanceItem(
    currentSession.previousGuidanceItems,
    sourceSession.id,
    hazard.id,
    locationDetail,
    previousPhotoUrl
  );

  return {
    id: existingItem?.id ?? createDerivedGuidanceId(sourceSession.id, hazard.id),
    sourceSessionId: sourceSession.id,
    sourceHazardId: hazard.id,
    guidanceDate: normalizeText(sourceSession.cover.inspectionDate),
    confirmationDate: normalizeText(currentSession.cover.inspectionDate),
    location: hazard.location,
    locationDetail,
    likelihood: hazard.likelihood,
    severity: hazard.severity,
    riskAssessmentResult: hazard.riskAssessmentResult,
    hazardFactors: hazard.hazardFactors,
    improvementItems: hazard.improvementItems,
    photoUrl: previousPhotoUrl,
    legalInfo: hazard.legalInfo,
    currentPhotoUrl: existingItem?.currentPhotoUrl ?? '',
    implementationResult: buildLegacyImplementationResult(existingItem),
    createdAt: existingItem?.createdAt ?? hazard.createdAt,
    updatedAt: existingItem?.updatedAt ?? hazard.updatedAt,
  };
}

function buildGuidanceItemFromCarryForward(
  item: PreviousGuidanceItem,
  sourceSession: InspectionSession,
  currentSession: InspectionSession,
  sessionsById: Map<string, InspectionSession>
): PreviousGuidanceItem {
  const sourceSessionId = item.sourceSessionId ?? sourceSession.id;
  const sourceHazardId = item.sourceHazardId ?? item.id;
  const locationDetail =
    normalizeText(item.locationDetail || item.title) || buildGuidanceTitle(item);
  const previousPhotoUrl = normalizeText(item.photoUrl || item.previousPhotoUrl);
  const existingItem = findExistingGuidanceItem(
    currentSession.previousGuidanceItems,
    sourceSessionId,
    sourceHazardId,
    locationDetail,
    previousPhotoUrl
  );

  return {
    id:
      existingItem?.id ??
      createDerivedGuidanceId(sourceSessionId, sourceHazardId),
    sourceSessionId,
    sourceHazardId,
    guidanceDate: resolveGuidanceDate(
      item,
      sessionsById,
      normalizeText(sourceSession.cover.inspectionDate)
    ),
    confirmationDate: normalizeText(currentSession.cover.inspectionDate),
    location: item.location,
    locationDetail,
    likelihood: item.likelihood,
    severity: item.severity,
    riskAssessmentResult: item.riskAssessmentResult,
    hazardFactors: item.hazardFactors,
    improvementItems: item.improvementItems,
    photoUrl: previousPhotoUrl,
    legalInfo: item.legalInfo,
    currentPhotoUrl: existingItem?.currentPhotoUrl ?? item.currentPhotoUrl ?? '',
    implementationResult: buildLegacyImplementationResult(existingItem ?? item),
    createdAt: existingItem?.createdAt ?? item.createdAt,
    updatedAt: existingItem?.updatedAt ?? item.updatedAt,
  };
}

export function buildPreviousGuidanceItems(
  session: InspectionSession,
  sessions: InspectionSession[]
): PreviousGuidanceItem[] {
  const currentSiteKey = getSessionSiteKey(session);
  const sourceSession = sessions
    .filter(
      (item) =>
        item.id !== session.id &&
        getSessionSiteKey(item) === currentSiteKey &&
        item.reportNumber < session.reportNumber
    )
    .sort((left, right) => {
      const primary = right.reportNumber - left.reportNumber;
      if (primary !== 0) return primary;

      return getSessionSortTime(right) - getSessionSortTime(left);
    })[0];

  if (!sourceSession) {
    return [];
  }

  const sessionsById = new Map(sessions.map((item) => [item.id, item]));
  const seenKeys = new Set<string>();
  const nextItems: PreviousGuidanceItem[] = [];

  for (const hazard of sourceSession.currentHazards) {
    const nextItem = buildGuidanceItemFromHazard(hazard, sourceSession, session);
    const identity =
      getGuidanceSourceKey(nextItem.sourceSessionId, nextItem.sourceHazardId) ||
      getGuidanceFallbackKey(nextItem.locationDetail, nextItem.photoUrl);

    if (seenKeys.has(identity)) {
      continue;
    }

    seenKeys.add(identity);
    nextItems.push(nextItem);
  }

  for (const item of sourceSession.previousGuidanceItems) {
    if (normalizePreviousGuidanceResult(item.implementationResult) !== '미이행') {
      continue;
    }

    const nextItem = buildGuidanceItemFromCarryForward(
      item,
      sourceSession,
      session,
      sessionsById
    );
    const identity =
      getGuidanceSourceKey(nextItem.sourceSessionId, nextItem.sourceHazardId) ||
      getGuidanceFallbackKey(nextItem.locationDetail, nextItem.photoUrl);

    if (seenKeys.has(identity)) {
      continue;
    }

    seenKeys.add(identity);
    nextItems.push(nextItem);
  }

  return nextItems;
}

export function arePreviousGuidanceItemsEqual(
  left: PreviousGuidanceItem[],
  right: PreviousGuidanceItem[]
): boolean {
  if (left.length !== right.length) return false;

  return left.every((item, index) => {
    const other = right[index];
    if (!other) return false;

    return (
      item.id === other.id &&
      item.sourceSessionId === other.sourceSessionId &&
      item.sourceHazardId === other.sourceHazardId &&
      item.guidanceDate === other.guidanceDate &&
      item.confirmationDate === other.confirmationDate &&
      item.location === other.location &&
      item.locationDetail === other.locationDetail &&
      item.likelihood === other.likelihood &&
      item.severity === other.severity &&
      item.riskAssessmentResult === other.riskAssessmentResult &&
      item.hazardFactors === other.hazardFactors &&
      item.improvementItems === other.improvementItems &&
      item.photoUrl === other.photoUrl &&
      item.legalInfo === other.legalInfo &&
      item.currentPhotoUrl === other.currentPhotoUrl &&
      item.implementationResult === other.implementationResult &&
      item.createdAt === other.createdAt &&
      item.updatedAt === other.updatedAt
    );
  });
}
