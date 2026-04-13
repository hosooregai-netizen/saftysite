import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildMobileSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import {
  fetchQuarterlyHwpxDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { normalizeQuarterlyReportPeriod } from '@/lib/erpReports/shared';
import { fetchSafetyContentItems, readSafetyAuthToken } from '@/lib/safetyApi';
import {
  pickCampaignTemplateContentItems,
  readSafetyContentItemsSessionCache,
  resolveSafetyContentItemsCacheScope,
  writeSafetyContentItemsSessionCache,
} from '@/lib/safetyApi/contentItemsCache';
import { applyQuarterlySummarySeed } from '@/lib/erpReports/quarterly';
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
import { fetchMobileQuarterlySeed, loadMobileQuarterlyDraft } from './mobileQuarterlyReportData';
import type { MobileQuarterlyOpsAsset, MobileQuarterlySourceReport, MobileQuarterlyStepId } from './types';

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
  const [draft, setDraft] = useState<QuarterlySummaryReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [documentNotice, setDocumentNotice] = useState<string | null>(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([]);
  const [sourceReports, setSourceReports] = useState<MobileQuarterlySourceReport[]>([]);
  const [opsAssets, setOpsAssets] = useState<MobileQuarterlyOpsAsset[]>([]);
  const [isOpsAssetsLoading, setIsOpsAssetsLoading] = useState(false);
  const [isOpsAssetsRefreshing, setIsOpsAssetsRefreshing] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDraftRoute, setIsDraftRoute] = useState(false);
  const sourceSyncRequestRef = useRef(0);
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
  const contentCacheScope = useMemo(
    () => resolveSafetyContentItemsCacheScope(currentUser?.id),
    [currentUser?.id],
  );
  const { error: mutationError, isSaving, saveQuarterlyReport } =
    useSiteOperationalReportMutations(currentSite);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    void ensureSiteReportsLoaded(currentSite.id).catch(() => undefined);
  }, [currentSite, ensureSiteReportsLoaded, isAuthenticated, isReady]);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      const token = readSafetyAuthToken();
      if (!token) {
        setLoadError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        setIsLoading(false);
        return;
      }

      try {
        await ensureSiteReportsLoaded(currentSite.id);
        const nextState = await loadMobileQuarterlyDraft({
          currentSite,
          currentUserName: currentUser?.name,
          decodedQuarterKey,
          siteSessions: getSessionsBySiteId(currentSite.id),
          token,
        });

        if (cancelled) return;
        setDraft(nextState.draft);
        setSelectedSourceKeys(nextState.draft.generatedFromSessionIds);
        setSourceReports(nextState.sourceReports);
        setIsDraftRoute(nextState.createdFromQuarter);
        setSaveNotice(nextState.createdFromQuarter ? '새 초안을 만들었습니다.' : null);
      } catch (error) {
        if (!cancelled) {
          setLoadError(getMessage(error, '분기 보고서를 불러오지 못했습니다.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentSite,
    currentUser?.name,
    decodedQuarterKey,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isReady) return;
    const token = readSafetyAuthToken();
    if (!token) return;
    const cachedItems = contentCacheScope
      ? readSafetyContentItemsSessionCache(contentCacheScope)
      : null;
    const hasCachedItems = cachedItems !== null;

    if (hasCachedItems) {
      setOpsAssets(pickCampaignTemplateContentItems(cachedItems));
      setIsOpsAssetsRefreshing(true);
    } else {
      setIsOpsAssetsLoading(true);
      setIsOpsAssetsRefreshing(false);
    }

    let cancelled = false;
    void fetchSafetyContentItems(token)
      .then((items) => {
        if (cancelled) return;
        if (contentCacheScope) {
          writeSafetyContentItemsSessionCache(contentCacheScope, items);
        }
        setOpsAssets(pickCampaignTemplateContentItems(items));
      })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        setIsOpsAssetsLoading(false);
        setIsOpsAssetsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contentCacheScope, isAuthenticated, isReady]);

  useEffect(() => {
    if (!draft || draft.opsAssetId || opsAssets.length === 0) return;
    setDraft((current) => (current && !current.opsAssetId ? applyOpsAsset(current, opsAssets[0]) : current));
  }, [draft, opsAssets]);

  const updateDraft = (updater: (current: QuarterlySummaryReport) => QuarterlySummaryReport) => {
    setSaveNotice(null);
    setDocumentNotice(null);
    setDraft((current) => (current ? updater(current) : current));
  };

  const syncSourceReportsForDraft = async (
    nextDraft: QuarterlySummaryReport,
    options?: {
      explicitSelection?: boolean;
      selectedReportKeys?: string[];
      sourceNotice?: string | null;
    },
  ) => {
    if (!currentSite) {
      setDraft(nextDraft);
      return;
    }
    if (!nextDraft.periodStartDate || !nextDraft.periodEndDate || nextDraft.periodStartDate > nextDraft.periodEndDate) {
      setDraft(nextDraft);
      setSourceReports([]);
      setSelectedSourceKeys([]);
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      setDraft(nextDraft);
      setSourceError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    const requestId = sourceSyncRequestRef.current + 1;
    sourceSyncRequestRef.current = requestId;
    setIsSourceLoading(true);
    setSourceError(null);

    try {
      await ensureSiteReportsLoaded(currentSite.id);
      const seed = await fetchMobileQuarterlySeed({
        currentSite,
        explicitSelection: options?.explicitSelection,
        nextDraft,
        selectedReportKeys: options?.selectedReportKeys,
        siteSessions: getSessionsBySiteId(currentSite.id),
        token,
      });

      if (sourceSyncRequestRef.current !== requestId) return;

      const draftWithSelection =
        options?.explicitSelection && options.selectedReportKeys
          ? { ...nextDraft, generatedFromSessionIds: options.selectedReportKeys }
          : nextDraft;
      const updatedDraft = applyQuarterlySummarySeed(draftWithSelection, seed);
      setDraft(updatedDraft);
      setSourceReports(seed.source_reports);
      setSelectedSourceKeys(updatedDraft.generatedFromSessionIds);
      setSourceNotice(options?.sourceNotice ?? null);
    } catch (error) {
      if (sourceSyncRequestRef.current !== requestId) return;
      setDraft(nextDraft);
      setSourceError(getMessage(error, '원본 보고서를 반영하지 못했습니다.'));
    } finally {
      if (sourceSyncRequestRef.current === requestId) {
        setIsSourceLoading(false);
      }
    }
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
    handleDownloadHwpx: async () => {
      const saved = await handleSave();
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
      const saved = await handleSave();
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
