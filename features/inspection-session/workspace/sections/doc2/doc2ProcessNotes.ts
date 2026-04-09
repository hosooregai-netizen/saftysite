import type { TechnicalGuidanceOverview } from '@/types/inspectionSession';

function normalizeRequiredValue(value: string) {
  const trimmed = value.trim();
  return trimmed || '미입력';
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed || '해당없음';
}

function formatWorkerCount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '미입력';
  return /명$/.test(trimmed) ? trimmed : `${trimmed}명`;
}

export function buildDoc2ProcessNotesDraft(
  overview: Pick<
    TechnicalGuidanceOverview,
    | 'processWorkerCount'
    | 'processEquipment'
    | 'processTools'
    | 'processHazardousMaterials'
    | 'processWorkContent'
    | 'processWorkLocation'
    | 'processSurroundings'
  >,
) {
  return [
    `작업내용 : ${normalizeRequiredValue(overview.processWorkContent)}`,
    `작업위치 : ${normalizeRequiredValue(overview.processWorkLocation)} / 주변환경 : ${normalizeOptionalValue(overview.processSurroundings)}`,
    `출역 근로자수 : ${formatWorkerCount(overview.processWorkerCount)} / 장비 : ${normalizeOptionalValue(overview.processEquipment)}`,
    `공도구 : ${normalizeOptionalValue(overview.processTools)} / 유해물질 : ${normalizeOptionalValue(overview.processHazardousMaterials)}`,
  ].join('\n');
}
