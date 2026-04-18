import type { SiteContractStatus, SiteContractType } from '@/types/admin';
import type { SafetyContentType, SafetyUserRole } from '@/types/backend';
import type { SafetySiteStatus } from '@/types/controller';

export type ContentEditorMode = 'list' | 'text' | 'image' | 'file';
export type UserRoleView = 'admin' | 'field_agent';

export type ControllerSectionKey =
  | 'overview'
  | 'reports'
  | 'analytics'
  | 'mailbox'
  | 'photos'
  | 'schedules'
  | 'users'
  | 'headquarters'
  | 'content';

type LegacyControllerSectionKey = ControllerSectionKey | 'sites' | 'k2b';

export interface ControllerSectionQuery {
  [key: string]: string | null | undefined;
  excelUpload?: string | null;
  headquarterId?: string | null;
  siteId?: string | null;
}

export const CONTROLLER_SECTIONS: Array<{
  key: ControllerSectionKey;
  label: string;
  description: string;
}> = [
  { key: 'overview', label: '관리 대시보드', description: '운영 현황 모니터링' },
  { key: 'reports', label: '전체 보고서', description: '보고서 통합 조회' },
  { key: 'analytics', label: '실적/매출', description: '성과 분석' },
  { key: 'mailbox', label: '메일함', description: '발송 및 수신 관리' },
  { key: 'photos', label: '사진첩', description: '현장 사진 통합 조회' },
  { key: 'schedules', label: '일정/캘린더', description: '방문 일정 관리' },
  { key: 'users', label: '사용자', description: '계정 관리' },
  { key: 'headquarters', label: '사업장/현장', description: '현장 관리' },
  { key: 'content', label: '콘텐츠', description: '콘텐츠 관리' },
];

export function parseControllerSectionKey(value: string | null | undefined): ControllerSectionKey | null {
  if (!value) return null;
  if (value === 'sites' || value === 'k2b') return 'headquarters';
  return CONTROLLER_SECTIONS.some((section) => section.key === value)
    ? (value as ControllerSectionKey)
    : null;
}

export function getControllerSectionHref(
  section: ControllerSectionKey,
  query: ControllerSectionQuery = {},
): string {
  const searchParams = new URLSearchParams();
  searchParams.set('section', section);

  Object.entries(query).forEach(([key, value]) => {
    if (key === 'section') return;
    if (typeof value === 'string' && value.trim()) {
      searchParams.set(key, value);
    }
  });

  return `/admin?${searchParams.toString()}`;
}

export function isLegacyControllerSectionKey(
  value: string | null | undefined,
): value is LegacyControllerSectionKey {
  return value === 'sites' || value === 'k2b' || CONTROLLER_SECTIONS.some((section) => section.key === value);
}

const ADMIN_USER_ROLES = new Set<SafetyUserRole>(['super_admin', 'admin', 'controller']);

export const USER_ROLE_OPTIONS: Array<{ value: UserRoleView; label: string }> = [
  { value: 'admin', label: '관리자/관제' },
  { value: 'field_agent', label: '지도요원' },
];

export function isAdminUserRole(role: SafetyUserRole | null | undefined): boolean {
  return Boolean(role && ADMIN_USER_ROLES.has(role));
}

export function canDeleteControllerCrud(role: SafetyUserRole | null | undefined): boolean {
  return isAdminUserRole(role);
}

export function canUploadContentAssets(role: SafetyUserRole | null | undefined): boolean {
  return isAdminUserRole(role);
}

export function isFieldAgentUserRole(role: SafetyUserRole | null | undefined): boolean {
  return role === 'field_agent';
}

export function toUserRoleView(role: SafetyUserRole): UserRoleView {
  return isAdminUserRole(role) ? 'admin' : 'field_agent';
}

export function toBackendUserRole(
  roleView: UserRoleView,
  currentRole?: SafetyUserRole,
): SafetyUserRole {
  if (roleView === 'field_agent') return 'field_agent';
  if (currentRole && isAdminUserRole(currentRole)) return currentRole;
  return 'admin';
}

export function getUserRoleLabel(role: SafetyUserRole): string {
  return toUserRoleView(role) === 'admin' ? '관리자/관제' : '지도요원';
}

export const SITE_STATUS_OPTIONS: Array<{ value: Exclude<SafetySiteStatus, 'deleted'>; label: string }> = [
  { value: 'planned', label: '미착수' },
  { value: 'active', label: '진행중' },
  { value: 'paused', label: '중지' },
  { value: 'closed', label: '종료 예정' },
];

export function normalizeSiteStatusForDisplay(
  value: string | null | undefined,
): Exclude<SafetySiteStatus, 'deleted'> {
  return value === 'planned' || value === 'active' || value === 'paused' || value === 'closed'
    ? value
    : 'active';
}

export const SITE_STATUS_LABELS: Record<SafetySiteStatus, string> = {
  planned: '미착수',
  active: '진행중',
  paused: '중지',
  closed: '종료 예정',
  deleted: '삭제',
};

export function getSiteStatusLabel(value: string | null | undefined): string {
  if (value === 'deleted') {
    return SITE_STATUS_LABELS.deleted;
  }
  return SITE_STATUS_LABELS[normalizeSiteStatusForDisplay(value)];
}

