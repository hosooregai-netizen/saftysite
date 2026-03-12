import {
  createInspectionHazardItem,
  createPreviousGuidanceItem,
} from '@/constants/inspectionSession';
import type { HazardReportItem } from '@/types/hazard';
import type {
  DraftState,
  GuidanceStatus,
  InspectionHazardItem,
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

export function hasGuidanceContent(item: PreviousGuidanceItem): boolean {
  return Boolean(
    item.title ||
      item.description ||
      item.note ||
      item.previousPhotoUrl ||
      item.currentPhotoUrl ||
      item.status !== 'pending'
  );
}

export function toInspectionHazardItem(
  report: HazardReportItem
): InspectionHazardItem {
  return {
    ...createInspectionHazardItem(),
    ...report,
  };
}

export function clonePreviousGuidanceItem(
  item: PreviousGuidanceItem
): PreviousGuidanceItem {
  const base = createPreviousGuidanceItem();
  return {
    ...base,
    title: item.title,
    description: item.description,
    previousPhotoUrl: item.currentPhotoUrl || item.previousPhotoUrl,
  };
}
