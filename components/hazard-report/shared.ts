'use client';

import type { ReactNode } from 'react';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { HazardReportItem } from '@/types/hazard';

export type HazardFieldKey =
  | 'locationDetail'
  | 'likelihood'
  | 'severity'
  | 'riskAssessmentResult'
  | 'photoUrl'
  | 'improvementItems'
  | 'hazardFactors'
  | 'legalInfo'
  | 'implementationPeriod';

export interface HazardReportTableText {
  locationDetailLabel?: string;
  locationDetailPlaceholder?: string;
  likelihoodLabel?: string;
  likelihoodPlaceholder?: string;
  severityLabel?: string;
  severityPlaceholder?: string;
  riskAssessmentResultLabel?: string;
  photoLabel?: string;
  photoAlt?: string;
  photoEmptyTitle?: string;
  photoEmptyHint?: string;
  photoChangeLabel?: string;
  photoRemoveLabel?: string;
  improvementItemsLabel?: string;
  improvementItemsPlaceholder?: string;
  hazardFactorsLabel?: string;
  hazardFactorsPlaceholder?: string;
  legalInfoLabel?: string;
  legalInfoPlaceholder?: string;
  implementationPeriodLabel?: string;
  implementationPeriodPlaceholder?: string;
}

export interface HazardReportTableProps {
  data: HazardReportItem;
  onChange: (data: HazardReportItem) => void;
  onAppendReports?: (reports: HazardReportItem[]) => void;
  onPhotoSelectStart?: () => void;
  index: number;
  headerActions?: ReactNode;
  topGridExtraContent?: ReactNode;
  text?: HazardReportTableText;
  implementationPeriodOptions?: Array<{ value: string; label?: string }>;
  readOnlyFields?: Partial<Record<HazardFieldKey, boolean>>;
  hiddenFields?: Partial<Record<HazardFieldKey, boolean>>;
  photoMode?: 'analyze' | 'upload' | 'readonly';
  photoGroupExtraContent?: ReactNode;
  extraContent?: ReactNode;
}

export const DEFAULT_TEXT: Required<HazardReportTableText> = {
  locationDetailLabel: '유해위험 장소',
  locationDetailPlaceholder: '예: 3층 외벽 보수 구간',
  likelihoodLabel: '가능성',
  likelihoodPlaceholder: '1~3',
  severityLabel: '중대성',
  severityPlaceholder: '1~3',
  riskAssessmentResultLabel: '위험성 평가 결과',
  photoLabel: '유해위험요인 사진',
  photoAlt: '유해위험요인 사진',
  photoEmptyTitle: '이미지 선택',
  photoEmptyHint: '클릭해서 사진을 추가하세요.',
  photoChangeLabel: '사진 변경',
  photoRemoveLabel: '사진 제거',
  improvementItemsLabel: '개선대책',
  improvementItemsPlaceholder: '예: 안전난간 설치, 출입통제, 작업 전 교육 재실시',
  hazardFactorsLabel: '유해위험요인 데이터',
  hazardFactorsPlaceholder: '예: 개구부 주변 작업 중 추락 위험 확인',
  legalInfoLabel: '관련 법령',
  legalInfoPlaceholder: '예: 산업안전보건기준에 관한 규칙 관련 조항',
  implementationPeriodLabel: '이행시기',
  implementationPeriodPlaceholder: '예: 즉시 이행 / 조치 완료 / 2일 이내',
};

export function syncRiskAssessmentResult(report: HazardReportItem): HazardReportItem {
  return {
    ...report,
    riskAssessmentResult: calculateRiskAssessmentResult(
      report.likelihood,
      report.severity
    ),
  };
}

export function isReadOnly(
  readOnlyFields: Partial<Record<HazardFieldKey, boolean>> | undefined,
  key: HazardFieldKey
): boolean {
  return Boolean(readOnlyFields?.[key]);
}

export function isHidden(
  hiddenFields: Partial<Record<HazardFieldKey, boolean>> | undefined,
  key: HazardFieldKey
): boolean {
  return Boolean(hiddenFields?.[key]);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}
