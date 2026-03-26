import {
  ACCIDENT_TYPE_OPTIONS,
  FUTURE_PROCESS_LIBRARY,
  NOTIFICATION_METHOD_OPTIONS,
  WORK_PLAN_ITEMS,
  WORK_PLAN_STATUS_OPTIONS,
  WORK_PLAN_STATUS_OPTIONS_COMPACT,
} from '@/constants/inspectionSession';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import type { InspectionDocumentSource, InspectionSectionKey } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

export {
  ACCIDENT_TYPE_OPTIONS,
  FUTURE_PROCESS_LIBRARY,
  NOTIFICATION_METHOD_OPTIONS,
  WORK_PLAN_ITEMS,
  WORK_PLAN_STATUS_OPTIONS,
  WORK_PLAN_STATUS_OPTIONS_COMPACT,
};

export const DOCUMENT_SOURCE_LABELS: Record<InspectionDocumentSource, string> = {
  manual: '수동 입력',
  api: 'API/DB 연동',
  admin: '관리자 기준',
  derived: '자동 파생',
  readonly: '읽기 전용',
};

export const DOCUMENT_STATUS_LABELS = {
  not_started: '미작성',
  in_progress: '작성 중',
  completed: '완료',
} as const;

export const PREVIOUS_IMPLEMENTATION_OPTIONS = [
  { value: '', label: '선택' },
  { value: 'implemented', label: '이행' },
  { value: 'partial', label: '부분 이행' },
  { value: 'not_implemented', label: '미이행' },
] as const;

export const ACCIDENT_OCCURRENCE_OPTIONS = [
  { value: 'no', label: '미발생' },
  { value: 'yes', label: '발생' },
] as const;

export const CHECKLIST_RATING_OPTIONS = [
  { value: 'good', label: '양호' },
  { value: 'average', label: '보통' },
  { value: 'poor', label: '미흡' },
] as const;

export const RISK_SCALE_OPTIONS = [
  { value: '', label: '선택' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const;

/** 세부 지적(doc7) 위험도: 상·중·하 */
export const RISK_TRI_LEVEL_OPTIONS = [
  { value: '', label: '선택' },
  { value: '상', label: '상' },
  { value: '중', label: '중' },
  { value: '하', label: '하' },
] as const;

export const META_TOUCH_FALLBACK_SECTION: InspectionSectionKey = 'doc2';

export const SECTION_DESCRIPTIONS: Record<InspectionSectionKey, string> = {
  doc1: '관리자 기준 현장 스냅샷을 읽기 전용으로 보여줍니다.',
  doc2: '기술지도 개요와 작업계획서 12종, 재해 및 특이사항을 입력합니다.',
  doc3: '현장 전경 2장과 주요 진행공정 4장을 고정 슬롯으로 입력하고 문서 배치에 맞춰 관리합니다.',
  doc4: '이전 기술지도 이행 항목이 없으면 안내 문구가 표시되며, 필요 시 이행여부를 추가해 직접 입력합니다.',
  doc5: '4개 차트와 기술지도 총평을 관리합니다. 총평 자동 생성 시 【지적·기인물 경향】【세부 지적 요지】【조치·관리 권고】 3줄 형식으로 채웁니다.',
  doc6: '14개 핵심 안전조치를 체크합니다.',
  doc7: '현존 유해·위험요인을 반복 카드로 입력하고 법령/참고자료를 연동합니다.',
  doc8: '향후 작업공정 선택 시 위험요인과 안전대책을 자동 채움한 뒤 수정합니다.',
  doc9: 'TBM과 위험성평가 고정 문항 5개씩을 매트릭스로 기록합니다.',
  doc10: '조도계 중심 계측점검 3행을 기본 제공하고 행을 추가할 수 있습니다.',
  doc11: '교육 사진·자료, 참석인원, 교육 주제를 바탕으로 교육내용을 기록하며, 형식 맞춤 자동 생성을 사용할 수 있습니다.',
  doc12: '활동 1·2 사진과 활동 1·2 내용을 한 카드에서 입력합니다.',
  doc13: '관리자 재해 사례 피드를 2x2 카드로 읽기 전용 표시합니다.',
  doc14: '관제실 마스터에 연결된 안전 정보 PDF·이미지를 페이지 전체에 가깝게 읽기 전용 표시합니다.',
};

export const CAUSATIVE_AGENT_OPTIONS = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right])
);

export const CAUSATIVE_AGENT_LABELS = CAUSATIVE_AGENT_OPTIONS.reduce<Record<CausativeAgentKey, string>>(
  (accumulator, item) => {
    accumulator[item.key] = item.label;
    return accumulator;
  },
  {} as Record<CausativeAgentKey, string>
);

