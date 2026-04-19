import { useMemo, useState } from 'react';
import {
  applyQuarterlySummarySeed,
  buildLocalQuarterlySummarySeed,
  createQuarterlySummaryDraft,
} from '@/lib/erpReports/quarterly';
import { createQuarterKey, getQuarterRange } from '@/lib/erpReports/shared';
import { fetchQuarterlySummarySeed, readSafetyAuthToken } from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession/session';
import {
  getCreateQuarterSelectionTarget,
  getCreateTitleSuggestion,
  shouldUseLocalQuarterlySeedFallback,
} from './quarterlyListHelpers';
import { EMPTY_CREATE_FORM, type CreateQuarterlyReportForm } from './types';

interface UseQuarterlyCreateDialogOptions {
  currentSite: InspectionSite | null;
  currentUserName?: string | null;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void> | void;
  existingReportTitles: string[];
  getSessionsBySiteId: (siteId: string) => InspectionSession[];
  isSaving: boolean;
  onCreated: (report: QuarterlySummaryReport) => void;
  saveQuarterlyReport: (report: QuarterlySummaryReport) => Promise<void>;
}

export function useQuarterlyCreateDialog({
  currentSite,
  currentUserName,
  ensureSiteReportsLoaded,
  existingReportTitles,
  getSessionsBySiteId,
  isSaving,
  onCreated,
  saveQuarterlyReport,
}: UseQuarterlyCreateDialogOptions) {
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
    !currentSite ||
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

  const handleCreatePeriodChange = (
    field: 'periodStartDate' | 'periodEndDate',
    value: string,
  ) => {
    setCreateDialogError(null);
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateQuarterChange = (value: string) => {
    const nextQuarter = Number.parseInt(value, 10);
    if (nextQuarter < 1 || nextQuarter > 4) return;

    setCreateDialogError(null);
    const currentTarget = getCreateQuarterSelectionTarget(createForm);
    const nextRange = getQuarterRange(currentTarget.year, nextQuarter);

    setCreateForm((current) => ({
      ...current,
      periodStartDate: nextRange.startDate,
      periodEndDate: nextRange.endDate,
      title: hasEditedCreateTitle
        ? current.title
        : getCreateTitleSuggestion(
            nextRange.startDate,
            nextRange.endDate,
            existingReportTitles,
          ),
    }));
  };

  const handleCreateTitleChange = (value: string) => {
    setCreateDialogError(null);
    setCreateForm((current) => ({
      ...current,
      title: value,
    }));
    setHasEditedCreateTitle(value.trim().length > 0);
  };

  const handleCreateReport = async () => {
    if (!currentSite || isBusy) return;

    const title = createForm.title.trim();
    const { periodEndDate, periodStartDate } = createForm;
    if (!title || !periodStartDate || !periodEndDate) {
      setCreateDialogError('제목과 기간을 입력해 주세요.');
      return;
    }
    if (periodStartDate > periodEndDate) {
      setCreateDialogError('기간을 다시 확인해 주세요.');
      return;
    }

    setIsCreatingReport(true);
    setCreateDialogError(null);

    try {
      const token = readSafetyAuthToken();
      if (!token) {
        throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      }

      const quarterTarget = getCreateQuarterSelectionTarget(createForm);
      const nextDraftBase = {
        ...createQuarterlySummaryDraft(
          currentSite,
          currentUserName || currentSite.assigneeName,
          periodStartDate,
        ),
        title,
        periodStartDate,
        periodEndDate,
        year: quarterTarget.year,
        quarter: quarterTarget.quarter,
        quarterKey: createQuarterKey(quarterTarget.year, quarterTarget.quarter),
      };

      let seed;
      try {
        seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
          periodStartDate,
          periodEndDate,
        });
      } catch (seedError) {
        if (!shouldUseLocalQuarterlySeedFallback(seedError)) {
          throw seedError;
        }

        await ensureSiteReportsLoaded(currentSite.id);
        seed = buildLocalQuarterlySummarySeed(
          nextDraftBase,
          currentSite,
          getSessionsBySiteId(currentSite.id),
        );
      }

      const nextDraft = applyQuarterlySummarySeed(nextDraftBase, seed);
      await saveQuarterlyReport(nextDraft);
      setIsCreateDialogOpen(false);
      resetCreateDialog();
      onCreated(nextDraft);
    } catch {
      setCreateDialogError(
        '보고서를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.',
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
    isCreatingReport,
    closeCreateDialog,
    handleCreatePeriodChange,
    handleCreateQuarterChange,
    handleCreateReport,
    handleCreateTitleChange,
    openCreateDialog,
  };
}
