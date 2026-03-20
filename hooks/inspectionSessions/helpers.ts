'use client';

import { useCallback } from 'react';
import {
  ensureSessionReportNumbers,
  getSessionSortTime,
  normalizeInspectionSite,
} from '@/constants/inspectionSession';
import { SafetyApiError } from '@/lib/safetyApi';
import { buildSafetyMasterData } from '@/lib/safetyApiMappers';
import type { InspectionSite, InspectionSession } from '@/types/inspectionSession';

export const STORAGE_KEY = 'inspection-sessions-v8';
export const SITE_STORAGE_KEY = 'inspection-sites-v8';
export const EMPTY_MASTER_DATA = buildSafetyMasterData([]);

export function sortSessions(items: InspectionSession[]): InspectionSession[] {
  return [...items].sort((left, right) => {
    const primary = getSessionSortTime(right) - getSessionSortTime(left);
    if (primary !== 0) return primary;
    const secondary = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    if (secondary !== 0) return secondary;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function normalizeSessions(items: InspectionSession[]): InspectionSession[] {
  return sortSessions(ensureSessionReportNumbers(items));
}

export function normalizeSites(items: InspectionSite[]): InspectionSite[] {
  return items.map((item) => normalizeInspectionSite(item));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }
  return '요청을 처리하는 중 오류가 발생했습니다.';
}

export function isAuthFailure(error: unknown): boolean {
  return error instanceof SafetyApiError && (error.status === 401 || error.status === 403);
}

export function useCollectionState<T>(
  setState: (value: T[]) => void,
  ref: { current: T[] },
  normalize: (items: T[]) => T[]
) {
  return useCallback(
    (nextItems: T[]) => {
      const normalized = normalize(nextItems);
      ref.current = normalized;
      setState(normalized);
    },
    [normalize, ref, setState]
  );
}
