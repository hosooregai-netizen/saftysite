import type { HazardReportItem } from '@/types/hazard';

/** 빈 보고서 아이템 팩토리 */
export function createEmptyReport(): HazardReportItem {
  return {
    location: '유해·위험장소',
    locationDetail: '',
    riskAssessmentResult: '',
    hazardFactors: '',
    improvementItems: '',
    photoUrl: '',
    legalInfo: '',
    implementationPeriod: '',
  };
}

/** Mock 데이터 */
export const MOCK_DATA: HazardReportItem[] = [
  {
    location: '유해·위험장소',
    locationDetail: '전층 복층 구간',
    riskAssessmentResult: '보통 (4)',
    hazardFactors:
      '복층의 상층부에서 작업 중 부주의 시 떨어짐 위험',
    improvementItems:
      '[기술지도요원 강조사항]\n- 복층 구간 작업 시 안전모 및 안전대 착용\n- 출입문 폐쇄, 안전 교육 강화\n\n[산업안전보건기준에 관한 규칙 제43조]\n- 개구부 등에 안전난간, 울타리 설치',
    photoUrl: '',
    legalInfo:
      '산업안전보건기준에 관한 규칙 제43조(추락-개구부 등의 방호 조치)',
    implementationPeriod: '즉시 이행가능',
  },
  {
    location: '유해·위험장소',
    locationDetail: '지하 1층 전기실',
    riskAssessmentResult: '높음 (2)',
    hazardFactors: '전기 감전 위험, 밀폐 공간 작업 시 환기 부족',
    improvementItems:
      '- 전기 작업 시 절연 장갑 착용\n- 차단기 표시 및 작업 전 전원 차단 확인',
    photoUrl: '',
    legalInfo: '',
    implementationPeriod: '2주 이내',
  },
];
