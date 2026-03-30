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
import {
  ADMIN_SECTIONS,
  getAdminSectionHref,
  isLegacyAdminSectionKey,
  parseAdminSectionKey,
} from '@/lib/admin';
import type { AdminSectionKey, AdminSectionQuery } from '@/lib/admin';
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

function upsertRecordById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index < 0) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
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
  const [hasLoadedCoreData, setHasLoadedCoreData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSection = searchParams.get('section');
  const selectedHeadquarterId = searchParams.get('headquarterId');
  const selectedSiteId = searchParams.get('siteId');
  const activeSection = parseAdminSectionKey(rawSection) ?? 'headquarters';
  const activeSectionMeta = useMemo(
    () => ADMIN_SECTIONS.find((section) => section.key === activeSection) ?? ADMIN_SECTIONS[0],
    [activeSection],
  );
  const selectedHeadquarter = useMemo(
    () =>
      selectedHeadquarterId
        ? data.headquarters.find((item) => item.id === selectedHeadquarterId) ?? null
        : null,
    [data.headquarters, selectedHeadquarterId],
  );
  const selectedSite = useMemo(
    () =>
      selectedSiteId ? data.sites.find((item) => item.id === selectedSiteId) ?? null : null,
    [data.sites, selectedSiteId],
  );

  const replaceRoute = useCallback(
    (section: AdminSectionKey, query: AdminSectionQuery = {}) => {
      router.replace(getAdminSectionHref(section, query));
    },
    [router],
  );

  const getToken = useCallback(() => {
    const token = readSafetyAuthToken();
    if (!token) throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    return token;
  }, []);

  const reload = useCallback(async (options?: { includeContent?: boolean; force?: boolean }) => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const { assignments, headquarters, sites, users } = await primeControllerDashboardData(token, {
        force: options?.force,
      });

      setData((current) => ({
        ...current,
        assignments,
        headquarters,
        sites,
        users,
      }));

      if (options?.includeContent) {
        setIsContentLoading(true);
        const contentItems = await primeControllerDashboardContentItems(token, {
          force: options?.force,
        });
        setData((current) => ({ ...current, contentItems }));
      }
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setHasLoadedCoreData(true);
      setIsLoading(false);
      setIsContentLoading(false);
    }
  }, [enabled, getToken]);

  useEffect(() => {
    if (enabled) {
      void reload({ includeContent: activeSection === 'content' });
    }
  }, [activeSection, enabled, reload]);

  useEffect(() => {
    if (!enabled) return;

    if (!rawSection || !isLegacyAdminSectionKey(rawSection)) {
      replaceRoute('headquarters', {
        headquarterId: selectedHeadquarterId,
        siteId: selectedSiteId,
      });
    }
  }, [enabled, rawSection, replaceRoute, selectedHeadquarterId, selectedSiteId]);

  useEffect(() => {
    if (!enabled || !hasLoadedCoreData) return;
    if (!rawSection || !isLegacyAdminSectionKey(rawSection)) return;

    if (rawSection === 'sites') {
      const matchedSite = selectedSiteId
        ? data.sites.find((site) => site.id === selectedSiteId) ?? null
        : null;
      replaceRoute('headquarters', {
        headquarterId: matchedSite?.headquarter_id ?? selectedHeadquarterId,
        siteId: matchedSite ? selectedSiteId : null,
      });
      return;
    }

    if (activeSection !== 'headquarters') return;

    if (selectedSiteId) {
      if (!selectedSite) {
        replaceRoute('headquarters', {
          headquarterId: selectedHeadquarterId,
        });
        return;
      }

      if (selectedHeadquarterId !== selectedSite.headquarter_id) {
        replaceRoute('headquarters', {
          headquarterId: selectedSite.headquarter_id,
          siteId: selectedSite.id,
        });
        return;
      }
    }

    if (selectedHeadquarterId && !selectedHeadquarter) {
      replaceRoute('headquarters');
    }
  }, [
    activeSection,
    data.sites,
    enabled,
    hasLoadedCoreData,
    rawSection,
    replaceRoute,
    selectedHeadquarter,
    selectedHeadquarterId,
    selectedSite,
    selectedSiteId,
  ]);

  const selectSection = useCallback(
    (nextSection: AdminSectionKey, query: AdminSectionQuery = {}) => {
      replaceRoute(nextSection, query);
    },
    [replaceRoute],
  );

  const runMutation = useCallback(
    async <TResult>(
      task: (token: string) => Promise<TResult>,
      successMessage: string,
      options?: {
        applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
      }
    ) => {
      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        const result = await task(getToken());

        if (options?.applyResult) {
          setData((current) => options.applyResult!(current, result));
        }

        try {
          await reload({ includeContent: activeSection === 'content', force: true });
          setNotice(successMessage);
        } catch (reloadError) {
          console.error('Admin dashboard reload failed after mutation', reloadError);
          setNotice(`${successMessage} 목록 새로고침은 실패했습니다. 다시 시도해 주세요.`);
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
    async <TResult>(
      task: (token: string) => Promise<TResult>,
      successMessage: string,
      options?: {
        applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
      }
    ) => {
      await runMutation(task, successMessage, options);
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
    selectedHeadquarter,
    selectedHeadquarterId,
    selectedSite,
    selectedSiteId,
    selectSection,
    selectHeadquarter: (headquarterId: string) =>
      replaceRoute('headquarters', { headquarterId }),
    selectSite: (headquarterId: string, siteId: string) =>
      replaceRoute('headquarters', { headquarterId, siteId }),
    clearHeadquarterSelection: () => replaceRoute('headquarters'),
    clearSiteSelection: () =>
      replaceRoute('headquarters', {
        headquarterId: selectedHeadquarterId,
      }),
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
          return null;
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
        return { userId: id };
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
        return { headquarterId: id };
      }, '사업장을 삭제했습니다.'),
    createSite: (input: SafetySiteInput) =>
      runMutation((token) => createSafetySite(token, input), '현장을 생성했습니다.', {
        applyResult: (current, site) => ({
          ...current,
          sites: upsertRecordById(current.sites, site),
        }),
      }),
    updateSite: (id: string, input: SafetySiteUpdateInput) =>
      runMutation((token) => updateSafetySite(token, id, input), '현장 정보를 수정했습니다.', {
        applyResult: (current, site) => ({
          ...current,
          sites: upsertRecordById(current.sites, site),
        }),
      }),
    deleteSite: (id: string) =>
      runMutation(async (token) => {
        const assignmentIds = data.assignments
          .filter((assignment) => assignment.site_id === id)
          .map((assignment) => assignment.id);
        await deleteAssignmentsById(token, assignmentIds, deactivateSafetyAssignment);
        await deleteSafetySite(token, id);
        return { siteId: id };
      }, '현장을 삭제했습니다.', {
        applyResult: (current, result) => ({
          ...current,
          sites: current.sites.filter((site) => site.id !== result.siteId),
          assignments: current.assignments.filter((assignment) => assignment.site_id !== result.siteId),
        }),
      }),
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
          return null;
        }

        await createSafetyAssignment(token, input);
        return null;
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
          if (matchedAssignment.is_active) return null;
          await updateSafetyAssignment(token, matchedAssignment.id, {
            ...buildAssignmentPayload('현장 지도요원', options, matchedAssignment),
            is_active: true,
          });
          return null;
        }

        await createSafetyAssignment(token, {
          site_id: siteId,
          user_id: userId,
          ...buildAssignmentPayload('현장 지도요원', options),
        });
        return null;
      }, '지도요원을 배정했습니다.'),
    unassignFieldAgentFromSite: (siteId: string, userId: string) =>
      runMutation(async (token) => {
        const matchedAssignment = data.assignments.find(
          (assignment) =>
            assignment.site_id === siteId &&
            assignment.user_id === userId &&
            assignment.is_active,
        );
        if (!matchedAssignment) return null;
        await deactivateSafetyAssignment(token, matchedAssignment.id);
        return null;
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
