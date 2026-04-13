import { useEffect, useMemo, useState } from 'react';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import {
  getBadWorkplaceSourceSessions,
  syncBadWorkplaceReportSource,
} from '@/lib/erpReports/badWorkplace';
import { buildBadWorkplaceReportKey } from '@/lib/erpReports/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { buildBadWorkplaceSourceNotice, getMessage } from './mobileBadWorkplaceHelpers';
import { useMobileBadWorkplaceDocumentActions } from './useMobileBadWorkplaceDocumentActions';
import { useMobileBadWorkplaceDraftLoader } from './useMobileBadWorkplaceDraftLoader';

interface UseMobileBadWorkplaceScreenStateParams {
  reportMonth: string;
  siteKey: string;
}

export function useMobileBadWorkplaceScreenState({
  reportMonth,
  siteKey,
}: UseMobileBadWorkplaceScreenStateParams) {
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedReportMonth = decodeURIComponent(reportMonth);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const {
    authError,
    currentUser,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const siteSessions = useMemo(
    () =>
      currentSite
        ? getBadWorkplaceSourceSessions(getSessionsBySiteId(currentSite.id))
        : [],
    [currentSite, getSessionsBySiteId],
  );
  const reportKey =
    currentSite && currentUser?.id
      ? buildBadWorkplaceReportKey(currentSite.id, decodedReportMonth, currentUser.id)
      : '';
  const { error: mutationError, isSaving, saveBadWorkplaceReport } =
    useSiteOperationalReportMutations(currentSite);
  const {
    draft,
    isLoading,
    loadError,
    notice,
    setDraft,
    setLoadError,
    setNotice,
  } = useMobileBadWorkplaceDraftLoader({
    currentSite,
    currentUser,
    decodedReportMonth,
    isAuthenticated,
    isReady,
    reportKey,
    siteSessions,
  });

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;

    void ensureSiteReportsLoaded(currentSite.id).catch(() => undefined);
  }, [currentSite, ensureSiteReportsLoaded, isAuthenticated, isReady]);

  const selectedSession = useMemo(
    () =>
      siteSessions.find((session) => session.id === draft?.sourceSessionId) ??
      siteSessions[0] ??
      null,
    [draft?.sourceSessionId, siteSessions],
  );

  const updateDraft = (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => {
    setNotice(null);
    setDocumentError(null);
    setDraft((current) => (current ? updater(current) : current));
  };

  const handleSave = async () => {
    if (!draft || !currentSite) return null;

    const nextDraft = {
      ...draft,
      updatedAt: createTimestamp(),
    };
    await saveBadWorkplaceReport(nextDraft);
    setDraft(nextDraft);
    setNotice('저장되었습니다.');
    return nextDraft;
  };

  const { handleDownloadHwpx, handleDownloadPdf, isGeneratingHwpx, isGeneratingPdf } =
    useMobileBadWorkplaceDocumentActions({
      onSave: handleSave,
      setDocumentError,
      setNotice,
    });

  return {
    authError,
    currentSite,
    currentUserName: currentUser?.name ?? null,
    decodedReportMonth,
    documentError,
    documentInfoOpen,
    draft,
    handleDownloadHwpx,
    handleDownloadPdf,
    handleSave,
    handleSaveWithFeedback: async () => {
      try {
        await handleSave();
      } catch (error) {
        setLoadError(getMessage(error, '저장하지 못했습니다.'));
      }
    },
    handleSourceSessionChange: (sessionId: string) => {
      const nextSession =
        siteSessions.find((session) => session.id === sessionId) ?? null;
      updateDraft((current) => syncBadWorkplaceReportSource(current, nextSession));
      setNotice(buildBadWorkplaceSourceNotice(nextSession));
      setSourceModalOpen(false);
    },
    isAuthenticated,
    isGeneratingHwpx,
    isGeneratingPdf,
    isLoading,
    isReady,
    isSaving,
    loadError,
    login,
    logout,
    mutationError,
    notice,
    selectedSession,
    setDocumentInfoOpen,
    setSourceModalOpen,
    sourceModalOpen,
    siteSessions,
    updateSiteSnapshot: (
      key: keyof BadWorkplaceReport['siteSnapshot'],
      value: string,
    ) => {
      updateDraft((current) => ({
        ...current,
        receiverName: key === 'siteManagerName' ? value : current.receiverName,
        siteSnapshot: {
          ...current.siteSnapshot,
          [key]: value,
        },
      }));
    },
    updateViolation: (
      violationId: string,
      patch: Partial<BadWorkplaceReport['violations'][number]>,
    ) => {
      updateDraft((current) => ({
        ...current,
        violations: current.violations.map((violation) =>
          violation.id === violationId ? { ...violation, ...patch } : violation,
        ),
      }));
    },
    updateDraft,
  };
}
