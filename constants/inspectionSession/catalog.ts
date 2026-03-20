import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type {
  AdminSiteSnapshot,
  CaseFeedItem,
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSectionMeta,
  NotificationMethod,
  SafetyInfoItem,
  WorkPlanCheckKey,
  WorkPlanCheckStatus,
} from '@/types/inspectionSession';

export const UNTITLED_SITE_KEY = '__untitled_site__';
export const DEFAULT_GUIDANCE_AGENCY = '한국종합안전주식회사';
export const DEFAULT_CONSTRUCTION_TYPE = '건설공사';
export const FIXED_SCENE_COUNT = 6;
export const DEFAULT_MEASUREMENT_CRITERIA = [
  '1. 초정밀작업 : 750 Lux 이상',
  '2. 정밀작업 : 300 Lux 이상',
  '3. 보통작업 : 150 Lux 이상',
  '4. 그 밖의 작업 : 75 Lux 이상',
].join('\n');

export const INSPECTION_SECTIONS: InspectionSectionMeta[] = [
  { key: 'doc1', label: '1. 기술지도 대상사업장', shortLabel: '대상사업장', compactLabel: '1' },
  { key: 'doc2', label: '2. 기술지도 개요', shortLabel: '기술지도 개요', compactLabel: '2' },
  { key: 'doc3', label: '3. 현장 전경 및 주요 진행공정', shortLabel: '현장 전경', compactLabel: '3' },
  { key: 'doc4', label: '4. 이전 기술지도 사항 이해여부', shortLabel: '이전 지도 사항', compactLabel: '4' },
  { key: 'doc5', label: '5. 현존 유해·위험요인 분류', shortLabel: '현존 요인 통계', compactLabel: '5' },
  { key: 'doc6', label: '6. 12대 사망사고 기인물', shortLabel: '사망사고 기인물', compactLabel: '6' },
  { key: 'doc7', label: '7. 현존 유해·위험요인 세부 지적', shortLabel: '세부 지적', compactLabel: '7' },
  { key: 'doc8', label: '8. 향후 진행공정 위험요인 및 안전대책', shortLabel: '향후 진행공정', compactLabel: '8' },
  { key: 'doc9', label: '9. 위험성평가 / TBM 체크', shortLabel: '위험성평가 / TBM', compactLabel: '9' },
  { key: 'doc10', label: '10. 계측점검', shortLabel: '계측점검', compactLabel: '10' },
  { key: 'doc11', label: '11. 안전교육', shortLabel: '안전교육', compactLabel: '11' },
  { key: 'doc12', label: '12. 활동 실적', shortLabel: '활동 실적', compactLabel: '12' },
  { key: 'doc13', label: '13. 재해 사례', shortLabel: '재해 사례', compactLabel: '13' },
  { key: 'doc14', label: '14. 안전 정보', shortLabel: '안전 정보', compactLabel: '14' },
];

export const SITE_FORM_FIELDS: Array<{
  key: keyof AdminSiteSnapshot;
  label: string;
  placeholder: string;
}> = [
  { key: 'customerName', label: '고객사명', placeholder: '예: 한국종합안전' },
  { key: 'siteName', label: '현장명', placeholder: '예: 성수 신축 공사 현장' },
  { key: 'assigneeName', label: '현장 담당자', placeholder: '예: 홍길동' },
  { key: 'siteManagementNumber', label: '사업장관리번호', placeholder: '예: 2026-001' },
  { key: 'businessStartNumber', label: '사업개시번호', placeholder: '예: 240318-01' },
  { key: 'constructionPeriod', label: '공사기간', placeholder: '예: 2026.03.01 ~ 2026.07.30' },
  { key: 'constructionAmount', label: '공사금액', placeholder: '예: 1,200,000,000원' },
  { key: 'siteManagerName', label: '현장 책임자', placeholder: '예: 현장소장 김안전' },
  { key: 'siteContactEmail', label: '현장 연락처(이메일)', placeholder: '예: 010-0000-0000 / site@example.com' },
  { key: 'siteAddress', label: '현장 주소', placeholder: '예: 서울시 광진구 ...' },
  { key: 'companyName', label: '회사명', placeholder: '예: 한국종합안전주식회사' },
  { key: 'corporationRegistrationNumber', label: '법인등록번호', placeholder: '예: 110111-0000000' },
  { key: 'businessRegistrationNumber', label: '사업자등록번호', placeholder: '예: 123-45-67890' },
  { key: 'licenseNumber', label: '면허번호', placeholder: '예: 건설업 제2026-01호' },
  { key: 'headquartersContact', label: '본사 연락처', placeholder: '예: 02-0000-0000' },
  { key: 'headquartersAddress', label: '본사 주소', placeholder: '예: 서울시 중구 ...' },
];

