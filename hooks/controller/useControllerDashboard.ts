'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  fetchSafetyAssignmentsPage,
  fetchSafetyContentItemsAdminPage,
  fetchSafetyHeadquartersPage,
  fetchSafetySitesAdminPage,
  fetchSafetyUsersPage,
  updateSafetyAssignment,
  updateSafetyContentItem,
  updateSafetyHeadquarter,
  updateSafetySite,
  updateSafetyUser,
  updateSafetyUserPassword,
} from '@/lib/safetyApi/adminEndpoints';
import type {
  SafetyAssignmentInput,
  SafetyAssignment,
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

const CONTROLLER_DASHBOARD_CACHE_TTL_MS = 1000 * 60;
const CONTROLLER_DASHBOARD_PAGE_LIMIT = 200;

const EMPTY_DATA: ControllerDashboardData = {
  users: [],
  headquarters: [],
  sites: [],
  assignments: [],
  contentItems: [],
};

type ControllerDashboardCoreData = Omit<ControllerDashboardData, 'contentItems'>;

const controllerDashboardCache: {
  token: string | null;
  data: ControllerDashboardData;
  coreLoadedAt: number;
  contentLoadedAt: number;
  corePromise: Promise<ControllerDashboardCoreData> | null;
  contentPromise: Promise<ControllerDashboardData['contentItems']> | null;
} = {
  token: null,
  data: EMPTY_DATA,
  coreLoadedAt: 0,
  contentLoadedAt: 0,
  corePromise: null,
  contentPromise: null,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) return error.message;
  return '관리자 데이터를 처리하는 중 오류가 발생했습니다.';
}

function cloneDashboardData(data: ControllerDashboardData): ControllerDashboardData {
  return {
    users: [...data.users],
    headquarters: [...data.headquarters],
    sites: [...data.sites],
    assignments: [...data.assignments],
    contentItems: [...data.contentItems],
  };
}

function isFresh(timestamp: number): boolean {
  return timestamp > 0 && Date.now() - timestamp < CONTROLLER_DASHBOARD_CACHE_TTL_MS;
}

function resetControllerDashboardCache(token: string | null) {
  controllerDashboardCache.token = token;
  controllerDashboardCache.data = cloneDashboardData(EMPTY_DATA);
  controllerDashboardCache.coreLoadedAt = 0;
  controllerDashboardCache.contentLoadedAt = 0;
  controllerDashboardCache.corePromise = null;
  controllerDashboardCache.contentPromise = null;
}

function ensureControllerDashboardCacheToken(token: string) {
  if (controllerDashboardCache.token !== token) {
    resetControllerDashboardCache(token);
  }
}

function getControllerDashboardCoreData(): ControllerDashboardCoreData {
  const { users, headquarters, sites, assignments } = controllerDashboardCache.data;
  return { users, headquarters, sites, assignments };
}

function getCachedControllerDashboardData(token: string | null): ControllerDashboardData {
  if (!token || controllerDashboardCache.token !== token) {
    return cloneDashboardData(EMPTY_DATA);
  }

  return cloneDashboardData(controllerDashboardCache.data);
}

function hasControllerDashboardCriticalData(data: ControllerDashboardData): boolean {
  return (
    data.users.length > 0 ||
    data.headquarters.length > 0 ||
    data.sites.length > 0 ||
    data.assignments.length > 0
  );
}

function ensureControllerDashboardCoreData(
  token: string,
  options?: { force?: boolean }
): Promise<ControllerDashboardCoreData> {
  ensureControllerDashboardCacheToken(token);

  if (controllerDashboardCache.corePromise) {
    return controllerDashboardCache.corePromise;
  }

  if (!options?.force && isFresh(controllerDashboardCache.coreLoadedAt)) {
    return Promise.resolve(getControllerDashboardCoreData());
  }

  const nextPromise = Promise.all([
    fetchAllDashboardPages((limit, offset) => fetchSafetyUsersPage(token, { limit, offset })),
    fetchAllDashboardPages((limit, offset) => fetchSafetyHeadquartersPage(token, { limit, offset })),
    fetchAllDashboardPages((limit, offset) => fetchSafetySitesAdminPage(token, { limit, offset })),
    fetchAllDashboardPages((limit, offset) => fetchSafetyAssignmentsPage(token, { limit, offset })),
  ])
    .then(([users, headquarters, sites, assignments]) => {
      ensureControllerDashboardCacheToken(token);
      controllerDashboardCache.data = {
        ...controllerDashboardCache.data,
        users,
        headquarters,
        sites,
        assignments,
      };
      controllerDashboardCache.coreLoadedAt = Date.now();
      return { users, headquarters, sites, assignments };
    })
    .finally(() => {
      if (controllerDashboardCache.token === token) {
        controllerDashboardCache.corePromise = null;
      }
    });

  controllerDashboardCache.corePromise = nextPromise;
  return nextPromise;
}

