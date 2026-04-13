import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Dispatch, SetStateAction } from 'react';
import { buildMobileSiteQuarterlyHref } from '@/features/home/lib/siteEntry';
import { normalizeQuarterlyReportPeriod } from '@/lib/erpReports/shared';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession/session';
import {
  applyOpsAsset,
  buildQuarterDraftForQuarterSelection,
  createEmptyFuturePlan,
  createEmptyImplementationRow,
  finalizeDraft,
  getMessage,
} from './mobileQuarterlyReportHelpers';
import type { MobileQuarterlyOpsAsset } from './types';

interface UseMobileQuarterlyDraftActionsParams {
  currentSite: InspectionSite | null;
  draft: QuarterlySummaryReport | null;
  isDraftRoute: boolean;
  opsAssets: MobileQuarterlyOpsAsset[];
  router: AppRouterInstance;
  saveQuarterlyReport: (draft: QuarterlySummaryReport) => Promise<unknown>;
  selectedSourceKeys: string[];
  setDocumentNotice: (value: string | null) => void;
  setDraft: Dispatch<SetStateAction<QuarterlySummaryReport | null>>;
  setIsDraftRoute: (value: boolean) => void;
  setLoadError: (value: string | null) => void;
  setSaveNotice: (value: string | null) => void;
  setSelectedSourceKeys: Dispatch<SetStateAction<string[]>>;
  setSourceNotice: (value: string | null) => void;
  syncSourceReportsForDraft: (
    nextDraft: QuarterlySummaryReport,
    options?: {
      explicitSelection?: boolean;
      selectedReportKeys?: string[];
      sourceNotice?: string | null;
    },
  ) => Promise<void>;
}

export function useMobileQuarterlyDraftActions({
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
}: UseMobileQuarterlyDraftActionsParams) {
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

  return {
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
    },
    handleChangeDocumentField: (field: 'drafter' | 'reviewer' | 'approver', value: string) =>
      updateDraft((current) => ({ ...current, [field]: value })),
    handleChangeTitle: (value: string) => updateDraft((current) => ({ ...current, title: value })),
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
  };
}
