import { useEffect, useMemo, useRef, useState } from 'react';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getHazardCountermeasureCatalogForReportDate } from '@/lib/safetyApiMappers/masterData';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import {
  createEmptyImplementationRow,
  getQuarterlyDraftFingerprint,
} from './quarterlyReportHelpers';
import type { QuarterlyReportEditorProps } from './types';
import { useQuarterlyAutosave } from './useQuarterlyAutosave';
import { useQuarterlyDocumentActions } from './useQuarterlyDocumentActions';
import { useQuarterlyOpsAssets } from './useQuarterlyOpsAssets';
import { useQuarterlySourceSync } from './useQuarterlySourceSync';

export function useQuarterlyReportEditor({
  currentSite,
  initialDraft,
  isExistingReport,
  isSaving,
  onSave,
}: Pick<
  QuarterlyReportEditorProps,
  'currentSite' | 'initialDraft' | 'isExistingReport' | 'isSaving' | 'onSave'
>) {
  const { masterData } = useInspectionSessions();
  const [draft, setDraft] = useState(initialDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [titleEditorOpen, setTitleEditorOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialDraft.title);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const lastPersistedDraftFingerprintRef = useRef(getQuarterlyDraftFingerprint(initialDraft));
  const draftRef = useRef(initialDraft);
  const draftFingerprint = useMemo(() => getQuarterlyDraftFingerprint(draft), [draft]);
  const hazardCountermeasureCatalog = useMemo(
    () =>
      getHazardCountermeasureCatalogForReportDate(
        masterData,
        draft.periodEndDate || draft.periodStartDate || new Date().toISOString().slice(0, 10),
      ),
    [draft.periodEndDate, draft.periodStartDate, masterData],
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const sourceSync = useQuarterlySourceSync({
    currentSite,
    currentSiteId: currentSite.id,
    draft,
    draftRef,
    initialDraft,
    isExistingReport,
    setDraft,
    setNotice,
  });
  const documentActions = useQuarterlyDocumentActions({
    currentSite,
    draftRef,
    onSave,
    setDraft,
    setDocumentError,
    setNotice,
  });
  const opsState = useQuarterlyOpsAssets({ draft, setDraft });

  useQuarterlyAutosave({
    draft,
    draftFingerprint,
    isSaving,
    onSave,
    sourceReportsLoading: sourceSync.loading,
    lastPersistedDraftFingerprintRef,
  });

  return {
    addFuturePlan: () =>
      setDraft((current) => ({
        ...current,
        futurePlans: [...current.futurePlans, createFutureProcessRiskPlan()],
      })),
    addImplementationRow: () =>
      setDraft((current) => ({
        ...current,
        implementationRows: [...current.implementationRows, createEmptyImplementationRow()],
      })),
    availableSourceReports: sourceSync.availableSourceReports,
    clearSelectedSourceReports: sourceSync.clearSelectedSourceReports,
    documentError,
    documentInfoOpen,
    draft,
    error: sourceSync.error,
    handleApplySourceSelection: sourceSync.handleApplySourceSelection,
    handleDownloadPdf: documentActions.handleDownloadPdf,
    handleDownloadWord: documentActions.handleDownloadWord,
    handleQuarterChange: sourceSync.handleQuarterChange,
    handleToggleSourceReport: sourceSync.handleToggleSourceReport,
    hazardCountermeasureCatalog,
    handlePeriodChange: sourceSync.handlePeriodChange,
    handleImplementationRowChange: (
      index: number,
      field: keyof QuarterlySummaryReport['implementationRows'][number],
      value: string,
    ) => {
      setDraft((current) => ({
        ...current,
        implementationRows: current.implementationRows.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]:
                  field === 'reportNumber' ||
                  field === 'findingCount' ||
                  field === 'improvedCount'
                    ? Number(value || 0)
                    : value,
              }
            : item,
        ),
      }));
    },
    handleApplyTitle: () => {
      const nextTitle = titleDraft.trim();
      if (!nextTitle || nextTitle === draft.title) {
        setTitleEditorOpen(false);
        setTitleDraft(draft.title);
        return;
      }

      setDraft((current) => ({ ...current, title: nextTitle }));
      setNotice('보고서 제목을 수정했습니다.');
      setTitleEditorOpen(false);
    },
    handleCloseTitleEditor: () => {
      setTitleEditorOpen(false);
      setTitleDraft(draft.title);
    },
    handleOpenTitleEditor: () => {
      setTitleDraft(draft.title);
      setTitleEditorOpen(true);
    },
    hasPendingSelectionChanges: sourceSync.hasPendingSelectionChanges,
    isGeneratingDocument: documentActions.isGeneratingDocument,
    isGeneratingHwpx: documentActions.isGeneratingHwpx,
    isGeneratingPdf: documentActions.isGeneratingPdf,
    opsError: opsState.opsError,
    opsLoading: opsState.opsLoading,
    notice,
    removeImplementationRow: (index: number) =>
      setDraft((current) => ({
        ...current,
        implementationRows: current.implementationRows.filter((_, itemIndex) => itemIndex !== index),
      })),
    selectedSourceReportKeys: sourceSync.selectedSourceReportKeys,
    selectedSourceSet: sourceSync.selectedSourceSet,
    selectAllSourceReports: sourceSync.selectAllSourceReports,
    setDocumentInfoOpen,
    setSourceModalOpen,
    setTitleDraft,
    sourceModalOpen,
    sourceReportsLoading: sourceSync.loading,
    titleDraft,
    titleEditorOpen,
    updateDocumentInfo: (field: 'drafter' | 'reviewer' | 'approver', value: string) =>
      setDraft((current) => ({
        ...current,
        [field]: value,
      })),
    updateFuturePlans: (plans: QuarterlySummaryReport['futurePlans']) =>
      setDraft((current) => ({ ...current, futurePlans: plans })),
    updateSiteSnapshotField: (
      field: keyof QuarterlySummaryReport['siteSnapshot'],
      value: string,
    ) =>
      setDraft((current) => ({
        ...current,
        siteSnapshot: {
          ...current.siteSnapshot,
          [field]: value,
        },
      })),
  };
}
