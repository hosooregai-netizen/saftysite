import type { SafetyContentType, SafetyUserRole } from '@/types/backend';
import type { SafetySiteStatus } from '@/types/controller';

export type ContentEditorMode = 'list' | 'text' | 'image' | 'file';
export type UserRoleView = 'admin' | 'field_agent';

export type ControllerSectionKey =
  | 'overview'
  | 'users'
  | 'headquarters'
  | 'content';

type LegacyControllerSectionKey = ControllerSectionKey | 'sites';

export interface ControllerSectionQuery {
  headquarterId?: string | null;
  siteId?: string | null;
}

export const CONTROLLER_SECTIONS: Array<{
  key: ControllerSectionKey;
  label: string;
  description: string;
}> = [
  { key: 'overview', label: '개요', description: '운영 현황' },
  { key: 'users', label: '사용자', description: '계정 관리' },
  { key: 'headquarters', label: '사업장', description: '본사 정보' },
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

  if (query.headquarterId) {
    searchParams.set('headquarterId', query.headquarterId);
  }

  if (query.siteId) {
    searchParams.set('siteId', query.siteId);
  }

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
  return role === 'super_admin' || role === 'admin';
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
  fileLabels?: [string, string];
}> = [
  { value: 'hazard_category', label: '위험 분류', description: '위험 카테고리 목록값', editorMode: 'list', bodyLabel: '표시 텍스트' },
  { value: 'accident_type', label: '재해 유형', description: '재해 유형 목록값', editorMode: 'list', bodyLabel: '표시 텍스트' },
  { value: 'measurement_template', label: '계측 점검 템플릿', description: '작성자 화면 doc10 장비 선택 시 기준이 자동 입력됩니다.', editorMode: 'text', bodyLabel: '안전 기준', usageHint: '장비명과 안전 기준만 입력하면 작성자 화면의 계측 점검 카드에서 바로 자동 채워집니다.' },
  { value: 'safety_news', label: '안전 정보', description: '작성자 화면 doc14에 제목과 이미지가 보고일 기준으로 자동 연결됩니다.', editorMode: 'image', bodyLabel: '안내 문구(선택)', usageHint: '제목과 대표 이미지를 등록하면 날짜가 맞는 문서 14에 바로 반영됩니다.' },
  { value: 'disaster_case', label: '재해 사례', description: '작성자 화면 doc13에 제목, 사례 요약, 대표 이미지가 카드로 반영됩니다.', editorMode: 'image', bodyLabel: '사례 요약(선택)', usageHint: '제목과 대표 이미지를 등록하고 날짜를 맞추면 문서 13에 자동 반영됩니다.' },
  { value: 'campaign_template', label: '캠페인 자료', description: '캠페인 문구와 이미지 관리', editorMode: 'image', bodyLabel: '캠페인 설명' },
  { value: 'legal_reference', label: '법령 / 참고자료', description: '법령 본문과 참고자료 파일 관리', editorMode: 'file', bodyLabel: '법령 본문', fileLabels: ['참고자료 1', '참고자료 2'] },
  { value: 'correction_result_option', label: '시정조치 결과 옵션', description: '결과 옵션 목록값', editorMode: 'list', bodyLabel: '표시 텍스트' },
];

/** 관리자 콘텐츠 메뉴에는 노출하지 않음. 기존 데이터 조회·편집용 메타만 유지 */
const LEGACY_AI_PROMPT_META = {
  value: 'ai_prompt' as const,
  label: 'AI 프롬프트',
  description: '자동생성용 프롬프트 텍스트',
  editorMode: 'text' as const,
  bodyLabel: '프롬프트 본문',
};

export const CONTENT_TYPE_LABELS = {
  ...Object.fromEntries(CONTENT_TYPE_OPTIONS.map((option) => [option.value, option.label])),
  ai_prompt: LEGACY_AI_PROMPT_META.label,
} as Record<SafetyContentType, string>;

export const CONTENT_TYPE_META = {
  ...Object.fromEntries(CONTENT_TYPE_OPTIONS.map((option) => [option.value, option])),
  ai_prompt: LEGACY_AI_PROMPT_META,
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

