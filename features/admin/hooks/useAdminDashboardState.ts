'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  primeControllerDashboardContentItems,
  primeControllerDashboardData,
} from '@/hooks/controller/useControllerDashboard';
import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import {
  createSafetyAssignment,
  createSafetyContentItem,
  createSafetyHeadquarter,
  createSafetySite,
  createSafetyUser,
  deactivateSafetyAssignment,
  deleteSafetyContentItem,
  deleteSafetyHeadquarter,
  deleteSafetySite,
  deleteSafetyUser,
  updateSafetyAssignment,
  updateSafetyContentItem,
  updateSafetyHeadquarter,
  updateSafetySite,
  updateSafetyUser,
  updateSafetyUserPassword,
} from '@/lib/safetyApi/adminEndpoints';
import {
  buildAssignmentPayload,
  deleteAssignmentsById,
  hasValues,
  refreshAdminMasterData,
} from '@/features/admin/lib/adminDashboardMutations';
import { ADMIN_SECTIONS, getAdminSectionHref, parseAdminSectionKey } from '@/lib/admin';
import type { AdminSectionKey } from '@/lib/admin';
import type {
  ControllerDashboardData,
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
  return '관리자 데이터를 처리하는 중 오류가 발생했습니다.';
}

interface UseAdminDashboardStateOptions {
  enabled: boolean;
  refreshMasterData?: () => Promise<void> | void;
}

