import { useState } from 'react';
import {
  fetchBadWorkplaceHwpxDocumentByReportKey,
  fetchBadWorkplacePdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { getMessage } from './mobileBadWorkplaceHelpers';

interface UseMobileBadWorkplaceDocumentActionsParams {
  onSave: () => Promise<BadWorkplaceReport | null>;
  setDocumentError: (value: string | null) => void;
  setNotice: (value: string | null) => void;
}

export function useMobileBadWorkplaceDocumentActions({
  onSave,
  setDocumentError,
  setNotice,
}: UseMobileBadWorkplaceDocumentActionsParams) {
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadHwpx = async () => {
    setDocumentError(null);
    const saved = await onSave().catch((error) => {
      setDocumentError(getMessage(error, '저장하지 못했습니다.'));
      return null;
    });
    if (!saved) return;

    setIsGeneratingHwpx(true);
    try {
      const result = await fetchBadWorkplaceHwpxDocumentByReportKey(
        saved.id,
        readSafetyAuthToken(),
      );
      saveBlobAsFile(result.blob, result.filename);
      setNotice('한글 문서를 다운로드했습니다.');
    } catch (error) {
      setDocumentError(getMessage(error, '문서를 내려받지 못했습니다.'));
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDocumentError(null);
    const saved = await onSave().catch((error) => {
      setDocumentError(getMessage(error, '저장하지 못했습니다.'));
      return null;
    });
    if (!saved) return;

    setIsGeneratingPdf(true);
    try {
      const result = await fetchBadWorkplacePdfDocumentByReportKeyWithFallback(
        saved.id,
        readSafetyAuthToken(),
      );
      saveBlobAsFile(result.blob, result.filename);
      setNotice(
        result.fallbackToHwpx
          ? `PDF 대신 ${result.filename}을(를) 내려받았습니다.`
          : 'PDF 문서를 다운로드했습니다.',
      );
    } catch (error) {
      setDocumentError(getMessage(error, '문서를 내려받지 못했습니다.'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return {
    handleDownloadHwpx,
    handleDownloadPdf,
    isGeneratingHwpx,
    isGeneratingPdf,
  };
}
