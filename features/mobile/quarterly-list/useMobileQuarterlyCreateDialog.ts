'use client';

import { useMemo, useState } from 'react';
import { getQuarterRange } from '@/lib/erpReports/shared';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import { createMobileQuarterlyReport } from './createMobileQuarterlyReport';
import {
  getCreateQuarterSelectionTarget,
  getCreateTitleSuggestion,
} from './mobileQuarterlyListHelpers';
import { EMPTY_CREATE_FORM, type CreateQuarterlyReportForm } from './types';

interface UseMobileQuarterlyCreateDialogOptions {
  currentSite: InspectionSite | null;
  currentUserName?: string | null;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void> | void;
  existingReportTitles: string[];
  getSessionsBySiteId: (siteId: string) => InspectionSession[];
  isSaving: boolean;
  onCreated: (report: QuarterlySummaryReport) => void;
  saveQuarterlyReport: (report: QuarterlySummaryReport) => Promise<void>;
}

export function useMobileQuarterlyCreateDialog({
  currentSite,
  currentUserName,
  ensureSiteReportsLoaded,
  existingReportTitles,
  getSessionsBySiteId,
  isSaving,
  onCreated,
  saveQuarterlyReport,
}: UseMobileQuarterlyCreateDialogOptions) {
  const [createForm, setCreateForm] = useState<CreateQuarterlyReportForm>(EMPTY_CREATE_FORM);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);

  const isBusy = isSaving || isCreatingReport;
  const isCreateRangeInvalid =
    Boolean(createForm.periodStartDate) &&
    Boolean(createForm.periodEndDate) &&
    createForm.periodStartDate > createForm.periodEndDate;
  const isCreateDisabled =
    isBusy ||
    !createForm.title.trim() ||
    !createForm.periodStartDate ||
    !createForm.periodEndDate ||
    isCreateRangeInvalid;
  const createQuarterSelection = useMemo(
    () => String(getCreateQuarterSelectionTarget(createForm).quarter),
    [createForm],
  );

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setHasEditedCreateTitle(false);
    setCreateDialogError(null);
  };

  const openCreateDialog = () => {
    if (!currentSite || isBusy) return;
    resetCreateDialog();
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    if (isCreatingReport) return;
    setIsCreateDialogOpen(false);
    resetCreateDialog();
  };

  const handleCreateFieldChange = (
    key: keyof CreateQuarterlyReportForm,
    value: string,
  ) => {
    setCreateDialogError(null);
    setCreateForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === 'title' || hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        title: getCreateTitleSuggestion(
          next.periodStartDate,
          next.periodEndDate,
          existingReportTitles,
        ),
      };
    });
  };

  const handleCreateTitleChange = (value: string) => {
    setHasEditedCreateTitle(value.trim().length > 0);
    handleCreateFieldChange('title', value);
  };

  const handleCreateQuarterChange = (value: string) => {
    const quarter = Number.parseInt(value, 10);
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return;
    }

    const { year } = getCreateQuarterSelectionTarget(createForm);
    const range = getQuarterRange(year, quarter);
    setCreateDialogError(null);

    setCreateForm((current) => {
      const next = {
        ...current,
        periodStartDate: range.startDate,
        periodEndDate: range.endDate,
      };

      if (hasEditedCreateTitle) {
        return next;
      }

      return {
        ...next,
        title: getCreateTitleSuggestion(range.startDate, range.endDate, existingReportTitles),
      };
    });
  };

  const handleCreateReport = async () => {
    if (!currentSite) {
      return;
    }

    setCreateDialogError(null);
    setIsCreatingReport(true);

    try {
      const nextDraft = await createMobileQuarterlyReport({
        createForm,
        currentSite,
        currentUserName,
        ensureSiteReportsLoaded,
        getSessionsBySiteId,
        saveQuarterlyReport,
      });
      closeCreateDialog();
      onCreated(nextDraft);
    } catch (error) {
      setCreateDialogError(
        error instanceof Error
          ? error.message
          : '분기 보고서를 생성하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCreatingReport(false);
    }
  };

  return {
    createDialogError,
    createForm,
    createQuarterSelection,
    isBusy,
    isCreateDialogOpen,
    isCreateDisabled,
    isCreateRangeInvalid,
    isCreatingReport,
    closeCreateDialog,
    handleCreateFieldChange,
    handleCreateQuarterChange,
    handleCreateReport,
    handleCreateTitleChange,
    openCreateDialog,
  };
}
