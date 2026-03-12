import {
  createInspectionHazardItem,
  getSessionSiteKey,
  getSessionSortTime,
} from '@/constants/inspectionSession';
import type { HazardReportItem } from '@/types/hazard';
import type {
  DraftState,
  GuidanceStatus,
  InspectionHazardItem,
  InspectionSession,
  PreviousGuidanceItem,
} from '@/types/inspectionSession';

export const GUIDANCE_STATUS_OPTIONS: Array<{
  value: GuidanceStatus;
  label: string;
}> = [
  { value: 'implemented', label: '이행' },
  { value: 'partial', label: '부분이행' },
  { value: 'notImplemented', label: '미이행' },
  { value: 'pending', label: '검토중' },
];

export const DRAFT_OPTIONS: Array<{ value: DraftState; label: string }> = [
  { value: 'draft', label: '초안' },
  { value: 'reviewed', label: '검토완료' },
];

export function formatDateTime(value: string | null): string {
  if (!value) return '저장 이력 없음';

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

function buildGuidanceDescription(report: HazardReportItem): string {
  const sections = [
    normalizeText(report.hazardFactors)
      ? `위험요인: ${normalizeText(report.hazardFactors)}`
      : '',
    normalizeText(report.improvementItems)
      ? `개선사항: ${normalizeText(report.improvementItems)}`
      : '',
    normalizeText(report.riskAssessmentResult)
      ? `위험도: ${normalizeText(report.riskAssessmentResult)}`
      : '',
  ].filter(Boolean);

  return sections.join('\n');
}

function findExistingGuidanceItem(
  items: PreviousGuidanceItem[],
  sourceSessionId: string,
  sourceHazardId: string,
  title: string,
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

    return item.title === title && item.previousPhotoUrl === previousPhotoUrl;
  });
}

export function buildPreviousGuidanceItems(
  session: InspectionSession,
  sessions: InspectionSession[]
): PreviousGuidanceItem[] {
  const currentSiteKey = getSessionSiteKey(session);
  const currentSortTime = getSessionSortTime(session);

  return sessions
    .filter(
      (item) =>
        item.id !== session.id &&
        getSessionSiteKey(item) === currentSiteKey &&
        getSessionSortTime(item) < currentSortTime
    )
    .flatMap((sourceSession) =>
      sourceSession.currentHazards.map((hazard) => {
        const title = buildGuidanceTitle(hazard);
        const previousPhotoUrl = normalizeText(hazard.photoUrl);
        const existingItem = findExistingGuidanceItem(
          session.previousGuidanceItems,
          sourceSession.id,
          hazard.id,
          title,
          previousPhotoUrl
        );

        return {
          id:
            existingItem?.id ??
            createDerivedGuidanceId(sourceSession.id, hazard.id),
          sourceSessionId: sourceSession.id,
          sourceHazardId: hazard.id,
          title,
          description: buildGuidanceDescription(hazard),
          status: existingItem?.status ?? 'pending',
          previousPhotoUrl,
          currentPhotoUrl: existingItem?.currentPhotoUrl ?? '',
          note: existingItem?.note ?? '',
          createdAt: existingItem?.createdAt ?? hazard.createdAt,
          updatedAt: existingItem?.updatedAt ?? hazard.updatedAt,
        };
      })
    );
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
      item.title === other.title &&
      item.description === other.description &&
      item.status === other.status &&
      item.previousPhotoUrl === other.previousPhotoUrl &&
      item.currentPhotoUrl === other.currentPhotoUrl &&
      item.note === other.note &&
      item.createdAt === other.createdAt &&
      item.updatedAt === other.updatedAt
    );
  });
}
