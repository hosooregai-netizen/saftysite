'use client';

import { useCallback } from 'react';
import { invalidateAdminReportMutationClientCaches } from '@/features/admin/lib/adminClientCacheInvalidation';
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
import type { SafetyReport, SafetyUser } from '@/types/backend';
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
  const invalidateOverviewRelatedCaches = useCallback(() => {
    invalidateAdminReportMutationClientCaches(currentUser.id);
  }, [currentUser.id]);

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
      invalidateOverviewRelatedCaches();
      setNotice('蹂닿퀬??寃??泥댄겕瑜???ν뻽?듬땲??');
      setReviewRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '蹂닿퀬??寃????μ뿉 ?ㅽ뙣?덉뒿?덈떎.');
    }
  }, [currentUser.id, fetchRows, invalidateOverviewRelatedCaches, reviewForm, reviewRow, setError, setNotice, setReviewRow]);

  const saveDispatch = useCallback(
    async (row: ControllerReportRow, nextDispatch: ReportDispatchMeta) => {
      try {
        const updated = await updateAdminReportDispatch(row.reportKey, nextDispatch);
        invalidateOverviewRelatedCaches();
        applyUpdatedReportRow(updated);
        setNotice(
          row.reportType === 'quarterly_report'
            ? '遺꾧린 蹂닿퀬??諛쒖넚 ?뺣낫瑜???ν뻽?듬땲??'
            : '諛쒖넚 ?뺣낫瑜???ν뻽?듬땲??',
        );
        setDispatchRow(null);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '諛쒖넚 ?뺣낫 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.');
      }
    },
    [applyUpdatedReportRow, invalidateOverviewRelatedCaches, setDispatchRow, setError, setNotice],
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
      setNotice(result.message || '臾몄옄瑜?諛쒖넚?덉뒿?덈떎.');
      setDispatchRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '臾몄옄 諛쒖넚???ㅽ뙣?덉뒿?덈떎.');
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
        invalidateOverviewRelatedCaches();
        setNotice('?좏깮??蹂닿퀬?쒖쓽 寃???곹깭瑜???ν뻽?듬땲??');
        await fetchRows();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '?쇨큵 寃??泥섎━???ㅽ뙣?덉뒿?덈떎.');
      }
    },
    [currentUser.id, fetchRows, invalidateOverviewRelatedCaches, selectedRows, setError, setNotice],
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
      invalidateOverviewRelatedCaches();
      setNotice('?좏깮??蹂닿퀬?쒖쓽 ?대떦?먮? ?꾩옱 ?ъ슜?먮줈 吏?뺥뻽?듬땲??');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '?대떦??吏?뺤뿉 ?ㅽ뙣?덉뒿?덈떎.');
    }
  }, [currentUser.id, fetchRows, invalidateOverviewRelatedCaches, selectedRows, setError, setNotice]);

  const buildManualDispatchPayload = useCallback(
    (row: ControllerReportRow) =>
      buildToggledReportDispatch(buildDispatchMeta(row), {
        currentUserId: currentUser.id,
        historyMemo: 'admin-manual-dispatch-complete',
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
              ? 'admin-marked-dispatch-sent'
              : 'admin-marked-dispatch-pending',
            nextCompleted,
          }),
        );
        invalidateOverviewRelatedCaches();
        applyUpdatedReportRow(updated);
        setNotice(
          nextCompleted
            ? '蹂닿퀬??諛쒖넚 ?щ?瑜?諛쒖넚?쇰줈 蹂寃쏀뻽?듬땲??'
            : '蹂닿퀬??諛쒖넚 ?щ?瑜?誘몃컻?≪쑝濡?蹂寃쏀뻽?듬땲??',
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '諛쒖넚 ?щ? 蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.');
      }
    },
    [applyUpdatedReportRow, currentUser.id, invalidateOverviewRelatedCaches, setError, setNotice],
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
      invalidateOverviewRelatedCaches();
      setNotice('?좏깮??遺꾧린 蹂닿퀬?쒕? ?섎룞 諛쒖넚 ?꾨즺濡?泥섎━?덉뒿?덈떎.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '?쇨큵 諛쒖넚 泥섎━???ㅽ뙣?덉뒿?덈떎.');
    }
  }, [buildManualDispatchPayload, fetchRows, invalidateOverviewRelatedCaches, selectedRows, setError, setNotice]);

  const loadSmsProviderStatuses = useCallback(async (): Promise<SmsProviderStatus[]> => {
    try {
      return await fetchSmsProviderStatuses();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : '臾몄옄 諛쒖넚 怨듦툒???곹깭瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??',
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
