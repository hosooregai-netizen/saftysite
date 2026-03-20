import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';

export function getFixedSceneTitle(index: number): string {
  return index < FIXED_SCENE_COUNT ? `현장 전경 ${index + 1}` : '';
}

export function normalizeSceneTitle(index: number, title: string): string {
  const fixedTitle = getFixedSceneTitle(index);
  if (fixedTitle) return title || fixedTitle;

  return title === `현장 전경 ${index + 1}` ? '' : title;
}
