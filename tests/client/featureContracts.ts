export type FeatureContractId =
  | 'auth'
  | 'mobile-quarterly-report'
  | 'site-hub'
  | 'quarterly-report'
  | 'mobile-link';

export interface FeatureContract {
  apis: string[];
  criticalActions: string[];
  description: string;
  id: FeatureContractId;
  markers: string[];
  routes: string[];
}

export const FEATURE_CONTRACTS: Record<FeatureContractId, FeatureContract> = {
  auth: {
    id: 'auth',
    description: '로그인 성공 후 현장 목록으로 진입하고 로그아웃 뒤 다시 로그인할 수 있다.',
    routes: ['/'],
    markers: ['현장 목록 로그인', '현장 목록'],
    apis: ['POST /auth/token', 'GET /assignments/me/sites'],
    criticalActions: ['현장 요원 로그인', '로그아웃', '재로그인'],
  },
  'mobile-link': {
    id: 'mobile-link',
    description: '모바일 direct-link로 보고서에 진입하고 로그인 후 저장까지 이어진다.',
    routes: ['/mobile/sessions/report-tech-1'],
    markers: ['모바일 보고서 로그인', '기술지도 개요', '저장'],
    apis: [
      'POST /auth/token',
      'GET /assignments/me/sites',
      'GET /reports/by-key/:id',
      'POST /reports/upsert',
    ],
    criticalActions: ['모바일 직접 링크 로그인', '모바일 보고서 진입', '모바일 저장'],
  },
  'mobile-quarterly-report': {
    id: 'mobile-quarterly-report',
    description:
      '모바일 분기 보고서 화면이 직접 진입, 원본 보고서 반영, 저장, 문서 다운로드 흐름을 유지한다.',
    routes: ['/mobile/sites/site-1/quarterly/{quarterKey}'],
    markers: ['모바일 분기 보고 로그인', '보고서 선택', '저장', '한글', 'PDF'],
    apis: [
      'POST /auth/token',
      'GET /reports/by-key/:id',
      'GET /reports/site/:id/quarterly-summary-seed',
      'POST /reports/upsert',
      'POST /api/documents/quarterly/hwpx',
      'POST /api/documents/quarterly/pdf',
    ],
    criticalActions: ['모바일 분기 보고 로그인', '원본 보고서 반영', '모바일 분기 저장', '문서 다운로드'],
  },
  'quarterly-report': {
    id: 'quarterly-report',
    description:
      '분기 보고서가 목록에서 생성되고, 로컬 seed fallback, 자동 저장, 문서 다운로드 흐름을 유지한다.',
    routes: ['/sites/site-1/quarterly', '/sites/site-1/quarterly/{quarterKey}'],
    markers: [
      '분기 종합 보고서 목록',
      '1. 원본 보고서 선택',
      '1. 기술지도 사업장 개요',
      '2. 재해유형 분석',
      '문서 다운로드 (.hwpx)',
      '문서 다운로드 (.pdf)',
    ],
    apis: [
      'GET /reports/site/:id/operational-index',
      'GET /reports/by-key/:id',
      'GET /reports/site/:id/quarterly-summary-seed',
      'POST /reports/upsert',
      'POST /api/documents/quarterly/hwpx',
      'POST /api/documents/quarterly/pdf',
    ],
    criticalActions: [
      '분기 보고서 생성',
      '원본 보고서 동기화',
      '자동 저장',
      '문서 다운로드',
    ],
  },
  'site-hub': {
    id: 'site-hub',
    description: '현장 목록에서 기술지도 보고서 허브와 분기 보고서 목록으로 이어진다.',
    routes: ['/', '/sites/site-1', '/sites/site-1/quarterly'],
    markers: ['현장 목록', '기술지도 보고서', '분기 종합 보고서', '분기 종합 보고서 목록'],
    apis: ['GET /assignments/me/sites', 'GET /reports'],
    criticalActions: ['현장 선택', '기술지도 보고서 허브 진입', '분기 종합 보고서 목록 이동'],
  },
};

export const FEATURE_CONTRACT_IDS = Object.keys(FEATURE_CONTRACTS) as FeatureContractId[];

export function getFeatureContract(id: FeatureContractId) {
  return FEATURE_CONTRACTS[id];
}

export function isFeatureContractId(value: string): value is FeatureContractId {
  return value in FEATURE_CONTRACTS;
}
