import type { ControllerDashboardData } from '@/types/controller';
import { SafetyApiError } from '@/lib/safetyApi';

export const EMPTY_DATA: ControllerDashboardData = {
  users: [],
  headquarters: [],
  sites: [],
  assignments: [],
  contentItems: [],
};

export const ADMIN_REPORT_LIST_LIMIT = 500;

export interface UseAdminDashboardStateOptions {
  contentCacheScope?: string | null;
  enabled: boolean;
  refreshMasterData?: () => Promise<void> | void;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }
  return '관리자 데이터를 처리하는 중 오류가 발생했습니다.';
}

export function upsertRecordById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index < 0) {
    return [nextItem, ...items];
  }
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function removeRecordById<T extends { id: string }>(items: T[], targetId: string): T[] {
  return items.filter((item) => item.id !== targetId);
}
