import type { HazardReportItem } from '@/types/hazard';

export function createEmptyReport(): HazardReportItem {
  return {
    location: '유해·위험요소',
    locationDetail: '',
    riskAssessmentResult: '',
    hazardFactors: '',
    improvementItems: '',
    photoUrl: '',
    legalInfo: '',
    implementationPeriod: '',
  };
}

export const MOCK_DATA: HazardReportItem[] = [
  {
    location: '유해·위험요소',
    locationDetail: '외벽 보수 구간',
    riskAssessmentResult: '보통 (4)',
    hazardFactors:
      '외벽 개구부 주변에서 작업 중 추락 위험이 확인되며, 이동 동선과 작업 구간이 명확히 분리되지 않음.',
    improvementItems:
      '[기술·교육 필요 강조사항]\n\n- 개구부 주변 안전난간 설치\n- 작업구간 출입통제 및 신호수 배치\n- 작업 전 TBM 교육 실시',
    photoUrl: '',
    legalInfo:
      '산업안전보건기준에 관한 규칙 제42조(추락의 방지)\n산업안전보건기준에 관한 규칙 제43조(개구부 등의 방호조치)',
    implementationPeriod: '즉시 이행',
  },
  {
    location: '유해·위험요소',
    locationDetail: '지하 1층 전기실',
    riskAssessmentResult: '높음 (6)',
    hazardFactors:
      '임시 배선이 정리되지 않아 감전 위험이 있으며, 협소한 공간에서 장비 이동 중 충돌 우려가 있음.',
    improvementItems:
      '- 작업 전 전원 차단 및 잠금표지 실시\n- 임시 배선 정리 및 절연 상태 점검\n- 감시자 배치 후 순차 작업 진행',
    photoUrl: '',
    legalInfo:
      '산업안전보건기준에 관한 규칙 제301조(전기기계·기구의 충전부 방호)',
    implementationPeriod: '2일 이내',
  },
];
