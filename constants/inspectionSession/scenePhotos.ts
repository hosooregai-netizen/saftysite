import { FIXED_SCENE_COUNT, TOTAL_SCENE_COUNT } from '@/constants/inspectionSession/catalog';

export function getFixedSceneTitle(index: number): string {
  return index < FIXED_SCENE_COUNT ? `현장 전경 ${index + 1}` : '';
}

export function getExtraSceneTitle(index: number): string {
  return index >= FIXED_SCENE_COUNT && index < TOTAL_SCENE_COUNT
    ? `주요 진행공정 ${index - FIXED_SCENE_COUNT + 1}`
    : '';
}

export function getSceneSlotTitle(index: number): string {
  return getFixedSceneTitle(index) || getExtraSceneTitle(index);
}

export function normalizeSceneTitle(index: number, title: string): string {
  const slotTitle = getSceneSlotTitle(index);
  if (slotTitle) return title || slotTitle;

  return title;
}