export function useAdminDashboardState({
  enabled,
  refreshMasterData,
}: UseAdminDashboardStateOptions) {
  const [data, setData] = useState<ControllerDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = parseAdminSectionKey(searchParams.get('section')) ?? 'overview';
  const activeSectionMeta = useMemo(
    () => ADMIN_SECTIONS.find((section) => section.key === activeSection) ?? ADMIN_SECTIONS[0],
    [activeSection],
  );

  const getToken = useCallback(() => {
    const token = readSafetyAuthToken();
    if (!token) throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    return token;
  }, []);

  const reload = useCallback(async (options?: { includeContent?: boolean }) => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const { assignments, headquarters, sites, users } = await primeControllerDashboardData(token);

      setData((current) => ({
        ...current,
        assignments,
        headquarters,
        sites,
        users,
      }));

      if (options?.includeContent) {
        setIsContentLoading(true);
        const contentItems = await primeControllerDashboardContentItems(token);
        setData((current) => ({ ...current, contentItems }));
      }
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  }, [enabled, getToken]);

  useEffect(() => {
    if (enabled) {
      void reload({ includeContent: activeSection === 'content' });
    }
  }, [activeSection, enabled, reload]);

  const selectSection = useCallback(
    (nextSection: AdminSectionKey) => {
      router.replace(getAdminSectionHref(nextSection));
    },
    [router],
  );

  const runMutation = useCallback(
    async (task: (token: string) => Promise<unknown>, successMessage: string) => {
      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        await task(getToken());

        try {
          await reload({ includeContent: activeSection === 'content' });
          setNotice(successMessage);
        } catch (reloadError) {
          console.error('Admin dashboard reload failed after mutation', reloadError);
          setNotice(
            `${successMessage} 목록 새로고침에는 실패했습니다. 페이지를 새로고침하거나 다시 시도해 주세요.`,
          );
        }
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsMutating(false);
      }
    },
    [activeSection, getToken, reload],
  );

  const runContentMutation = useCallback(
    async (task: (token: string) => Promise<unknown>, successMessage: string) => {
      await runMutation(task, successMessage);
      await refreshAdminMasterData(refreshMasterData);
    },
    [refreshMasterData, runMutation],
  );

  return {
    activeSection,
    activeSectionMeta,
    data,
    error,
    isContentLoading,
    isLoading,
    isMutating,
    notice,
    reload,
    selectSection,
    createUser: (input: SafetyUserCreateInput) =>
      runMutation((token) => createSafetyUser(token, input), '사용자를 생성했습니다.'),
    updateUser: (id: string, input: SafetyUserUpdateInput) =>
      runMutation((token) => updateSafetyUser(token, id, input), '사용자 정보를 수정했습니다.'),
    resetUserPassword: (id: string, password: string) =>
      runMutation((token) => updateSafetyUserPassword(token, id, password), '비밀번호를 변경했습니다.'),
    saveUserEdit: (id: string, input: SafetyUserUpdateInput, password?: string | null) =>
      runMutation(
        async (token) => {
          if (hasValues(input)) {
            await updateSafetyUser(token, id, input);
          }
          if (password) {
            await updateSafetyUserPassword(token, id, password);
          }
        },
        hasValues(input) && password
          ? '사용자 정보와 비밀번호를 수정했습니다.'
          : password
            ? '비밀번호를 변경했습니다.'
            : '사용자 정보를 수정했습니다.',
      ),
    deleteUser: (id: string) =>
      runMutation(async (token) => {
        const assignmentIds = data.assignments
          .filter((assignment) => assignment.user_id === id)
          .map((assignment) => assignment.id);
        await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);
        await deleteSafetyUser(token, id);
      }, '사용자를 삭제했습니다.'),
    createHeadquarter: (input: SafetyHeadquarterInput) =>
      runMutation((token) => createSafetyHeadquarter(token, input), '사업장 정보를 생성했습니다.'),
    updateHeadquarter: (id: string, input: SafetyHeadquarterUpdateInput) =>
      runMutation((token) => updateSafetyHeadquarter(token, id, input), '사업장 정보를 수정했습니다.'),
    deleteHeadquarter: (id: string) =>
      runMutation(async (token) => {
        const relatedSites = data.sites.filter((site) => site.headquarter_id === id);
        const relatedSiteIds = new Set(relatedSites.map((site) => site.id));
        const assignmentIds = data.assignments
          .filter((assignment) => relatedSiteIds.has(assignment.site_id))
          .map((assignment) => assignment.id);

        await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);

        for (const site of relatedSites) {
          await deleteSafetySite(token, site.id);
        }

        await deleteSafetyHeadquarter(token, id);
      }, '사업장을 삭제했습니다.'),
    createSite: (input: SafetySiteInput) =>
      runMutation((token) => createSafetySite(token, input), '현장을 생성했습니다.'),
    updateSite: (id: string, input: SafetySiteUpdateInput) =>
      runMutation((token) => updateSafetySite(token, id, input), '현장 정보를 수정했습니다.'),
    deleteSite: (id: string) =>
      runMutation(async (token) => {
        const assignmentIds = data.assignments
          .filter((assignment) => assignment.site_id === id)
          .map((assignment) => assignment.id);
        await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);
        await deleteSafetySite(token, id);
      }, '현장을 삭제했습니다.'),
    createAssignment: (input: SafetyAssignmentInput) =>
      runMutation(async (token) => {
        const existingAssignment = data.assignments.find(
          (assignment) =>
            assignment.site_id === input.site_id && assignment.user_id === input.user_id,
        );

        if (existingAssignment) {
          await updateSafetyAssignment(token, existingAssignment.id, {
            role_on_site: input.role_on_site ?? existingAssignment.role_on_site,
            memo: input.memo ?? existingAssignment.memo ?? null,
            is_active: true,
          });
          return;
        }

        await createSafetyAssignment(token, input);
      }, '현장 배정을 생성했습니다.'),
    assignFieldAgentToSite: (
      siteId: string,
      userId: string,
      options?: { roleOnSite?: string; memo?: string | null },
    ) =>
      runMutation(async (token) => {
        const matchedAssignment = data.assignments.find(
          (assignment) => assignment.site_id === siteId && assignment.user_id === userId,
        );

        if (matchedAssignment) {
          if (matchedAssignment.is_active) return;
          await updateSafetyAssignment(token, matchedAssignment.id, {
            ...buildAssignmentPayload('현장 지도요원', options, matchedAssignment),
            is_active: true,
          });
          return;
        }

        await createSafetyAssignment(token, {
          site_id: siteId,
          user_id: userId,
          ...buildAssignmentPayload('현장 지도요원', options),
        });
      }, '지도요원을 배정했습니다.'),
    unassignFieldAgentFromSite: (siteId: string, userId: string) =>
      runMutation(async (token) => {
        const matchedAssignment = data.assignments.find(
          (assignment) =>
            assignment.site_id === siteId &&
            assignment.user_id === userId &&
            assignment.is_active,
        );
        if (!matchedAssignment) return;
        await deactivateSafetyAssignment(token, matchedAssignment.id);
      }, '지도요원 배정을 해제했습니다.'),
    updateAssignment: (id: string, input: SafetyAssignmentUpdateInput) =>
      runMutation((token) => updateSafetyAssignment(token, id, input), '배정 정보를 수정했습니다.'),
    deactivateAssignment: (id: string) =>
      runMutation((token) => deactivateSafetyAssignment(token, id), '배정을 비활성화했습니다.'),
    createContentItem: (input: SafetyContentItemInput) =>
      runContentMutation((token) => createSafetyContentItem(token, input), '콘텐츠 데이터를 생성했습니다.'),
    updateContentItem: (id: string, input: SafetyContentItemUpdateInput) =>
      runContentMutation((token) => updateSafetyContentItem(token, id, input), '콘텐츠 데이터를 수정했습니다.'),
    deleteContentItem: (id: string) =>
      runContentMutation((token) => deleteSafetyContentItem(token, id), '콘텐츠 데이터를 삭제했습니다.'),
  };
}
