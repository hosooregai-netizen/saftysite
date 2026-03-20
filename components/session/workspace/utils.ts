'use client';

import { META_TOUCH_FALLBACK_SECTION } from '@/components/session/workspace/constants';
import type {
  CurrentHazardFinding,
  InspectionSectionKey,
} from '@/types/inspectionSession';

export interface ChartEntry {
  count: number;
  label: string;
}

export function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function isImageValue(value: string): boolean {
  return /^data:image\//.test(value) || /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
}

export function formatDateTime(value: string | null): string {
  if (!value) return '저장 대기 중';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

export function getMetaTouchSection(currentSection: InspectionSectionKey): InspectionSectionKey {
  if (currentSection === 'doc1' || currentSection === 'doc13' || currentSection === 'doc14') {
    return META_TOUCH_FALLBACK_SECTION;
  }

  return currentSection;
}

export function hasFindingContent(item: CurrentHazardFinding): boolean {
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

export function buildCountEntries(
  items: CurrentHazardFinding[],
  getLabel: (item: CurrentHazardFinding) => string
): ChartEntry[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const label = normalizeText(getLabel(item));
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, 'ko-KR');
    });
}
