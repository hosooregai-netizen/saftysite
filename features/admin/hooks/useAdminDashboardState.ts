'use client';

import { useCallback, useMemo, useState } from 'react';
import { refreshAdminMasterData } from '@/features/admin/lib/adminDashboardMutations';
import type { ControllerDashboardData } from '@/types/controller';
import type { SafetyReportListItem } from '@/types/backend';
import { buildAdminDashboardAssignmentActions } from './buildAdminDashboardAssignmentActions';
import { buildAdminDashboardContentActions } from './buildAdminDashboardContentActions';
import { buildAdminDashboardCrudActions } from './buildAdminDashboardCrudActions';
import {
  EMPTY_DATA,
  getErrorMessage,
  type UseAdminDashboardStateOptions,
} from './adminDashboardStateShared';
import { useAdminDashboardDataLoaders } from './useAdminDashboardDataLoaders';
import type { AdminCoreDataScope } from './useAdminDashboardDataLoaders';
import { useAdminDashboardRouting } from './useAdminDashboardRouting';

export function useAdminDashboardState({
  contentCacheScope = null,
  enabled,
  refreshMasterData,
}: UseAdminDashboardStateOptions) {
  const [data, setData] = useState<ControllerDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isContentRefreshing, setIsContentRefreshing] = useState(false);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [loadedCoreDataScope, setLoadedCoreDataScope] = useState<AdminCoreDataScope>('none');
  const [hasLoadedContentData, setHasLoadedContentData] = useState(false);
  const [reportList, setReportList] = useState<SafetyReportListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const routing = useAdminDashboardRouting({
    data,
    enabled,
    hasLoadedCoreData: loadedCoreDataScope !== 'none',
  });
  const { getToken, loadReports, reload, reloadContent } = useAdminDashboardDataLoaders({
    contentCacheScope,
    data,
    enabled,
    hasLoadedContentData,
    loadedCoreDataScope,
    reportList,
    setData,
    setError,
    setHasLoadedContentData,
    setLoadedCoreDataScope,
    setIsContentLoading,
    setIsContentRefreshing,
    setIsLoading,
    setIsReportsLoading,
    setReportList,
    coreDataScope: routing.coreDataScope,
    shouldLoadCoreData: routing.shouldLoadCoreData,
    shouldLoadContent: routing.shouldLoadContent,
    shouldLoadReports: routing.shouldLoadReports,
  });

  const runMutation = useCallback(
    async <TResult,>(
      task: (token: string) => Promise<TResult>,
      successMessage: string,
      options?: {
        applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
        invalidateClientCaches?: (scope: string | null) => void;
      },
    ) => {
      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        const result = await task(getToken());
        if (options?.applyResult) {
          setData((current) => options.applyResult?.(current, result) ?? current);
        }
        options?.invalidateClientCaches?.(contentCacheScope);

        try {
          // Snapshot warm-up is handled on the server write paths that still need it
          // (export/legacy helpers). Dashboard follow-up refresh should stay focused on
          // the canonical UI read paths rather than broad snapshot refreshes.
          const followUpTasks: Array<Promise<unknown>> = [];
          if (routing.shouldLoadContent) {
            followUpTasks.push(reloadContent({ force: true }));
          }
          if (routing.shouldLoadReports) {
            followUpTasks.push(loadReports({ force: true }));
          }
          if (followUpTasks.length > 0) {
            await Promise.all(followUpTasks);
          }
          setNotice(successMessage);
        } catch (reloadError) {
          console.error('Admin dashboard follow-up refresh failed after mutation', reloadError);
          setNotice(`${successMessage} 화면 갱신은 실패했습니다. 다시 시도해 주세요.`);
        }
      } catch (nextError) {
        const message = getErrorMessage(nextError);
        setError(message);
        throw nextError;
      } finally {
        setIsMutating(false);
      }
    },
    [
      contentCacheScope,
      getToken,
      loadReports,
      reloadContent,
      routing.shouldLoadContent,
      routing.shouldLoadReports,
    ],
  );

  const runContentMutation = useCallback(
    async <TResult,>(
      task: (token: string) => Promise<TResult>,
      successMessage: string,
      options?: {
        applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
      },
    ) => {
      await runMutation(task, successMessage, options);
      await refreshAdminMasterData(refreshMasterData);
    },
    [refreshMasterData, runMutation],
  );

  const crudActions = useMemo(
    () => buildAdminDashboardCrudActions({ runMutation }),
    [runMutation],
  );
  const assignmentActions = useMemo(
    () => buildAdminDashboardAssignmentActions({ runMutation }),
    [runMutation],
  );
  const contentActions = useMemo(
    () => buildAdminDashboardContentActions({ runContentMutation, runMutation }),
    [runContentMutation, runMutation],
  );

  return {
    activeSection: routing.activeSection,
    activeSectionMeta: routing.activeSectionMeta,
    clearHeadquarterSelection: routing.clearHeadquarterSelection,
    clearSiteSelection: routing.clearSiteSelection,
    data,
    error,
    isContentLoading,
    isContentRefreshing,
    isLoading,
    isMutating,
    isReportsLoading,
    notice,
    reload,
    reloadContent,
    reportList,
    selectHeadquarter: routing.selectHeadquarter,
    selectedHeadquarter: routing.selectedHeadquarter,
    selectedHeadquarterId: routing.selectedHeadquarterId,
    selectSection: routing.selectSection,
    selectSite: routing.selectSite,
    selectedSite: routing.selectedSite,
    selectedSiteId: routing.selectedSiteId,
    ...crudActions,
    ...assignmentActions,
    ...contentActions,
  };
}