export const WORK_PLAN_ITEMS: Array<{ key: WorkPlanCheckKey; label: string }> = [
  { key: 'towerCrane', label: '타워크레인 설치·조립·해체' },
  { key: 'tunnelExcavation', label: '터널굴착작업' },
  { key: 'vehicleLoadingMachine', label: '차량계 하역운반기계 사용' },
  { key: 'bridgeWork', label: '교량작업' },
  { key: 'constructionMachine', label: '차량계 건설기계 사용' },
  { key: 'quarryWork', label: '채석작업' },
  { key: 'chemicalFacility', label: '화학설비 외 부속설비 사용' },
  { key: 'buildingDemolition', label: '건물 등의 해체작업' },
  { key: 'electricalWork', label: '전기작업' },
  { key: 'heavyMaterialHandling', label: '중량물 취급작업' },
  { key: 'earthwork', label: '굴착작업' },
  { key: 'railwayFacilityMaintenance', label: '궤도와 그 밖의 설비보수 작업' },
  { key: 'otherHighRiskWork', label: '그 밖의 고위험 작업' },
];

export const WORK_PLAN_STATUS_OPTIONS: Array<{ value: WorkPlanCheckStatus; label: string }> = [
  { value: 'written', label: '작성' },
  { value: 'not_written', label: '미작성' },
  { value: 'not_applicable', label: '해당없음' },
];

export const NOTIFICATION_METHOD_OPTIONS: Array<{ value: NotificationMethod; label: string }> = [
  { value: 'direct', label: '직접전달' },
  { value: 'registered_mail', label: '등기우편' },
  { value: 'email', label: '전자우편' },
  { value: 'mobile', label: '모바일' },
  { value: 'other', label: '기타' },
];

export const ACCIDENT_TYPE_OPTIONS = ['추락', '낙하', '충돌', '감전', '끼임', '전도', '화재·폭발', '붕괴', '기타'] as const;

export const LEGAL_REFERENCE_LIBRARY = [
  { id: 'rule-386', title: '산업안전보건기준에 관한 규칙 제386조', body: '제386조(중량물의 구름 위험방지) 사업주는 드럼통 등 구를 위험이 있는 중량물을 취급하는 경우 구름멈춤대, 쐐기 등을 이용하여 중량물의 움직임을 방지해야 한다.', referenceMaterial1: '참고자료 예시 1', referenceMaterial2: '참고자료 예시 2' },
  { id: 'rule-43', title: '산업안전보건기준에 관한 규칙 제43조', body: '단부·개구부에는 안전난간, 울타리, 덮개 등 추락 방호조치를 적정하게 설치해야 한다.', referenceMaterial1: '단부 안전난간 설치 가이드', referenceMaterial2: '개구부 덮개 고정 점검표' },
  { id: 'act-36', title: '산업안전보건법 제36조', body: '사업주는 유해·위험 요인을 찾아내어 위험성을 평가하고, 그 결과에 따라 필요한 조치를 하여야 한다.', referenceMaterial1: '위험성평가 절차 체크리스트', referenceMaterial2: '근로자 참여형 위험성평가 사례' },
];

