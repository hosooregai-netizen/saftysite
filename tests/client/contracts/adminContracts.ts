import type { FeatureContract } from './shared';

export const ADMIN_FEATURE_CONTRACTS = {
  'admin-control-center': {
    id: 'admin-control-center',
    description:
      '관제 대시보드 overview/analytics가 admin 로그인 진입, overview-first 로딩, session cache 기반 재진입, KPI/차트/기준월 전환, 기준월 고정 상세표, 기간 전환, directory lookups 기반 계약 유형 옵션, site 계약 연동 매출, 과거 예정 일정을 실회차로 인정하는 집계, 직원별 표의 지연 중심 간소화, 현장별 표의 건설사/진행률 copy, export 진입 흐름, 그리고 자료 부족 표에서 현장/사업장 이름이 우선 읽히는 컬럼 배치를 유지한다.',
    routes: ['/admin?section=overview', '/admin?section=analytics'],
    markers: ['운영 개요', '현장 상태', '발송 관리 대상', '매출/실적 집계', '실행 회차', '남은 회차', '월별 매출 추이', '상세 표', '건설사', '진행률'],
    apis: ['GET /api/admin/dashboard/overview', 'GET /api/admin/dashboard/analytics', 'GET /api/admin/dashboard/analytics/month-detail', 'GET /api/admin/directory/lookups', 'POST /api/admin/exports/:section'],
    criticalActions: ['admin 로그인 진입', 'overview 진입', 'analytics 진입', 'overview-first 초기 로딩 상태 유지', 'session cache 재진입 확인', '기간 전환', 'analytics 기준월 전환', 'analytics 기준월 상세표 확인', 'analytics 계약유형 lookup 확인', 'site 계약 수정 반영 확인', 'K2B 회차 실적 집계 확인', '과거 예정 일정 실회차 반영 확인', '직원별 불필요 열 제거 확인', '현장별 건설사/진행률 표기 확인', '실행/남은 회차 KPI 확인', 'legacy 무일정 데이터 백필 확인', '엑셀 내보내기', '핵심 카드와 차트 확인'],
  },
  'admin-headquarters': {
    id: 'admin-headquarters',
    description:
      '사업장 목록이 safety-server list passthrough 기반 서버 페이지네이션, session cache, drilldown 진입, 생성/수정/삭제 흐름, 저장 성공 후 empty-body 응답 fallback 재조회, 저장 timeout 시 모달 유지와 안내 메시지, deleted soft-delete hidden refresh를 유지한다.',
    routes: ['/admin?section=headquarters'],
    markers: ['사업장 목록', '사업장 추가', '사업장 수정', '현장 보기'],
    apis: ['GET /api/admin/headquarters/list', 'GET /api/admin/sites/list', 'GET /api/admin/directory/assignments', 'POST /headquarters', 'PATCH /headquarters/:id', 'DELETE /headquarters/:id'],
    criticalActions: ['사업장 목록 페이지 로드', '사업장 생성', '사업장 수정', '사업장 수정 empty-body fallback 재조회 확인', '사업장 수정 timeout 시 모달 유지와 안내 메시지 확인', '현장 drilldown 진입', '사업장 삭제', 'drilldown 현장 생성/수정/삭제 직후 refresh 확인'],
  },
  'admin-users': {
    id: 'admin-users',
    description:
      '사용자 목록이 safety-server list passthrough 기반 서버 페이지네이션, session cache, 검색/필터, 편집 modal 흐름과 저장 timeout 안내를 유지한다.',
    routes: ['/admin?section=users'],
    markers: ['사용자', '사용자 추가', '이름, 이메일, 직책, 소속으로 검색'],
    apis: ['GET /api/admin/users/list', 'GET /api/admin/directory/assignments', 'DELETE /users/:id'],
    criticalActions: ['사용자 목록 조회', '검색 재조회', '사용자 추가 modal 진입', '사용자 수정 modal 진입', '사용자 저장 timeout 시 모달 유지와 안내 메시지 확인'],
  },
  'admin-reports': {
    id: 'admin-reports',
    description:
      '전체 보고서 섹션이 safety-server reports passthrough, directory lookups 기반 필터 참조, session cache 기반 목록 재진입, 품질 체크 저장, 발송 이력 편집, 저장 성공 후 empty-body 응답 fallback 재조회, local row patch 기반 무재조회 갱신, legacy 기술지도 보고서 열기 fallback 흐름을 유지한다.',
    routes: ['/admin?section=reports'],
    markers: [
      '전체 보고서',
      '1차 기술지도 보고서',
      '2026년 1분기 종합 보고서',
      '보고서 품질 체크',
      '분기 보고서 발송 이력',
    ],
    apis: [
      'GET /api/admin/reports',
      'GET /api/admin/directory/lookups',
      'PATCH /api/admin/reports/:id/review',
      'PATCH /api/admin/reports/:id/dispatch',
    ],
    criticalActions: ['보고서 목록 조회', '보고서 필터 lookup 로드 확인', 'session cache 재진입 확인', '품질 체크 저장', '보고서 저장 empty-body fallback 재조회 확인', '발송 이력 저장', '목록 무재조회 row patch 확인', 'legacy 기술지도 보고서 열기 fallback 확인'],
  },
  'admin-sites': {
    id: 'admin-sites',
    description:
      '현장 목록과 현장 메인이 safety-server list/lookups passthrough 기반 서버 페이지네이션, directory lookups 계약유형 옵션, planned 기본 생성, deleted soft-delete hidden, 등록 정보 편집, 저장 성공 후 empty-body 응답 fallback 재조회, 저장 timeout 시 모달 유지와 안내 메시지, 점검자 기준 배정/해제, assignment 저장 전 전체 목록 재조회 없는 빠른 mutation 경로, K2B 회차 데이터 반영 동선을 유지한다.',
    routes: [
      '/admin?section=headquarters&headquarterId=hq-1',
      '/admin?section=headquarters&headquarterId=hq-1&siteId=site-1',
    ],
    markers: ['현장 목록', '현장 추가', '현장 수정', '현장 메인', '지도요원 배정'],
    apis: [
      'GET /api/admin/sites/list',
      'GET /api/admin/sites/:id',
      'GET /api/admin/directory/lookups',
      'GET /api/admin/directory/assignments',
      'POST /sites',
      'PATCH /sites/:id',
      'POST /assignments',
      'DELETE /assignments/:id',
      'DELETE /sites/:id',
    ],
    criticalActions: ['현장 목록 페이지 이동', '현장 생성/수정', '현장 수정 empty-body fallback 재조회 확인', '현장 저장 timeout 시 모달 유지와 안내 메시지 확인', '계약유형 lookup option 확인', 'planned 기본 생성 확인', 'deleted 상태 hidden 확인', '현장 메인 진입', '현장 메인 quick edit', '지도요원 배정 modal 진입', '지도요원 배정/해제', '배정 mutation preflight 축소 확인', '현장 삭제', 'K2B 회차 데이터 반영'],
  },
  'admin-schedules': {
    id: 'admin-schedules',
    description:
      '관제 일정 보드가 safety-server calendar/queue/lookups passthrough 기반 월간 캘린더, 월 네비게이션, queue, lookups, 선택 사유 저장, legacy import 선택 일정의 calendar 우선 노출, 현재 월 기본 흐름을 유지한다.',
    routes: ['/admin?section=schedules&month=2026-04'],
    markers: ['일정/캘린더', '오늘', '방문 일정 선택'],
    apis: [
      'GET /api/admin/schedules/calendar',
      'GET /api/admin/schedules/queue',
      'GET /api/admin/schedules/lookups',
      'PATCH /api/admin/schedules/:id',
    ],
    criticalActions: ['관제 일정 월간 보드 조회', '월 네비게이션 이동', '확정 일정 칩 표시', 'legacy import 선택 일정 표시', '관제 일정 상세 modal 진입', '관제 일정 저장'],
  },
} as const satisfies Record<string, FeatureContract>;

export type AdminFeatureContractId = keyof typeof ADMIN_FEATURE_CONTRACTS;