function ensureControllerDashboardContentItems(
  token: string,
  options?: { force?: boolean }
): Promise<ControllerDashboardData['contentItems']> {
  ensureControllerDashboardCacheToken(token);

  if (controllerDashboardCache.contentPromise) {
    return controllerDashboardCache.contentPromise;
  }

  if (!options?.force && isFresh(controllerDashboardCache.contentLoadedAt)) {
    return Promise.resolve([...controllerDashboardCache.data.contentItems]);
  }

  const nextPromise = fetchAllDashboardPages((limit, offset) =>
    fetchSafetyContentItemsAdminPage(token, { limit, offset })
  )
    .then((contentItems) => {
      ensureControllerDashboardCacheToken(token);
      controllerDashboardCache.data = {
        ...controllerDashboardCache.data,
        contentItems,
      };
      controllerDashboardCache.contentLoadedAt = Date.now();
      return contentItems;
    })
    .finally(() => {
      if (controllerDashboardCache.token === token) {
        controllerDashboardCache.contentPromise = null;
      }
    });

  controllerDashboardCache.contentPromise = nextPromise;
  return nextPromise;
}

async function fetchAllDashboardPages<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(CONTROLLER_DASHBOARD_PAGE_LIMIT, offset);
    rows.push(...page);

    if (page.length < CONTROLLER_DASHBOARD_PAGE_LIMIT) {
      return rows;
    }

    offset += page.length;
  }
}

function hasValues(input: object): boolean {
  return Object.keys(input).length > 0;
}

