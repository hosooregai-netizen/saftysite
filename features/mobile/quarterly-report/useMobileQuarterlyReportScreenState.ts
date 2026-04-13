import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { buildMobileSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { normalizeQuarterlyReportPeriod } from '@/lib/erpReports/shared';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import { resolveSafetyContentItemsCacheScope } from '@/lib/safetyApi/contentItemsCache';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import {
  applyOpsAsset,
  buildQuarterDraftForQuarterSelection,
  createEmptyFuturePlan,
  createEmptyImplementationRow,
  finalizeDraft,
  getMessage,
  getQuarterSelectionTarget,
} from './mobileQuarterlyReportHelpers';
import { useMobileQuarterlyDraftLoader } from './useMobileQuarterlyDraftLoader';
import { useMobileQuarterlyDocumentActions } from './useMobileQuarterlyDocumentActions';
import { useMobileQuarterlyOpsAssets } from './useMobileQuarterlyOpsAssets';
import { useMobileQuarterlySourceSync } from './useMobileQuarterlySourceSync';
import type { MobileQuarterlyStepId } from './types';

interface UseMobileQuarterlyReportScreenStateParams {
  quarterKey: string;
  siteKey: string;
}

export function useMobileQuarterlyReportScreenState({
  quarterKey,
  siteKey,
}: UseMobileQuarterlyReportScreenStateParams) {
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedQuarterKey = decodeURIComponent(quarterKey);
  const [activeStep, setActiveStep] = useState<MobileQuarterlyStepId>('overview');
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [documentNotice, setDocumentNotice] = useState<string | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
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
  const token = isAuthenticated && isReady ? readSafetyAuthToken() : null;
  const contentCacheScope = useMemo(
    () => resolveSafetyContentItemsCacheScope(currentUser?.id),
    [currentUser?.id],
  );
  const { error: mutationError, isSaving, saveQuarterlyReport } =
    useSiteOperationalReportMutations(currentSite);

  const {
    draft,
    isDraftRoute,
    isLoading,
    loadError,
    saveNotice,
    selectedSourceKeys,
    setDraft,
    setIsDraftRoute,
    setLoadError,
    setSaveNotice,
    setSelectedSourceKeys,
    setSourceReports,
    sourceReports,
  } = useMobileQuarterlyDraftLoader({
    currentSite,
    currentUserName: currentUser?.name,
    decodedQuarterKey,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    token,
  });

  const { isOpsAssetsLoading, isOpsAssetsRefreshing, opsAssets } =
    useMobileQuarterlyOpsAssets({
      contentCacheScope,
      isAuthenticated,
      isReady,
      token,
    });

  const {
    isSourceLoading,
    setSourceNotice,
    sourceError,
    sourceNotice,
    syncSourceReportsForDraft,
  } = useMobileQuarterlySourceSync({
    currentSite,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    setDraft,
    setSelectedSourceKeys,
    setSourceReports,
    token,
  });

  useEffect(() => {
    if (!draft || draft.opsAssetId || opsAssets.length === 0) return;
    setDraft((current) => (current && !current.opsAssetId ? applyOpsAsset(current, opsAssets[0]) : current));
  }, [draft, opsAssets, setDraft]);

  const updateDraft = (updater: (current: QuarterlySummaryReport) => QuarterlySummaryReport) => {
    setSaveNotice(null);
    setDocumentNotice(null);
    setDraft((current) => (current ? updater(current) : current));
  };

  const handleSave = async () => {
    if (!draft || !currentSite) return null;

    try {
      const nextDraft = finalizeDraft(draft);
      await saveQuarterlyReport(nextDraft);
      setDraft(nextDraft);
      setSaveNotice('저장되었습니다.');
      if (isDraftRoute) {
        setIsDraftRoute(false);
        router.replace(buildMobileSiteQuarterlyHref(currentSite.id, nextDraft.id));
      }
      return nextDraft;
    } catch (error) {
      setLoadError(getMessage(error, '저장하지 못했습니다.'));
      return null;
    }
  };

  const { isGeneratingHwpx, isGeneratingPdf, handleDownloadHwpx, handleDownloadPdf } =
    useMobileQuarterlyDocumentActions({
      onSave: handleSave,
      setDocumentNotice,
    });

  return {
    activeStep,
    authError,
    currentSite,
    currentUserName: currentUser?.name,
    documentInfoOpen,
    documentNotice,
    draft,
    handleAddFuturePlan: () =>
      updateDraft((current) => ({
        ...current,
        futurePlans: [...current.futurePlans, createEmptyFuturePlan()],
      })),
    handleAddImplementationRow: () =>
      updateDraft((current) => ({
        ...current,
        implementationRows: [...current.implementationRows, createEmptyImplementationRow()],
      })),
    handleApplySourceSelection: async () => {
      if (!draft) return;
      await syncSourceReportsForDraft(draft, {
        explicitSelection: true,
        selectedReportKeys: selectedSourceKeys,
        sourceNotice: '원본 보고서 선택을 반영했습니다.',
      });
      setSourceModalOpen(false);
    },
    handleChangeDocumentField: (field: 'drafter' | 'reviewer' | 'approver', value: string) =>
      updateDraft((current) => ({ ...current, [field]: value })),
    handleChangeTitle: (value: string) => updateDraft((current) => ({ ...current, title: value })),
    handleDownloadHwpx,
    handleDownloadPdf,
    handlePeriodFieldChange: (key: 'periodStartDate' | 'periodEndDate', value: string) => {
      if (!draft) return;
      setSourceNotice(null);
      const nextDraft = {
        ...draft,
        ...normalizeQuarterlyReportPeriod({
          ...draft,
          [key]: value,
        }),
        [key]: value,
      };
      void syncSourceReportsForDraft(nextDraft);
    },
    handleQuarterChange: (value: string) => {
      const nextQuarter = Number.parseInt(value, 10);
      if (nextQuarter < 1 || nextQuarter > 4 || !draft) return;
      setSourceNotice(null);
      void syncSourceReportsForDraft(buildQuarterDraftForQuarterSelection(draft, nextQuarter));
    },
    handleRemoveFuturePlan: (planId: string) =>
      updateDraft((current) => ({
        ...current,
        futurePlans: current.futurePlans.filter((item) => item.id !== planId),
      })),
    handleRemoveImplementationRow: (sessionId: string) =>
      updateDraft((current) => ({
        ...current,
        implementationRows: current.implementationRows.filter((item) => item.sessionId !== sessionId),
      })),
    handleSave,
    handleSelectOpsAsset: (assetId: string) =>
      updateDraft((current) =>
        applyOpsAsset(current, opsAssets.find((item) => item.id === assetId) ?? null),
      ),
    handleToggleSourceReport: (reportKey: string, checked: boolean) =>
      setSelectedSourceKeys((current) =>
        checked ? [...new Set([...current, reportKey])] : current.filter((item) => item !== reportKey),
      ),
    handleUpdateFuturePlan: (
      planId: string,
      patch: Partial<QuarterlySummaryReport['futurePlans'][number]>,
    ) =>
      updateDraft((current) => ({
        ...current,
        futurePlans: current.futurePlans.map((item) => (item.id === planId ? { ...item, ...patch } : item)),
      })),
    handleUpdateImplementationRow: (
      sessionId: string,
      field: keyof QuarterlySummaryReport['implementationRows'][number],
      value: string,
    ) =>
      updateDraft((current) => ({
        ...current,
        implementationRows: current.implementationRows.map((item) => {
          if (item.sessionId !== sessionId) return item;
          if (field === 'reportNumber' || field === 'findingCount' || field === 'improvedCount') {
            const parsed = Number.parseInt(value, 10);
            return { ...item, [field]: Number.isNaN(parsed) ? 0 : parsed };
          }
          return { ...item, [field]: value };
        }),
      })),
    handleUpdateSnapshotField: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) =>
      updateDraft((current) => ({
        ...current,
        siteSnapshot: {
          ...current.siteSnapshot,
          [field]: value,
        },
      })),
    isAuthenticated,
    isGeneratingHwpx,
    isGeneratingPdf,
    isLoading,
    isOpsAssetsLoading,
    isOpsAssetsRefreshing,
    isReady,
    isSaving,
    isSourceLoading,
    loadError,
    login,
    logout,
    mutationError,
    opsAssets,
    saveNotice,
    selectedQuarter: draft ? String(getQuarterSelectionTarget(draft).quarter) : '1',
    selectedSourceKeys,
    setActiveStep,
    setDocumentInfoOpen,
    setSourceModalOpen,
    sourceError,
    sourceModalOpen,
    sourceNotice,
    sourceReports,
  };
}
