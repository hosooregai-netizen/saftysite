'use client';

import { useCallback } from 'react';
import { updateAdminReportDispatch, updateAdminReportReview } from '@/lib/admin/apiClient';
import { fetchSmsProviderStatuses, sendSms } from '@/lib/messages/apiClient';
import { buildDispatchMeta } from './reportsSectionFilters';
import type { ControllerQualityStatus, ControllerReportRow, ReportDispatchMeta } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { ReportReviewForm } from './reportsSectionTypes';
import type { SmsProviderStatus } from '@/types/messages';

interface UseReportDispatchActionsInput {
  currentUser: SafetyUser;
  dispatchRow: ControllerReportRow | null;
  dispatchSmsMessage: string;
  dispatchSmsPhone: string;
  fetchRows: () => Promise<void>;
  reviewForm: ReportReviewForm;
  reviewRow: ControllerReportRow | null;
  selectedRows: ControllerReportRow[];
  setDispatchRow: (value: ControllerReportRow | null) => void;
  setDispatchSmsSending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  setReviewRow: (value: ControllerReportRow | null) => void;
  sites: SafetySite[];
}

function buildManualCheckedDispatch(
  currentDispatch: ReportDispatchMeta,
  currentUserId: string,
  memo: string,
): ReportDispatchMeta {
  const now = new Date().toISOString();

  return {
    ...currentDispatch,
    dispatchMethod: currentDispatch.dispatchMethod || 'manual',
    dispatchStatus: currentDispatch.dispatchStatus === 'sent' ? 'sent' : 'manual_checked',
    dispatchCheckedBy: currentUserId,
    dispatchCheckedAt: now,
    sentHistory: [
      ...currentDispatch.sentHistory,
      {
        id: now,
        memo,
        sentAt: now,
        sentByUserId: currentUserId,
      },
    ],
  };
}

function buildPendingDispatch(currentDispatch: ReportDispatchMeta): ReportDispatchMeta {
  return {
    ...currentDispatch,
    dispatchStatus: 'none',
    dispatchMethod: '',
    dispatchedAt: '',
    dispatchCheckedBy: '',
    dispatchCheckedAt: '',
  };
}

function isDispatchManageableReport(row: ControllerReportRow) {
  return row.reportType === 'technical_guidance' || row.reportType === 'quarterly_report';
}

