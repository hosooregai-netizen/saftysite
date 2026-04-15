'use client';

import { useCallback } from 'react';
import {
  updateAdminReportDispatch,
  updateAdminReportReview,
} from '@/lib/admin/apiClient';
import { fetchSmsProviderStatuses, sendSms } from '@/lib/messages/apiClient';
import { buildToggledReportDispatch } from '@/lib/reportDispatch';
import { buildDispatchMeta } from './reportsSectionFilters';
import type {
  ControllerQualityStatus,
  ControllerReportRow,
  ReportDispatchMeta,
} from '@/types/admin';
import type { SafetyReport, SafetySite, SafetyUser } from '@/types/backend';
import type { ReportReviewForm } from './reportsSectionTypes';
import type { SmsProviderStatus } from '@/types/messages';

interface UseReportDispatchActionsInput {
  applyUpdatedReportRow: (report: SafetyReport) => void;
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
}

export function useReportDispatchActions({
  applyUpdatedReportRow,
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
      setNotice('보고서 검토 체크를 저장했습니다.');
      setReviewRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '보고서 검토 저장에 실패했습니다.');
    }
  }, [currentUser.id, fetchRows, reviewForm, reviewRow, setError, setNotice, setReviewRow]);

  const saveDispatch = useCallback(
    async (row: ControllerReportRow, nextDispatch: ReportDispatchMeta) => {
      try {
        const updated = await updateAdminReportDispatch(row.reportKey, nextDispatch);
        applyUpdatedReportRow(updated);
        setNotice(
          row.reportType === 'quarterly_report'
            ? '분기 보고서 발송 정보를 저장했습니다.'
            : '발송 정보를 저장했습니다.',
        );
        setDispatchRow(null);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '발송 정보 저장에 실패했습니다.');
      }
    },
    [applyUpdatedReportRow, setDispatchRow, setError, setNotice],
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
              ownerUserId:
                row.controllerReview?.ownerUserId || row.assigneeUserId || currentUser.id,
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
      setNotice('선택한 보고서의 담당자를 현재 사용자로 지정했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '담당자 지정에 실패했습니다.');
    }
  }, [currentUser.id, fetchRows, selectedRows, setError, setNotice]);

  const buildManualDispatchPayload = useCallback(
    (row: ControllerReportRow) =>
      buildToggledReportDispatch(buildDispatchMeta(row), {
        currentUserId: currentUser.id,
        historyMemo: '관리자 화면에서 수동 발송 완료 처리',
        nextCompleted: true,
      }),
    [currentUser.id],
  );

  const toggleDispatchStatus = useCallback(
    async (row: ControllerReportRow, nextCompleted: boolean) => {
      try {
        const updated = await updateAdminReportDispatch(
          row.reportKey,
          buildToggledReportDispatch(buildDispatchMeta(row), {
            currentUserId: currentUser.id,
            historyMemo: nextCompleted
              ? '관리자 목록에서 발송으로 변경'
              : '관리자 목록에서 미발송으로 변경',
            nextCompleted,
          }),
        );
        applyUpdatedReportRow(updated);
        setNotice(
          nextCompleted
            ? '보고서 발송 여부를 발송으로 변경했습니다.'
            : '보고서 발송 여부를 미발송으로 변경했습니다.',
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '발송 여부 변경에 실패했습니다.');
      }
    },
    [applyUpdatedReportRow, currentUser.id, setError, setNotice],
  );

  const bulkDispatchSent = useCallback(async () => {
    const quarterlyRows = selectedRows.filter((row) => row.reportType === 'quarterly_report');
    if (quarterlyRows.length === 0) return;

    try {
      await Promise.all(
        quarterlyRows.map((row) =>
          updateAdminReportDispatch(row.reportKey, buildManualDispatchPayload(row)),
        ),
      );
      setNotice('선택한 분기 보고서를 수동 발송 완료로 처리했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일괄 발송 처리에 실패했습니다.');
    }
  }, [buildManualDispatchPayload, fetchRows, selectedRows, setError, setNotice]);

  const loadSmsProviderStatuses = useCallback(async (): Promise<SmsProviderStatus[]> => {
    try {
      return await fetchSmsProviderStatuses();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '문자 발송 공급사 상태를 불러오지 못했습니다.',
      );
      return [];
    }
  }, [setError]);

  return {
    buildManualDispatchPayload,
    bulkDispatchSent,
    bulkOwnerAssign,
    bulkQuality,
    loadSmsProviderStatuses,
    saveDispatch,
    saveReview,
    sendDispatchSms,
    toggleDispatchStatus,
  };
}
