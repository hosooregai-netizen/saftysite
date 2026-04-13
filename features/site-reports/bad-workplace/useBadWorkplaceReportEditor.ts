import { useMemo, useState } from 'react';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import {
  fetchBadWorkplaceHwpxDocumentByReportKey,
  saveBlobAsFile,
} from '@/lib/api';
import { syncBadWorkplaceReportSource } from '@/lib/erpReports/badWorkplace';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { BadWorkplaceReportEditorProps } from './types';
import { getBadWorkplaceSourceModeLabel } from './badWorkplaceHelpers';

export function useBadWorkplaceReportEditor({
  initialDraft,
  onSave,
  siteSessions,
}: BadWorkplaceReportEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  const selectedSession = useMemo(
    () =>
      siteSessions.find((session) => session.id === draft.sourceSessionId) ??
      siteSessions[0] ??
      null,
    [draft.sourceSessionId, siteSessions],
  );

  const updateDraft = (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => {
    setDraft((current) => updater(current));
  };

  const updateSiteSnapshot = (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      receiverName: key === 'siteManagerName' ? value : current.receiverName,
      siteSnapshot: {
        ...current.siteSnapshot,
        [key]: value,
      },
    }));
  };

  const updateViolation = (
    violationId: string,
    patch: Partial<BadWorkplaceReport['violations'][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      violations: current.violations.map((violation) =>
        violation.id === violationId ? { ...violation, ...patch } : violation,
      ),
    }));
  };

  const handleSourceSessionChange = (sessionId: string) => {
    const nextSession =
      siteSessions.find((session) => session.id === sessionId) ?? null;
    setDraft((current) => syncBadWorkplaceReportSource(current, nextSession));
    setNotice(
      nextSession
        ? `${nextSession.meta.reportDate || '-'} 기술지도 보고서를 원본으로 선택했습니다.`
        : null,
    );
    setSourceModalOpen(false);
  };

  const handleSourceModeChange = (sourceMode: BadWorkplaceReport['sourceMode']) => {
    setDraft((current) =>
      syncBadWorkplaceReportSource(
        {
          ...current,
          sourceMode,
        },
        selectedSession,
        current.sourceFindingIds,
      ),
    );
    setNotice(
      sourceMode === 'current_new_hazard'
        ? '당회차 신규 위험 기준으로 신고 초안을 전환했습니다.'
        : '이전 지적사항 미이행 기준으로 신고 초안을 전환했습니다.',
    );
  };

  const handleSave = async () => {
    const nextDraft = { ...draft, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);
    setNotice('불량사업장 신고서를 저장했습니다.');
  };

  const handleDownloadHwpx = async () => {
    try {
      setDocumentError(null);
      setNotice(null);
      setIsGeneratingHwpx(true);
      const authToken = readSafetyAuthToken();
      if (!authToken || authToken.trim().length === 0) {
        throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      }

      const nextDraft = { ...draft, updatedAt: createTimestamp() };
      setDraft(nextDraft);
      await onSave(nextDraft);

      const { blob, filename } = await fetchBadWorkplaceHwpxDocumentByReportKey(
        nextDraft.id,
        authToken,
      );
      saveBlobAsFile(blob, filename);
      setNotice('불량사업장 신고서 HWPX를 다운로드했습니다.');
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error
          ? nextError.message
          : '문서를 다운로드하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  return {
    documentError,
    draft,
    handleDownloadHwpx,
    handleSave,
    handleSourceModeChange,
    handleSourceSessionChange,
    isGeneratingHwpx,
    notice,
    selectedSession,
    setSourceModalOpen,
    sourceModalOpen,
    sourceModeLabel: getBadWorkplaceSourceModeLabel(draft.sourceMode),
    siteSessions,
    updateDraft,
    updateSiteSnapshot,
    updateViolation,
  };
}
