import {
  createInspectionHazardItem,
  getSessionSiteKey,
  getSessionSortTime,
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
  if (!value) return '저장 기록 없음';

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
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
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
  return `${sourceSessionId ?? ''}::${sourceHazardId ?? ''}`;
}

function createDerivedGuidanceId(sourceSessionId: string, sourceHazardId: string): string {
  return `guidance-${sourceSessionId}-${sourceHazardId}`;
}

function getHazardLocationLabel(report: HazardReportItem): string {
  const location = normalizeText(report.location);
  const locationDetail = normalizeText(report.locationDetail);

  if (location && locationDetail) {
    return `${location} / ${locationDetail}`;
  }

  return locationDetail || location;
}

function buildGuidanceTitle(report: HazardReportItem): string {
  const locationLabel = getHazardLocationLabel(report);
  if (locationLabel) return locationLabel;

  return summarize(report.hazardFactors, '이전 위험 항목');
}

function buildLegacyImplementationResult(item: PreviousGuidanceItem | undefined): string {
  if (!item) return '';

  const explicitResult = normalizeText(item.implementationResult);
  if (explicitResult) return explicitResult;

  const statusLabel =
    item.status && item.status !== 'pending'
      ? LEGACY_GUIDANCE_STATUS_LABELS[item.status]
      : '';
  const note = normalizeText(item.note);

  return [statusLabel, note].filter(Boolean).join('\n');
}

function findExistingGuidanceItem(
  items: PreviousGuidanceItem[],
  sourceSessionId: string,
  sourceHazardId: string,
  locationDetail: string,
  previousPhotoUrl: string
): PreviousGuidanceItem | undefined {
  const sourceKey = getGuidanceSourceKey(sourceSessionId, sourceHazardId);

  return items.find((item) => {
    if (
      getGuidanceSourceKey(item.sourceSessionId, item.sourceHazardId) === sourceKey &&
      item.sourceSessionId &&
      item.sourceHazardId
    ) {
      return true;
    }

    return (
      normalizeText(item.locationDetail || item.title) === locationDetail &&
      normalizeText(item.photoUrl || item.previousPhotoUrl) === previousPhotoUrl
    );
  });
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

  return sourceSession.currentHazards.map((hazard) => {
    const locationDetail = getHazardLocationLabel(hazard) || buildGuidanceTitle(hazard);
    const previousPhotoUrl = normalizeText(hazard.photoUrl);
    const existingItem = findExistingGuidanceItem(
      session.previousGuidanceItems,
      sourceSession.id,
      hazard.id,
      locationDetail,
      previousPhotoUrl
    );

    return {
      id: existingItem?.id ?? createDerivedGuidanceId(sourceSession.id, hazard.id),
      sourceSessionId: sourceSession.id,
      sourceHazardId: hazard.id,
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
  });
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
