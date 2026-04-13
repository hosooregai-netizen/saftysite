import { useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import {
  fetchQuarterlyHwpxDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';

export function useQuarterlyDocumentActions(args: {
  draftRef: MutableRefObject<QuarterlySummaryReport>;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
  setDraft: Dispatch<SetStateAction<QuarterlySummaryReport>>;
  setDocumentError: Dispatch<SetStateAction<string | null>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
}) {
  const { draftRef, onSave, setDraft, setDocumentError, setNotice } = args;
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const persistDraftForDocumentExport = async () => {
    const authToken = readSafetyAuthToken();
    if (authToken == null || authToken.trim().length === 0) {
      throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    }

    const nextDraft = { ...draftRef.current, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);

    return {
      authToken,
      reportKey: nextDraft.id,
    };
  };

  return {
    isGeneratingDocument: isGeneratingHwpx || isGeneratingPdf,
    isGeneratingHwpx,
    isGeneratingPdf,
    handleDownloadPdf: async () => {
      try {
        setDocumentError(null);
        setNotice(null);
        setIsGeneratingPdf(true);
        const { authToken, reportKey } = await persistDraftForDocumentExport();
        const { blob, fallbackToHwpx, filename } =
          await fetchQuarterlyPdfDocumentByReportKeyWithFallback(reportKey, authToken);
        saveBlobAsFile(blob, filename);
        if (fallbackToHwpx) {
          setNotice('PDF 변환에 실패해 HWPX로 다운로드했습니다.');
        }
      } catch (nextError) {
        setDocumentError(
          nextError instanceof Error ? nextError.message : 'PDF를 다운로드하는 중 오류가 발생했습니다.',
        );
      } finally {
        setIsGeneratingPdf(false);
      }
    },
    handleDownloadWord: async () => {
      try {
        setDocumentError(null);
        setIsGeneratingHwpx(true);
        const { authToken, reportKey } = await persistDraftForDocumentExport();
        const { blob, filename } = await fetchQuarterlyHwpxDocumentByReportKey(reportKey, authToken);
        saveBlobAsFile(blob, filename);
      } catch (nextError) {
        setDocumentError(
          nextError instanceof Error ? nextError.message : '문서를 다운로드하는 중 오류가 발생했습니다.',
        );
      } finally {
        setIsGeneratingHwpx(false);
      }
    },
  };
}
