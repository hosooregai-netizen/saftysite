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

/**
 * 저장·정규화 시 제목을 그대로 둡니다. 빈 문자열은 슬롯 기본 제목으로 다시 채우지 않습니다.
 * (슬롯 기본 문구는 입력 placeholder·인쇄/내보내기 시 fallback으로만 사용)
 */
export function normalizeSceneTitle(_index: number, title: string): string {
  return title.trim();
}

/** 빈 값·슬롯 기본 제목(주요 진행공정 n)만 자동 공정명 입력 대상으로 본다. */
export function isExtraScenePlaceholderTitle(title: string | undefined, slotDefaultTitle: string): boolean {
  const t = title?.trim() ?? '';
  if (!t) return true;
  return t === slotDefaultTitle.trim();
}
