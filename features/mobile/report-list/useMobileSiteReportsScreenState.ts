'use client';

import { useMemo, useState } from 'react';
import { useSiteReportListState, type SiteReportSortMode } from '@/features/site-reports/hooks/useSiteReportListState';
import { buildMobileSessionHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { buildMobileReportCardModel } from './mobileReportListHelpers';
import { EMPTY_CREATE_FORM, type CreateMobileReportForm } from './types';

export function useMobileSiteReportsScreenState(siteKey: string) {
  const { authError, isAuthenticated, isReady, login, logout } = useInspectionSessions();
  const {
    assignedUserDisplay,
    canArchiveReports,
    canCreateReport,
    createReport,
    currentSite,
    currentUser,
    deleteSession,
    filteredReportItems,
    getCreateReportTitleSuggestion,
    reloadReportIndex,
    reportIndexError,
    reportIndexStatus,
    reportItems,
    reportQuery,
    reportSortMode,
    setReportQuery,
    setReportSortMode,
  } = useSiteReportListState(siteKey, {
    buildReportHref: buildMobileSessionHref,
  });
  const [dialogSessionId, setDialogSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMobileReportForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const deletingSession = dialogSessionId
    ? reportItems.find((item) => item.reportKey === dialogSessionId) ?? null
    : null;
  const reportCards = useMemo(
    () =>
      filteredReportItems.map((item) =>
        buildMobileReportCardModel(item, assignedUserDisplay, currentSite?.assigneeName ?? ''),
      ),
    [assignedUserDisplay, currentSite?.assigneeName, filteredReportItems],
  );
  const isLoading = reportIndexStatus === 'loading';

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setHasEditedCreateTitle(false);
  };

  const openCreateDialog = () => {
    if (!canCreateReport) {
      return;
    }

    setCreateForm({
      reportDate: today,
      reportTitle: getCreateReportTitleSuggestion(today),
    });
    setCreateError(null);
    setHasEditedCreateTitle(false);
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetCreateDialog();
  };

  const handleCreateDateChange = (value: string) => {
    setCreateError(null);
    setCreateForm((current) => {
      const next = { ...current, reportDate: value };
      if (hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        reportTitle: value ? getCreateReportTitleSuggestion(value) : '',
      };
    });
  };

  const handleCreateTitleChange = (value: string) => {
    setCreateError(null);
    setCreateForm((current) => ({
      ...current,
      reportTitle: value,
    }));
    setHasEditedCreateTitle(value.trim().length > 0);
  };

  const handleCreateSubmit = async () => {
    const reportDate = createForm.reportDate.trim();
    const reportTitle = createForm.reportTitle.trim();

    if (!reportDate) {
      setCreateError('지도일을 입력해 주세요.');
      return;
    }
    if (!reportTitle) {
      setCreateError('제목을 입력해 주세요.');
      return;
    }

    try {
      setIsCreatingReport(true);
      await createReport({ reportDate, reportTitle });
      closeCreateDialog();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : '보고서 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCreatingReport(false);
    }
  };

  const closeDeleteDialog = () => {
    setDialogSessionId(null);
    setDeleteError(null);
  };

  const handleDeleteSubmit = async () => {
    if (!dialogSessionId) {
      return;
    }

    try {
      setIsDeletingReport(true);
      setDeleteError(null);
      await deleteSession(dialogSessionId);
      closeDeleteDialog();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : '보고서 삭제 중 오류가 발생했습니다.',
      );
    } finally {
      setIsDeletingReport(false);
    }
  };

  return {
    authError,
    canArchiveReports,
    canCreateReport,
    createError,
    createForm,
    currentSite,
    currentUserName: currentUser?.name ?? null,
    deleteError,
    deletingSession,
    isAuthenticated,
    isCreateDialogOpen,
    isCreatingReport,
    isDeletingReport,
    isLoading,
    isReady,
    login,
    logout,
    reportCards,
    reportCount: reportItems.length,
    reportIndexError,
    reportQuery,
    reportSortMode,
    closeCreateDialog,
    closeDeleteDialog,
    handleCreateDateChange,
    handleCreateSubmit,
    handleCreateTitleChange,
    handleDeleteSubmit,
    openCreateDialog,
    reloadReportIndex,
    setDialogSessionId,
    setReportQuery,
    setReportSortMode: (mode: SiteReportSortMode) => setReportSortMode(mode),
  };
}
