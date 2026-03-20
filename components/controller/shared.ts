import type { SafetyContentType, SafetyUserRole } from '@/types/backend';
import type { SafetySiteStatus } from '@/types/controller';

export type ControllerSectionKey =
  | 'overview'
  | 'users'
  | 'headquarters'
  | 'sites'
  | 'content';

export const CONTROLLER_SECTIONS: Array<{
  key: ControllerSectionKey;
  label: string;
  description: string;
}> = [
  { key: 'overview', label: '개요', description: '운영 현황' },
  { key: 'users', label: '사용자', description: '계정 관리' },
  { key: 'headquarters', label: '사업장', description: '본사 정보' },
  { key: 'sites', label: '현장', description: '현장 정보' },
  { key: 'content', label: '마스터', description: '콘텐츠 관리' },
];

export const USER_ROLE_OPTIONS: Array<{ value: SafetyUserRole; label: string }> = [
  { value: 'super_admin', label: '최고 관리자' },
  { value: 'admin', label: '관리자' },
  { value: 'controller', label: '관제' },
  { value: 'field_agent', label: '지도요원' },
  { value: 'client_viewer', label: '고객 열람' },
];
export const USER_ROLE_LABELS = Object.fromEntries(
  USER_ROLE_OPTIONS.map((option) => [option.value, option.label])
) as Record<SafetyUserRole, string>;

export const SITE_STATUS_OPTIONS: Array<{ value: SafetySiteStatus; label: string }> = [
  { value: 'planned', label: '준비중' },
  { value: 'active', label: '운영중' },
  { value: 'closed', label: '종료' },
];
export const SITE_STATUS_LABELS = Object.fromEntries(
  SITE_STATUS_OPTIONS.map((option) => [option.value, option.label])
) as Record<SafetySiteStatus, string>;

export const CONTENT_TYPE_OPTIONS: Array<{ value: SafetyContentType; label: string }> = [
  { value: 'hazard_category', label: '위험 카테고리' },
  { value: 'accident_type', label: '사고 유형' },
  { value: 'measurement_template', label: '계측 템플릿' },
  { value: 'safety_news', label: '안전 소식' },
  { value: 'disaster_case', label: '재해 사례' },
  { value: 'campaign_template', label: '캠페인 템플릿' },
  { value: 'ai_prompt', label: 'AI 프롬프트' },
  { value: 'legal_reference', label: '법령 레퍼런스' },
  { value: 'correction_result_option', label: '시정조치 옵션' },
];
export const CONTENT_TYPE_LABELS = Object.fromEntries(
  CONTENT_TYPE_OPTIONS.map((option) => [option.value, option.label])
) as Record<SafetyContentType, string>;

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
