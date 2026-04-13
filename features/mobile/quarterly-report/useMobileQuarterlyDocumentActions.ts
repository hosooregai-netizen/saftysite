import { useState } from 'react';
import {
  fetchQuarterlyHwpxDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';

interface UseMobileQuarterlyDocumentActionsParams {
  onSave: () => Promise<QuarterlySummaryReport | null>;
  setDocumentNotice: (value: string | null) => void;
}

export function useMobileQuarterlyDocumentActions({
  onSave,
  setDocumentNotice,
}: UseMobileQuarterlyDocumentActionsParams) {
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  return {
    isGeneratingHwpx,
    isGeneratingPdf,
    handleDownloadHwpx: async () => {
      const saved = await onSave();
      if (!saved) return;
      setIsGeneratingHwpx(true);
      try {
        const result = await fetchQuarterlyHwpxDocumentByReportKey(saved.id, readSafetyAuthToken());
        saveBlobAsFile(result.blob, result.filename);
        setDocumentNotice('HWPX 문서를 다운로드했습니다.');
      } finally {
        setIsGeneratingHwpx(false);
      }
    },
    handleDownloadPdf: async () => {
      const saved = await onSave();
      if (!saved) return;
      setIsGeneratingPdf(true);
      try {
        const result = await fetchQuarterlyPdfDocumentByReportKeyWithFallback(saved.id, readSafetyAuthToken());
        saveBlobAsFile(result.blob, result.filename);
        setDocumentNotice(
          result.fallbackToHwpx
            ? `PDF 대신 ${result.filename}을(를) 내려받았습니다.`
            : 'PDF 문서를 다운로드했습니다.',
        );
      } finally {
        setIsGeneratingPdf(false);
      }
    },
  };
}