export const CONTENT_TYPE_OPTIONS: Array<{
  value: SafetyContentType;
  label: string;
  description: string;
  editorMode: ContentEditorMode;
  bodyLabel: string;
  usageHint?: string;
  fileLabels?: [string, string?];
}> = [
  {
    value: 'measurement_template',
    label: '계측 기준 템플릿',
    description: '문서 작성 시 장비별 안전 기준을 자동으로 채웁니다.',
    editorMode: 'text',
    bodyLabel: '안전 기준',
    usageHint: '장비명과 안전 기준을 입력하면 문서 작성 화면에 자동 반영됩니다.',
  },
  {
    value: 'safety_news',
    label: '안전 정보',
    description: '문서 14에 연결되는 공지형 콘텐츠입니다.',
    editorMode: 'image',
    bodyLabel: '안내 문구',
    usageHint: '제목, 안내 문구, PDF 또는 이미지 자료를 함께 등록해 주세요.',
  },
  {
    value: 'disaster_case',
    label: '재해 사례',
    description: '문서 13에 반영되는 사례형 콘텐츠입니다.',
    editorMode: 'image',
    bodyLabel: '사례 요약',
    usageHint: '제목, 요약, 대표 이미지를 등록하면 사례 카드로 노출됩니다.',
  },
  {
    value: 'campaign_template',
    label: 'OPS',
    description: 'OPS(One Point Sheet) 설명과 대표 이미지를 관리합니다.',
    editorMode: 'image',
    bodyLabel: 'OPS 설명',
    usageHint: '분기 보고서의 OPS 섹션에서 사용하는 자료입니다.',
  },
  {
    value: 'doc7_reference_material',
    label: 'DOC7 참고자료',
    description: '사고 유형과 기인물 조합으로 DOC7 참고자료를 자동 매핑합니다.',
    editorMode: 'image',
    bodyLabel: '참고자료 내용',
  },
  {
    value: 'legal_reference',
    label: '법령 참고자료',
    description: 'ERP 문서 작성 시 참고할 법령 자료를 관리합니다.',
    editorMode: 'file',
    bodyLabel: '설명',
    fileLabels: ['참고자료 1', '참고자료 2'],
  },
  {
    value: 'correction_result_option',
    label: '시정 결과 옵션',
    description: '시정 결과 선택지로 노출되는 목록 값입니다.',
    editorMode: 'list',
    bodyLabel: '옵션 값',
  },
  {
    value: 'tbm_template',
    label: 'TBM 템플릿',
    description: 'TBM 문서 작성에 사용하는 텍스트 템플릿입니다.',
    editorMode: 'text',
    bodyLabel: '템플릿 내용',
  },
  {
    value: 'notice_template',
    label: '공지 템플릿',
    description: '공지 및 작업지시 계열 문서에 공통으로 쓰는 템플릿입니다.',
    editorMode: 'text',
    bodyLabel: '템플릿 내용',
  },
  {
    value: 'education_template',
    label: '교육 템플릿',
    description: '안전교육 문서용 템플릿입니다.',
    editorMode: 'text',
    bodyLabel: '템플릿 내용',
  },
  {
    value: 'ai_prompt',
    label: 'AI 프롬프트',
    description: 'AI 보조 작성에 사용하는 프롬프트를 관리합니다.',
    editorMode: 'text',
    bodyLabel: '프롬프트',
  },
  {
    value: 'ppe_catalog',
    label: '보호구 카탈로그',
    description: '보호구 선택에 사용하는 목록형 콘텐츠입니다.',
    editorMode: 'list',
    bodyLabel: '목록 값',
  },
  {
    value: 'worker_trade',
    label: '직종 목록',
    description: '작업자 직종 선택에 사용하는 목록형 콘텐츠입니다.',
    editorMode: 'list',
    bodyLabel: '목록 값',
  },
];

const CONTENT_CRUD_LAST_VISIBLE_TYPE: SafetyContentType = 'doc7_reference_material';

export const CONTENT_CRUD_TYPE_OPTIONS = CONTENT_TYPE_OPTIONS.slice(
  0,
  CONTENT_TYPE_OPTIONS.findIndex((option) => option.value === CONTENT_CRUD_LAST_VISIBLE_TYPE) + 1,
);

export const CONTENT_TYPE_LABELS = {
  ...Object.fromEntries(CONTENT_TYPE_OPTIONS.map((option) => [option.value, option.label])),
} as Record<SafetyContentType, string>;

export const CONTENT_TYPE_META = {
  ...Object.fromEntries(CONTENT_TYPE_OPTIONS.map((option) => [option.value, option])),
} as Record<SafetyContentType, (typeof CONTENT_TYPE_OPTIONS)[number]>;

export const CONTENT_EDITOR_MODE_LABELS: Record<ContentEditorMode, string> = {
  list: '목록값',
  text: '텍스트',
  image: '이미지 업로드',
  file: '파일 업로드',
};

export function toNullableText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrencyValue(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export const SITE_CONTRACT_TYPE_OPTIONS: Array<{
  label: string;
  value: SiteContractType;
}> = [
  { value: '', label: '선택' },
  { value: 'private', label: '민간계약' },
  { value: 'negotiated', label: '수의계약' },
  { value: 'bid', label: '입찰계약' },
  { value: 'maintenance', label: '유지보수' },
  { value: 'other', label: '기타' },
];

export const SITE_CONTRACT_STATUS_OPTIONS: Array<{
  label: string;
  value: SiteContractStatus;
}> = [
  { value: '', label: '선택' },
  { value: 'ready', label: '준비중' },
  { value: 'active', label: '진행중' },
  { value: 'paused', label: '중지' },
  { value: 'completed', label: '완료' },
];

export const SITE_CONTRACT_TYPE_LABELS = Object.fromEntries(
  SITE_CONTRACT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<SiteContractType, string>;

export const SITE_CONTRACT_STATUS_LABELS = Object.fromEntries(
  SITE_CONTRACT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<SiteContractStatus, string>;

export function parseContentBody(value: string): Record<string, unknown> | string {
  const normalized = value.trim();
  if (!normalized) return '';

  try {
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    return normalized;
  }
}

export function stringifyContentBody(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? {}, null, 2);
}

export function formatTimestamp(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