function upsertRecordById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index < 0) {
    return [...items, nextItem];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

function buildAssignmentPayload(
  options?: { roleOnSite?: string; memo?: string | null },
  fallback?: { role_on_site?: string | null; memo?: string | null }
) {
  return {
    role_on_site: options?.roleOnSite ?? fallback?.role_on_site ?? '담당 지도요원',
    memo: options?.memo ?? fallback?.memo ?? null,
  };
}

function findAssignment(
  assignments: SafetyAssignment[],
  siteId: string,
  userId: string
) {
  return assignments.find(
    (assignment) => assignment.site_id === siteId && assignment.user_id === userId
  );
}

function findActiveAssignment(
  assignments: SafetyAssignment[],
  siteId: string,
  userId: string
) {
  return assignments.find(
    (assignment) =>
      assignment.site_id === siteId &&
      assignment.user_id === userId &&
      assignment.is_active
  );
}

function getActiveSiteAssignments(assignments: SafetyAssignment[], siteId: string) {
  return assignments.filter(
    (assignment) => assignment.site_id === siteId && assignment.is_active
  );
}

function getUserEditSuccessMessage(hasProfileChanges: boolean, hasPasswordChange: boolean) {
  if (hasProfileChanges && hasPasswordChange) {
    return '사용자 정보와 비밀번호를 수정했습니다.';
  }

  if (hasPasswordChange) {
    return '비밀번호를 변경했습니다.';
  }

  return '사용자 정보를 수정했습니다.';
}

export function primeControllerDashboardData(
  token: string,
  options?: { force?: boolean }
) {
  return ensureControllerDashboardCoreData(token, options);
}

export function primeControllerDashboardContentItems(
  token: string,
  options?: { force?: boolean }
) {
  return ensureControllerDashboardContentItems(token, options);
}

export function useControllerDashboard(enabled: boolean) {
  const [data, setData] = useState<ControllerDashboardData>(() =>
    getCachedControllerDashboardData(readSafetyAuthToken())
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const reloadRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getToken = useCallback(() => {
    const token = readSafetyAuthToken();
    if (!token) throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    return token;
  }, []);

  const applyDataUpdate = useCallback(
    (updater: (current: ControllerDashboardData) => ControllerDashboardData) => {
      if (!isMountedRef.current) return;

      setData((current) => {
        const next = updater(current);
        controllerDashboardCache.data = cloneDashboardData(next);
        return next;
      });
    },
    []
  );

  const reload = useCallback(async (options?: { force?: boolean }) => {
    if (!enabled) return;
    const requestId = reloadRequestIdRef.current + 1;
    reloadRequestIdRef.current = requestId;

    if (isMountedRef.current) {
      setError(null);
    }

    try {
      const token = getToken();
      const cachedData = getCachedControllerDashboardData(token);
      const hasCachedData = hasControllerDashboardCriticalData(cachedData);

      if (isMountedRef.current && requestId === reloadRequestIdRef.current) {
        if (hasCachedData) {
          setData(cachedData);
        }
        setIsLoading(!hasCachedData);
      }

      const { users, headquarters, sites, assignments } =
        await ensureControllerDashboardCoreData(token, options);

      if (!isMountedRef.current || requestId !== reloadRequestIdRef.current) {
        return;
      }

      setData((current) => ({
        ...current,
        users,
        headquarters,
        sites,
        assignments,
      }));

      if (isMountedRef.current && requestId === reloadRequestIdRef.current) {
        setIsLoading(false);
      }
    } catch (error) {
      if (isMountedRef.current && requestId === reloadRequestIdRef.current) {
        setError(getErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current && requestId === reloadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, getToken]);

  const loadContentItems = useCallback(
    async (options?: { force?: boolean }) => {
      if (!enabled) return;

      if (isMountedRef.current) {
        setError(null);
        setIsContentLoading(true);
      }

      try {
        const token = getToken();
        const contentItems = await ensureControllerDashboardContentItems(token, options);

        if (!isMountedRef.current) {
          return;
        }

        setData((current) => ({
          ...current,
          contentItems,
        }));
      } catch (error) {
        if (isMountedRef.current) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (isMountedRef.current) {
          setIsContentLoading(false);
        }
      }
    },
    [enabled, getToken]
  );

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const runMutation = useCallback(
    async <TResult>(
      task: (token: string) => Promise<TResult>,
      options: {
        successMessage: string;
        applyResult?: (
          current: ControllerDashboardData,
          result: TResult
        ) => ControllerDashboardData;
        reloadAfter?: boolean;
      }
    ) => {
      if (isMountedRef.current) {
        setIsMutating(true);
        setError(null);
        setNotice(null);
      }

      try {
        const result = await task(getToken());

        if (options.applyResult) {
          applyDataUpdate((current) => options.applyResult!(current, result));
        }

        const shouldReload =
          options.reloadAfter ?? !options.applyResult;

        if (shouldReload) {
          try {
            await reload({ force: true });
          } catch (reloadError) {
            console.error('Controller dashboard reload failed after mutation', reloadError);
            if (isMountedRef.current) {
              setNotice(
                `${options.successMessage} 목록 새로고침은 실패했습니다. 상단 새로고침 버튼으로 다시 불러와 주세요.`
              );
            }
            return result;
          }
        }

        if (isMountedRef.current) {
          setNotice(options.successMessage);
        }

        return result;
      } catch (error) {
        const message = getErrorMessage(error);
        if (isMountedRef.current) {
          setError(message);
        }
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false);
        }
      }
    },
    [applyDataUpdate, getToken, reload]
  );

  return {
    data,
    error,
    isContentLoaded: controllerDashboardCache.contentLoadedAt > 0,
    isContentLoading,
    isLoading,
    isMutating,
    loadContentItems,
    notice,
    reload: async () => {
      await reload({ force: true });
    },
    createUser: async (input: SafetyUserCreateInput) => {
      await runMutation((token) => createSafetyUser(token, input), {
        successMessage: '사용자를 생성했습니다.',
        applyResult: (current, user) => ({
          ...current,
          users: upsertRecordById(current.users, user),
        }),
      });
    },
    updateUser: async (id: string, input: SafetyUserUpdateInput) => {
      await runMutation((token) => updateSafetyUser(token, id, input), {
        successMessage: '사용자 정보를 수정했습니다.',
        applyResult: (current, user) => ({
          ...current,
          users: upsertRecordById(current.users, user),
        }),
      });
    },
    resetUserPassword: async (id: string, password: string) => {
      await runMutation((token) => updateSafetyUserPassword(token, id, password), {
        successMessage: '비밀번호를 변경했습니다.',
        reloadAfter: false,
      });
    },
    saveUserEdit: async (
      id: string,
      input: SafetyUserUpdateInput,
      password?: string | null
    ) => {
      const hasProfileChanges = hasValues(input);
      const hasPasswordChange = Boolean(password);

      await runMutation(async (token) => {
        let updatedUser = null;
        if (hasProfileChanges) {
          updatedUser = await updateSafetyUser(token, id, input);
        }
        if (hasPasswordChange && password) {
          await updateSafetyUserPassword(token, id, password);
        }
        return updatedUser;
      }, {
        successMessage: getUserEditSuccessMessage(hasProfileChanges, hasPasswordChange),
        applyResult: (current, user) =>
          user
            ? {
                ...current,
                users: upsertRecordById(current.users, user),
              }
            : current,
        reloadAfter: false,
      });
    },
    deactivateUser: async (id: string) => {
      await runMutation((token) => deactivateSafetyUser(token, id), {
        successMessage: '사용자를 비활성화했습니다.',
        applyResult: (current, user) => ({
          ...current,
          users: upsertRecordById(current.users, user),
        }),
      });
    },
    createHeadquarter: async (input: SafetyHeadquarterInput) => {
      await runMutation((token) => createSafetyHeadquarter(token, input), {
        successMessage: '사업장 정보를 생성했습니다.',
        applyResult: (current, item) => ({
          ...current,
          headquarters: upsertRecordById(current.headquarters, item),
        }),
      });
    },
    updateHeadquarter: async (id: string, input: SafetyHeadquarterUpdateInput) => {
      await runMutation((token) => updateSafetyHeadquarter(token, id, input), {
        successMessage: '사업장 정보를 수정했습니다.',
        applyResult: (current, item) => ({
          ...current,
          headquarters: upsertRecordById(current.headquarters, item),
        }),
      });
    },
    deactivateHeadquarter: async (id: string) => {
      await runMutation((token) => deactivateSafetyHeadquarter(token, id), {
        successMessage: '사업장을 비활성화했습니다.',
        applyResult: (current, item) => ({
          ...current,
          headquarters: upsertRecordById(current.headquarters, item),
        }),
      });
    },
    createSite: async (input: SafetySiteInput) => {
      await runMutation((token) => createSafetySite(token, input), {
        successMessage: '현장을 생성했습니다.',
      });
    },
    updateSite: async (id: string, input: SafetySiteUpdateInput) => {
      await runMutation((token) => updateSafetySite(token, id, input), {
        successMessage: '현장 정보를 수정했습니다.',
      });
    },
    deactivateSite: async (id: string) => {
      await runMutation((token) => deactivateSafetySite(token, id), {
        successMessage: '현장을 종료 처리했습니다.',
      });
    },
    createAssignment: async (input: SafetyAssignmentInput) => {
      await runMutation(async (token) => {
        const existingAssignment = findAssignment(
          data.assignments,
          input.site_id,
          input.user_id
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
      }, {
        successMessage: '현장 배정을 생성했습니다.',
      });
    },
    assignFieldAgentToSite: async (
      siteId: string,
      userId: string | null,
      options?: { roleOnSite?: string; memo?: string | null }
    ) => {
      await runMutation(async (token) => {
        if (!userId) return;

        const matchedAssignment = findAssignment(data.assignments, siteId, userId);

        if (matchedAssignment) {
          await updateSafetyAssignment(token, matchedAssignment.id, {
            ...buildAssignmentPayload(options, matchedAssignment),
            is_active: true,
          });
          return;
        }

        const nextPayload = buildAssignmentPayload(options);
        await createSafetyAssignment(token, {
          site_id: siteId,
          user_id: userId,
          ...nextPayload,
        });
      }, {
        successMessage: '지도요원을 배정했습니다.',
      });
    },
    unassignFieldAgentFromSite: async (siteId: string, userId: string) => {
      await runMutation(async (token) => {
        const activeAssignment = findActiveAssignment(data.assignments, siteId, userId);
        if (!activeAssignment) return;
        await deactivateSafetyAssignment(token, activeAssignment.id);
      }, {
        successMessage: '지도요원 배정을 해제했습니다.',
      });
    },
    clearSiteAssignments: async (siteId: string) => {
      await runMutation(async (token) => {
        const activeAssignments = getActiveSiteAssignments(data.assignments, siteId);
        await Promise.all(
          activeAssignments.map((assignment) =>
            deactivateSafetyAssignment(token, assignment.id)
          )
        );
      }, {
        successMessage: '현장 배정을 모두 해제했습니다.',
      });
    },
    updateAssignment: async (id: string, input: SafetyAssignmentUpdateInput) => {
      await runMutation((token) => updateSafetyAssignment(token, id, input), {
        successMessage: '배정 정보를 수정했습니다.',
      });
    },
    deactivateAssignment: async (id: string) => {
      await runMutation((token) => deactivateSafetyAssignment(token, id), {
        successMessage: '배정을 비활성화했습니다.',
      });
    },
    createContentItem: async (input: SafetyContentItemInput) => {
      await runMutation((token) => createSafetyContentItem(token, input), {
        successMessage: '콘텐츠 데이터를 생성했습니다.',
        applyResult: (current, item) => ({
          ...current,
          contentItems: upsertRecordById(current.contentItems, item),
        }),
      });
    },
    updateContentItem: async (id: string, input: SafetyContentItemUpdateInput) => {
      await runMutation((token) => updateSafetyContentItem(token, id, input), {
        successMessage: '콘텐츠 데이터를 수정했습니다.',
        applyResult: (current, item) => ({
          ...current,
          contentItems: upsertRecordById(current.contentItems, item),
        }),
      });
    },
    deactivateContentItem: async (id: string) => {
      await runMutation((token) => deactivateSafetyContentItem(token, id), {
        successMessage: '콘텐츠 데이터를 비활성화했습니다.',
        applyResult: (current, item) => ({
          ...current,
          contentItems: upsertRecordById(current.contentItems, item),
        }),
      });
    },
  };
}
