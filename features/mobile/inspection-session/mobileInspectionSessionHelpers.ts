import type { PhotoAlbumItem } from '@/types/photos';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import { FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import {
  getExtraSceneTitle,
  getFixedSceneTitle,
} from '@/constants/inspectionSession/scenePhotos';
import { buildDoc5StructuredSummaryPayload } from '@/lib/openai/doc5SummaryLocalDraft';

export const MOBILE_INSPECTION_STEPS = [
  { id: 'step2', label: '개요' },
  { id: 'step3', label: '현장 전경' },
  { id: 'step4', label: '이전 기술지도' },
  { id: 'step5', label: '총평' },
  { id: 'step6', label: '사망 기인물' },
  { id: 'step7', label: '위험요인 지적' },
  { id: 'step8', label: '향후 진행공정' },
  { id: 'step9', label: '위험성평가 / TBM' },
  { id: 'step10', label: '계측점검' },
  { id: 'step11', label: '안전교육' },
  { id: 'step12', label: '활동 실적' },
] as const;

export type MobileInspectionStepId = (typeof MOBILE_INSPECTION_STEPS)[number]['id'];

export interface Doc2ProcessNotesResponse {
  riskLines?: string[];
  error?: string;
}

export interface MobilePhotoSourceTarget {
  fieldLabel: string;
  onAlbumSelected?: (item: PhotoAlbumItem) => Promise<void> | void;
  onFileSelected: (file: File) => Promise<void> | void;
}

const MAX_DOC8_RECOMMENDATIONS = 6;

export function getMobileDoc3SlotLabel(index: number) {
  return index < FIXED_SCENE_COUNT
    ? `현장 ${index + 1}`
    : `공정 ${index - FIXED_SCENE_COUNT + 1}`;
}

export function getMobileDoc3DisplayTitle(index: number, title: string | null | undefined) {
  const trimmed = title?.trim() ?? '';
  if (!trimmed) {
    return getMobileDoc3SlotLabel(index);
  }

  const legacyTitle =
    index < FIXED_SCENE_COUNT ? getFixedSceneTitle(index) : getExtraSceneTitle(index);

  return trimmed === legacyTitle ? getMobileDoc3SlotLabel(index) : trimmed;
}

export function parsePositiveRound(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function buildAutoReportTitle(reportDate: string, reportNumber: number) {
  return reportDate ? `${reportDate} 보고서 ${reportNumber}` : `보고서 ${reportNumber}`;
}

export function formatMobilePhotoAlbumDate(value: string) {
  if (!value?.trim()) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export async function generateDoc2RiskLines(input: {
  processWorkContent: string;
  processWorkerCount: string;
  processEquipment: string;
  processTools: string;
  processHazardousMaterials: string;
}) {
  const response = await fetch('/api/ai/doc2-process-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as Doc2ProcessNotesResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'AI 위험요인 생성에 실패했습니다.');
  }

  return Array.isArray(payload.riskLines) ? payload.riskLines.filter(Boolean).slice(0, 2) : [];
}

export async function inferSceneTitle(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ai/doc3-scene-title', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('현장 전경 공정명 AI 생성에 실패했습니다.');
  }

  const payload = (await response.json().catch(() => ({}))) as { title?: string };
  return payload.title?.trim() || '';
}

export async function generateStructuredDoc5Summary(
  payload: ReturnType<typeof buildDoc5StructuredSummaryPayload>,
) {
  const response = await fetch('/api/ai/doc5-structured-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };

  if (!response.ok || !result.text?.trim()) {
    throw new Error(result.error?.trim() || '총평 AI 생성에 실패했습니다.');
  }

  return result.text.trim();
}

export function normalizeDoc8ProcessName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function findDoc8ProcessMatch(value: string) {
  const normalizedValue = normalizeDoc8ProcessName(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    FUTURE_PROCESS_LIBRARY.find(
      (libraryItem) => normalizeDoc8ProcessName(libraryItem.processName) === normalizedValue,
    ) ?? null
  );
}

export function getDoc8ProcessRecommendations(value: string) {
  const normalizedValue = normalizeDoc8ProcessName(value);
  const matchingItems = normalizedValue
    ? FUTURE_PROCESS_LIBRARY.filter((libraryItem) =>
        normalizeDoc8ProcessName(libraryItem.processName).includes(normalizedValue),
      )
    : FUTURE_PROCESS_LIBRARY;

  return matchingItems.slice(0, MAX_DOC8_RECOMMENDATIONS);
}
