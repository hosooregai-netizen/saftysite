import type {
  SiteContractStatus,
  SiteContractType,
} from '@/types/admin';
import type { SafetyContentType, SafetyUserRole } from '@/types/backend';
import type { SafetySiteStatus } from '@/types/controller';

export type ContentEditorMode = 'list' | 'text' | 'image' | 'file';
export type UserRoleView = 'admin' | 'field_agent';

export type ControllerSectionKey =
  | 'overview'
  | 'reports'
  | 'analytics'
  | 'mailbox'
  | 'k2b'
  | 'photos'
  | 'schedules'
  | 'users'
  | 'headquarters'
  | 'content';

type LegacyControllerSectionKey = ControllerSectionKey | 'sites';

export interface ControllerSectionQuery {
  [key: string]: string | null | undefined;
  headquarterId?: string | null;
  siteId?: string | null;
}

export const CONTROLLER_SECTIONS: Array<{
  key: ControllerSectionKey;
  label: string;
  description: string;
}> = [
  { key: 'overview', label: '관제 대시보드', description: '운영 모니터링' },
  { key: 'reports', label: '전체 보고서', description: '보고서 통합 조회' },
  { key: 'analytics', label: '실적/매출', description: '성과 분석' },
  { key: 'mailbox', label: '메일함', description: '발송·수신·회신 관리' },
  { key: 'k2b', label: 'K2B 업로드', description: '엑셀 초기등록 자동화' },
  { key: 'photos', label: '사진첩', description: '현장 사진 통합 조회' },
  { key: 'schedules', label: '일정/캘린더', description: '방문 일정 관리' },
  { key: 'users', label: '사용자', description: '계정 관리' },
  { key: 'headquarters', label: '사업장/현장', description: '현장 관리' },
  { key: 'content', label: '콘텐츠', description: '콘텐츠 관리' },
];

export function parseControllerSectionKey(value: string | null | undefined): ControllerSectionKey | null {
  if (!value) return null;
  if (value === 'sites') return 'headquarters';
  return CONTROLLER_SECTIONS.some((section) => section.key === value)
    ? (value as ControllerSectionKey)
    : null;
}

export function getControllerSectionHref(
  section: ControllerSectionKey,
  query: ControllerSectionQuery = {}
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
  value: string | null | undefined
): value is LegacyControllerSectionKey {
  return value === 'sites' || CONTROLLER_SECTIONS.some((section) => section.key === value);
}

const ADMIN_USER_ROLES = new Set<SafetyUserRole>(['super_admin', 'admin', 'controller']);

export const USER_ROLE_OPTIONS: Array<{ value: UserRoleView; label: string }> = [
  { value: 'admin', label: '관리자' },
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
  currentRole?: SafetyUserRole
): SafetyUserRole {
  if (roleView === 'field_agent') return 'field_agent';
  if (currentRole && isAdminUserRole(currentRole)) return currentRole;
  return 'admin';
}

export function getUserRoleLabel(role: SafetyUserRole): string {
  return toUserRoleView(role) === 'admin' ? '관리자' : '지도요원';
}

export const SITE_STATUS_OPTIONS: Array<{ value: SafetySiteStatus; label: string }> = [
  { value: 'planned', label: '준비중' },
  { value: 'active', label: '운영중' },
  { value: 'closed', label: '종료' },
];
export const SITE_STATUS_LABELS = Object.fromEntries(
  SITE_STATUS_OPTIONS.map((option) => [option.value, option.label])
) as Record<SafetySiteStatus, string>;

export const CONTENT_TYPE_OPTIONS: Array<{
  value: SafetyContentType;
  label: string;
  description: string;
  editorMode: ContentEditorMode;
  bodyLabel: string;
  usageHint?: string;
}> = [
  {
    value: 'measurement_template',
    label: '계측 점검 템플릿',
    description: '작성자 화면 doc10 장비 선택 시 기준이 자동 입력됩니다.',
    editorMode: 'text',
    bodyLabel: '안전 기준',
    usageHint: '장비명과 안전 기준만 입력하면 작성자 화면의 계측 점검 카드에서 바로 자동 채워집니다.',
  },
  {
    value: 'safety_news',
    label: '안전 정보',
    description: '작성자 화면 doc14에 제목과 자산이 보고일 기준으로 자동 연결됩니다.',
    editorMode: 'image',
    bodyLabel: '안내 문구(선택)',
    usageHint: '정렬순 최상위 1건만 문서 14에 반영됩니다. 제목, 안내 문구, PDF/이미지만 등록해 주세요.',
  },
  {
    value: 'disaster_case',
    label: '재해 사례',
    description: '작성자 화면 doc13에 제목, 사례 요약, 대표 이미지가 카드로 반영됩니다.',
    editorMode: 'image',
    bodyLabel: '사례 요약(선택)',
    usageHint: '정렬순 상위 4건만 문서 13에 반영됩니다. 제목, 사례 요약, 대표 이미지만 등록해 주세요.',
  },
  {
    value: 'campaign_template',
    label: 'OPS',
    description: 'OPS(One Point Sheet) 설명과 대표 이미지를 관리합니다.',
    editorMode: 'image',
    bodyLabel: 'OPS 설명',
    usageHint: '분기 보고서의 OPS 섹션에서 선택할 자료입니다. 제목, 설명, 대표 이미지만 등록해 주세요.',
  },
  {
    value: 'doc7_reference_material',
    label: 'DOC7 참고자료',
    description: '재해유형과 기인물 조합으로 DOC7 참고자료를 자동 매칭합니다.',
    editorMode: 'image',
    bodyLabel: '참고자료 내용',
  },
];

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
  return `${value.toLocaleString('ko-KR')}원`;
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
