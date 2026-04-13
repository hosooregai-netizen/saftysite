import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import { resolveSafetyContentItemsCacheScope } from '@/lib/safetyApi/contentItemsCache';
import {
  applyOpsAsset,
  getQuarterSelectionTarget,
} from './mobileQuarterlyReportHelpers';
import { useMobileQuarterlyDraftActions } from './useMobileQuarterlyDraftActions';
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
  const { isOpsAssetsLoading, isOpsAssetsRefreshing, opsAssets } = useMobileQuarterlyOpsAssets({
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
  const {
    handleAddFuturePlan,
    handleAddImplementationRow,
    handleApplySourceSelection,
    handleChangeDocumentField,
    handleChangeTitle,
    handlePeriodFieldChange,
    handleQuarterChange,
    handleRemoveFuturePlan,
    handleRemoveImplementationRow,
    handleSave,
    handleSelectOpsAsset,
    handleToggleSourceReport,
    handleUpdateFuturePlan,
    handleUpdateImplementationRow,
    handleUpdateSnapshotField,
  } = useMobileQuarterlyDraftActions({
    currentSite,
    draft,
    isDraftRoute,
    opsAssets,
    router,
    saveQuarterlyReport,
    selectedSourceKeys,
    setDocumentNotice,
    setDraft,
    setIsDraftRoute,
    setLoadError,
    setSaveNotice,
    setSelectedSourceKeys,
    setSourceNotice,
    syncSourceReportsForDraft,
  });
  const { isGeneratingHwpx, isGeneratingPdf, handleDownloadHwpx, handleDownloadPdf } =
    useMobileQuarterlyDocumentActions({ onSave: handleSave, setDocumentNotice });
  return {
    activeStep,
    authError,
    currentSite,
    currentUserName: currentUser?.name,
    documentInfoOpen,
    documentNotice,
    draft,
    handleAddFuturePlan,
    handleAddImplementationRow,
    handleApplySourceSelection: async () => {
      await handleApplySourceSelection();
      setSourceModalOpen(false);
    },
    handleChangeDocumentField,
    handleChangeTitle,
    handleDownloadHwpx,
    handleDownloadPdf,
    handlePeriodFieldChange,
    handleQuarterChange,
    handleRemoveFuturePlan,
    handleRemoveImplementationRow,
    handleSave,
    handleSelectOpsAsset,
    handleToggleSourceReport,
    handleUpdateFuturePlan,
    handleUpdateImplementationRow,
    handleUpdateSnapshotField,
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