export function useReportDispatchActions({
  currentUser,
  dispatchRow,
  dispatchSmsMessage,
  dispatchSmsPhone,
  fetchRows,
  reviewForm,
  reviewRow,
  selectedRows,
  setDispatchRow,
  setDispatchSmsSending,
  setError,
  setNotice,
  setReviewRow,
  sites,
}: UseReportDispatchActionsInput) {
  const saveReview = useCallback(async () => {
    if (!reviewRow) return;

    try {
      await updateAdminReportReview(reviewRow.reportKey, {
        checkedAt: new Date().toISOString(),
        checkerUserId: currentUser.id,
        note: reviewForm.note.trim(),
        ownerUserId: reviewForm.ownerUserId,
        qualityStatus: reviewForm.qualityStatus,
      });
      setNotice('보고서 검토 상태를 저장했습니다.');
      setReviewRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '보고서 검토 저장에 실패했습니다.');
    }
  }, [currentUser.id, fetchRows, reviewForm, reviewRow, setError, setNotice, setReviewRow]);

  const saveDispatch = useCallback(
    async (row: ControllerReportRow, nextDispatch: ReportDispatchMeta, successMessage?: string) => {
      try {
        await updateAdminReportDispatch(row.reportKey, nextDispatch);
        setNotice(successMessage || '발송 상태를 저장했습니다.');
        setDispatchRow(null);
        await fetchRows();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '발송 상태 저장에 실패했습니다.');
      }
    },
    [fetchRows, setDispatchRow, setError, setNotice],
  );

  const sendDispatchSms = useCallback(async () => {
    if (!dispatchRow) return;

    try {
      setDispatchSmsSending(true);
      setError(null);
      const result = await sendSms({
        content: dispatchSmsMessage,
        headquarterId: dispatchRow.headquarterId,
        phoneNumber: dispatchSmsPhone,
        reportKey: dispatchRow.reportKey,
        siteId: dispatchRow.siteId,
        subject: dispatchRow.reportTitle || dispatchRow.periodLabel || dispatchRow.reportKey,
      });
      setNotice(result.message || '문자를 발송했습니다.');
      setDispatchRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '문자 발송에 실패했습니다.');
    } finally {
      setDispatchSmsSending(false);
    }
  }, [
    dispatchRow,
    dispatchSmsMessage,
    dispatchSmsPhone,
    fetchRows,
    setDispatchRow,
    setDispatchSmsSending,
    setError,
    setNotice,
  ]);

  const bulkQuality = useCallback(
    async (qualityStatus: ControllerQualityStatus) => {
      if (selectedRows.length === 0) return;

      try {
        await Promise.all(
          selectedRows.map((row) =>
            updateAdminReportReview(row.reportKey, {
              checkedAt: new Date().toISOString(),
              checkerUserId: currentUser.id,
              note: row.controllerReview?.note || '',
              ownerUserId: row.controllerReview?.ownerUserId || row.assigneeUserId || currentUser.id,
              qualityStatus,
            }),
          ),
        );
        setNotice('선택한 보고서의 검토 상태를 저장했습니다.');
        await fetchRows();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '일괄 검토 처리에 실패했습니다.');
      }
    },
    [currentUser.id, fetchRows, selectedRows, setError, setNotice],
  );

  const bulkOwnerAssign = useCallback(async () => {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(
        selectedRows.map((row) =>
          updateAdminReportReview(row.reportKey, {
            checkedAt: row.controllerReview?.checkedAt || '',
            checkerUserId: row.controllerReview?.checkerUserId || currentUser.id,
            note: row.controllerReview?.note || '',
            ownerUserId: currentUser.id,
            qualityStatus: row.controllerReview?.qualityStatus || 'unchecked',
          }),
        ),
      );
      setNotice('선택한 보고서의 체크 담당자를 현재 사용자로 지정했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '담당자 지정에 실패했습니다.');
    }
  }, [currentUser.id, fetchRows, selectedRows, setError, setNotice]);

  const buildManualDispatchPayload = useCallback(
    (row: ControllerReportRow) =>
      buildManualCheckedDispatch(buildDispatchMeta(row), currentUser.id, '관리자 화면에서 발송 완료 처리'),
    [currentUser.id],
  );

  const buildPendingDispatchPayload = useCallback(
    (row: ControllerReportRow) => buildPendingDispatch(buildDispatchMeta(row)),
    [],
  );

  const bulkDispatchSent = useCallback(async () => {
    const dispatchRows = selectedRows.filter(isDispatchManageableReport);
    if (dispatchRows.length === 0) return;

    try {
      await Promise.all(
        dispatchRows.map((row) => updateAdminReportDispatch(row.reportKey, buildManualDispatchPayload(row))),
      );
      setNotice('선택한 보고서를 발송 완료로 처리했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일괄 발송 처리에 실패했습니다.');
    }
  }, [buildManualDispatchPayload, fetchRows, selectedRows, setError, setNotice]);

  const loadSmsProviderStatuses = useCallback(async (): Promise<SmsProviderStatus[]> => {
    try {
      return await fetchSmsProviderStatuses();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '문자 발송 공급사 상태를 불러오지 못했습니다.');
      return [];
    }
  }, [setError]);

  const dispatchSite =
    dispatchRow == null ? null : sites.find((site) => site.id === dispatchRow.siteId) || null;

  return {
    buildManualDispatchPayload,
    buildPendingDispatchPayload,
    bulkDispatchSent,
    bulkOwnerAssign,
    bulkQuality,
    dispatchSite,
    loadSmsProviderStatuses,
    saveDispatch,
    saveReview,
    sendDispatchSms,
  };
}
