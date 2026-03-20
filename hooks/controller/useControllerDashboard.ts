'use client';

import { useCallback, useEffect, useState } from 'react';
import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import {
  createSafetyAssignment,
  createSafetyContentItem,
  createSafetyHeadquarter,
  createSafetySite,
  createSafetyUser,
  deactivateSafetyAssignment,
  deactivateSafetyContentItem,
  deactivateSafetyHeadquarter,
  deactivateSafetySite,
  deactivateSafetyUser,
  fetchSafetyAssignments,
  fetchSafetyContentItemsAdmin,
  fetchSafetyHeadquarters,
  fetchSafetySitesAdmin,
  fetchSafetyUsers,
  updateSafetyAssignment,
  updateSafetyContentItem,
  updateSafetyHeadquarter,
  updateSafetySite,
  updateSafetyUser,
  updateSafetyUserPassword,
} from '@/lib/safetyApi/adminEndpoints';
import type {
  SafetyAssignmentInput,
  SafetyAssignmentUpdateInput,
  SafetyContentItemInput,
  SafetyContentItemUpdateInput,
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteUpdateInput,
  SafetyUserCreateInput,
  SafetyUserUpdateInput,
  ControllerDashboardData,
} from '@/types/controller';

const EMPTY_DATA: ControllerDashboardData = {
  users: [],
  headquarters: [],
  sites: [],
  assignments: [],
  contentItems: [],
};

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) return error.message;
  return '관제 데이터를 처리하는 중 오류가 발생했습니다.';
}

export function useControllerDashboard(enabled: boolean) {
  const [data, setData] = useState<ControllerDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const getToken = useCallback(() => {
    const token = readSafetyAuthToken();
    if (!token) throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    return token;
  }, []);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const [users, headquarters, sites, assignments, contentItems] = await Promise.all([
        fetchSafetyUsers(token),
        fetchSafetyHeadquarters(token),
        fetchSafetySitesAdmin(token),
        fetchSafetyAssignments(token),
        fetchSafetyContentItemsAdmin(token),
      ]);
      setData({ users, headquarters, sites, assignments, contentItems });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, getToken]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const runMutation = useCallback(
    async (task: (token: string) => Promise<unknown>, successMessage: string) => {
      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        await task(getToken());
        await reload();
        setNotice(successMessage);
      } catch (error) {
        const message = getErrorMessage(error);
        setError(message);
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [getToken, reload]
  );

  return {
    data,
    error,
    isLoading,
    isMutating,
    notice,
    reload,
    createUser: (input: SafetyUserCreateInput) =>
      runMutation((token) => createSafetyUser(token, input), '사용자를 생성했습니다.'),
    updateUser: (id: string, input: SafetyUserUpdateInput) =>
      runMutation((token) => updateSafetyUser(token, id, input), '사용자 정보를 수정했습니다.'),
    resetUserPassword: (id: string, password: string) =>
      runMutation((token) => updateSafetyUserPassword(token, id, password), '비밀번호를 변경했습니다.'),
    deactivateUser: (id: string) =>
      runMutation((token) => deactivateSafetyUser(token, id), '사용자를 비활성화했습니다.'),
    createHeadquarter: (input: SafetyHeadquarterInput) =>
      runMutation((token) => createSafetyHeadquarter(token, input), '사업장 정보를 생성했습니다.'),
    updateHeadquarter: (id: string, input: SafetyHeadquarterUpdateInput) =>
      runMutation((token) => updateSafetyHeadquarter(token, id, input), '사업장 정보를 수정했습니다.'),
    deactivateHeadquarter: (id: string) =>
      runMutation((token) => deactivateSafetyHeadquarter(token, id), '사업장을 비활성화했습니다.'),
    createSite: (input: SafetySiteInput) =>
      runMutation((token) => createSafetySite(token, input), '현장을 생성했습니다.'),
    updateSite: (id: string, input: SafetySiteUpdateInput) =>
      runMutation((token) => updateSafetySite(token, id, input), '현장 정보를 수정했습니다.'),
    deactivateSite: (id: string) =>
      runMutation((token) => deactivateSafetySite(token, id), '현장을 종료 처리했습니다.'),
    createAssignment: (input: SafetyAssignmentInput) =>
      runMutation((token) => createSafetyAssignment(token, input), '현장 배정을 생성했습니다.'),
    assignFieldAgentToSite: (
      siteId: string,
      userId: string | null,
      options?: { roleOnSite?: string; memo?: string | null }
    ) =>
      runMutation(async (token) => {
        const activeAssignments = data.assignments.filter(
          (assignment) => assignment.site_id === siteId && assignment.is_active
        );

        for (const assignment of activeAssignments) {
          await deactivateSafetyAssignment(token, assignment.id);
        }

        if (userId) {
          await createSafetyAssignment(token, {
            site_id: siteId,
            user_id: userId,
            role_on_site: options?.roleOnSite || '담당 지도요원',
            memo: options?.memo ?? null,
          });
        }
      }, userId ? '지도요원을 배정했습니다.' : '지도요원 배정을 해제했습니다.'),
    updateAssignment: (id: string, input: SafetyAssignmentUpdateInput) =>
      runMutation((token) => updateSafetyAssignment(token, id, input), '배정 정보를 수정했습니다.'),
    deactivateAssignment: (id: string) =>
      runMutation((token) => deactivateSafetyAssignment(token, id), '배정을 비활성화했습니다.'),
    createContentItem: (input: SafetyContentItemInput) =>
      runMutation((token) => createSafetyContentItem(token, input), '마스터 데이터를 생성했습니다.'),
    updateContentItem: (id: string, input: SafetyContentItemUpdateInput) =>
      runMutation((token) => updateSafetyContentItem(token, id, input), '마스터 데이터를 수정했습니다.'),
    deactivateContentItem: (id: string) =>
      runMutation((token) => deactivateSafetyContentItem(token, id), '마스터 데이터를 비활성화했습니다.'),
  };
}
