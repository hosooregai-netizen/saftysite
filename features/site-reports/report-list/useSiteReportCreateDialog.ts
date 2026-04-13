'use client';

import { useMemo, useState } from 'react';
import {
  EMPTY_CREATE_REPORT_FORM,
  type CreateReportFormState,
  type CreateSiteReportInput,
} from './types';

interface UseSiteReportCreateDialogParams {
  canCreateReport: boolean;
  createReport: (input: CreateSiteReportInput) => Promise<void>;
  getCreateReportTitleSuggestion: (reportDate: string) => string;
}

export function useSiteReportCreateDialog({
  canCreateReport,
  createReport,
  getCreateReportTitleSuggestion,
}: UseSiteReportCreateDialogParams) {
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateReportFormState>(EMPTY_CREATE_REPORT_FORM);
  const [hasEditedCreateTitle, setHasEditedCreateTitle] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_REPORT_FORM);
    setCreateError(null);
    setHasEditedCreateTitle(false);
  };

  return {
    closeCreateDialog: () => {
      setIsCreateDialogOpen(false);
      resetCreateDialog();
    },
    createError,
    createForm,
    handleCreateDateChange: (value: string) => {
      setCreateError(null);
      setCreateForm((current) => {
        const next = { ...current, reportDate: value };
        if (hasEditedCreateTitle) return next;
        return {
          ...next,
          reportTitle: value ? getCreateReportTitleSuggestion(value) : '',
        };
      });
    },
    handleCreateSubmit: async () => {
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
        setIsCreateDialogOpen(false);
        resetCreateDialog();
      } catch (error) {
        setCreateError(error instanceof Error ? error.message : '보고서 생성 중 오류가 발생했습니다.');
      } finally {
        setIsCreatingReport(false);
      }
    },
    handleCreateTitleChange: (value: string) => {
      setCreateError(null);
      setCreateForm((current) => ({ ...current, reportTitle: value }));
      setHasEditedCreateTitle(value.trim().length > 0);
    },
    isCreateDialogOpen,
    isCreatingReport,
    openCreateDialog: () => {
      if (!canCreateReport) return;
      setCreateForm({
        reportDate: today,
        reportTitle: getCreateReportTitleSuggestion(today),
      });
      setCreateError(null);
      setHasEditedCreateTitle(false);
      setIsCreateDialogOpen(true);
    },
  };
}