export const FUTURE_PROCESS_LIBRARY = [
  { processName: '철골 자재 가공 및 반입 작업', hazard: '중량물 낙하, 반입 동선 내 충돌, 자재 적치 불량에 따른 전도 위험', countermeasure: '적재 기준 준수, 작업구역 출입통제, 유도자 배치 및 양중 전 점검 실시' },
  { processName: '외부 비계 해체 작업', hazard: '해체 중 추락, 낙하물 발생, 비계 부재 이동 중 협착 위험', countermeasure: '해체 순서 준수, 안전대 체결, 하부 출입통제 및 낙하물 방지망 설치' },
  { processName: '전기 판넬 시공 작업', hazard: '감전, 임시배선 훼손, 협소 공간 내 충돌 위험', countermeasure: '잠금표지 실시, 절연 보호구 착용, 임시배선 정리 및 작업 전 점검' },
  { processName: '콘크리트 타설 준비 작업', hazard: '거푸집 붕괴, 작업발판 추락, 장비와 근로자 간 충돌 위험', countermeasure: '거푸집 점검, 작업발판 고정, 장비 작업반경 통제 및 신호수 배치' },
];

export const ACTIVITY_TYPE_OPTIONS = ['안전보건 캠페인', '안전보건 포스터·현수막 제공', '안전점검 보조', '작업 전 안전미팅 지원'];
export const TBM_QUESTION_PROMPTS = ['작업 전 TBM(안전점검 회의) 실시 여부', '금일 작업내용 / 사용장비 현황 전파 여부', '금일 작업의 위험요인과 안전대책 공유 여부', '개인보호구 착용 상태 및 근로자 건강상태 확인 여부', '작업 전 TBM 관련 기록 유지 여부'] as const;
export const RISK_ASSESSMENT_QUESTION_PROMPTS = ['위험성평가 실시 여부(최초, 상시 등)', '위험성평가 시 근로자 참여 여부', '위험성평가 실시 시기 준수', '위험성평가의 위험요인, 대책 이행결과 확인', '위험성평가 관련 기록관리 여부'] as const;

export const DEFAULT_CASE_FEED: CaseFeedItem[] = [
  { id: 'case-fall-object', title: '낙하물 사고', summary: '상부 작업 중 공구가 낙하하여 하부 작업자가 부상을 입은 사례입니다.', imageUrl: '' },
  { id: 'case-electric-shock', title: '감전 사고', summary: '임시배선 손상 상태에서 작업하던 중 감전이 발생한 사례입니다.', imageUrl: '' },
  { id: 'case-fall', title: '추락 사고', summary: '개구부 보호조치 미흡 상태에서 근로자가 추락한 사례입니다.', imageUrl: '' },
  { id: 'case-collapse', title: '붕괴 사고', summary: '가설 구조물 고정 불량으로 작업구간이 붕괴된 사례입니다.', imageUrl: '' },
];

export const DEFAULT_SAFETY_INFOS: SafetyInfoItem[] = [
  { id: 'safety-info-1', title: '이번 주 안전정보', body: '기상 변화가 큰 시기에는 자재 적치와 이동 통로 상태를 먼저 점검하고, 고소작업 전 보호구 착용 상태를 반드시 재확인합니다.', imageUrl: '' },
];

export const DEFAULT_DOCUMENT_SOURCES: Record<InspectionSectionKey, InspectionDocumentSource> = {
  doc1: 'admin',
  doc2: 'manual',
  doc3: 'manual',
  doc4: 'derived',
  doc5: 'derived',
  doc6: 'derived',
  doc7: 'manual',
  doc8: 'api',
  doc9: 'manual',
  doc10: 'manual',
  doc11: 'manual',
  doc12: 'manual',
  doc13: 'readonly',
  doc14: 'readonly',
};

export const FATAL_ACCIDENT_MEASURE_LIBRARY = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right])
) as Array<{ key: CausativeAgentKey; number: number; label: string; guidance: string }>;
