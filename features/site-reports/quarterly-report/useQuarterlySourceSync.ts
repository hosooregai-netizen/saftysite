import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { applyQuarterlySummarySeed } from '@/lib/erpReports/quarterly';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { buildLocalQuarterlySummarySeed, getQuarterlyPageErrorMessage, sortSourceReportsByDateDesc } from './quarterlyReportHelpers';
import { normalizeIds } from './quarterlyReportStateHelpers';
import { buildQuarterlyDraftForQuarterChange, buildQuarterlySelectionNotice, hasInvalidQuarterlyPeriod, loadQuarterlySourceSeed, type QuarterlySourceSyncOptions } from './quarterlySourceSyncHelpers';
import type { QuarterlySourceReport } from './types';

export function useQuarterlySourceSync(args: {
  currentSiteId: string;
  currentSite: Parameters<typeof buildLocalQuarterlySummarySeed>[1];
  draft: QuarterlySummaryReport;
  draftRef: MutableRefObject<QuarterlySummaryReport>;
  initialDraft: QuarterlySummaryReport;
  isExistingReport: boolean;
  setDraft: Dispatch<SetStateAction<QuarterlySummaryReport>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
}) {
  const { currentSiteId, currentSite, draft, draftRef, initialDraft, isExistingReport, setDraft, setNotice } = args;
  const { getSessionsBySiteId, ensureSiteReportsLoaded } = useInspectionSessions();
  const [sourceReports, setSourceReports] = useState<QuarterlySourceReport[]>([]);
  const [sourceReportsLoading, setSourceReportsLoading] = useState(false);
  const [sourceReportsError, setSourceReportsError] = useState<string | null>(null);
  const [selectedSourceReportKeys, setSelectedSourceReportKeys] = useState(
    initialDraft.generatedFromSessionIds,
  );
  const sourceReportsRef = useRef<QuarterlySourceReport[]>([]);
  const selectedSourceReportKeysRef = useRef(initialDraft.generatedFromSessionIds);

  useEffect(() => {
    sourceReportsRef.current = sourceReports;
  }, [sourceReports]);

  useEffect(() => {
    selectedSourceReportKeysRef.current = selectedSourceReportKeys;
  }, [selectedSourceReportKeys]);

  const syncSourceReports = useCallback(
    async (
      nextDraft: QuarterlySummaryReport,
      options?: QuarterlySourceSyncOptions,
    ) => {
      if (hasInvalidQuarterlyPeriod(nextDraft)) {
        if (options?.optimistic) {
          setDraft(nextDraft);
        }
        setSourceReports([]);
        setSelectedSourceReportKeys([]);
        setSourceReportsError(null);
        setSourceReportsLoading(false);
        if (options?.successNotice !== undefined) {
          setNotice(options.successNotice);
        }
        return false;
      }

      const token = readSafetyAuthToken();
      if (!token) {
        setSourceReportsError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        return false;
      }

      const previousDraft = draftRef.current;
      const previousSourceReports = sourceReportsRef.current;
      const previousSelectedSourceReportKeys = selectedSourceReportKeysRef.current;

      if (options?.optimistic) {
        setDraft(nextDraft);
        setSourceReports([]);
        setSelectedSourceReportKeys(options.selectedReportKeys ?? []);
      }

      setSourceReportsLoading(true);
      setSourceReportsError(null);

      try {
        const seed = await loadQuarterlySourceSeed({
          currentSite,
          currentSiteId,
          ensureSiteReportsLoaded,
          getSessionsBySiteId,
          nextDraft,
          options,
          token,
        });

        setSourceReports(seed.source_reports);
        setSelectedSourceReportKeys(seed.selected_report_keys);
        setDraft((current) =>
          applyQuarterlySummarySeed(
            {
              ...current,
              title: nextDraft.title,
              periodStartDate: nextDraft.periodStartDate,
              periodEndDate: nextDraft.periodEndDate,
              quarterKey: nextDraft.quarterKey,
              year: nextDraft.year,
              quarter: nextDraft.quarter,
            },
            seed,
          ),
        );
        if (options?.successNotice !== undefined) {
          setNotice(options.successNotice);
        }
        return true;
      } catch (nextError) {
        if (options?.optimistic) {
          setDraft(previousDraft);
          setSourceReports(previousSourceReports);
          setSelectedSourceReportKeys(previousSelectedSourceReportKeys);
        }
        setSourceReportsError(getQuarterlyPageErrorMessage(nextError));
        return false;
      } finally {
        setSourceReportsLoading(false);
      }
    },
    [currentSite, currentSiteId, draftRef, ensureSiteReportsLoaded, getSessionsBySiteId, setDraft, setNotice],
  );

  useEffect(() => {
    setSourceReports([]);
    setSourceReportsError(null);
    setSelectedSourceReportKeys(initialDraft.generatedFromSessionIds);
  }, [initialDraft]);

  useEffect(() => {
    if (!initialDraft.periodStartDate || !initialDraft.periodEndDate) {
      setSourceReports([]);
      setSourceReportsError(null);
      setSelectedSourceReportKeys([]);
      return;
    }

    void syncSourceReports(initialDraft, {
      explicitSelection: isExistingReport,
      selectedReportKeys: initialDraft.generatedFromSessionIds,
    });
  }, [initialDraft, isExistingReport, syncSourceReports]);

  const availableSourceReports = useMemo(
    () => sortSourceReportsByDateDesc(sourceReports),
    [sourceReports],
  );
  const selectedSourceSet = useMemo(() => new Set(selectedSourceReportKeys), [selectedSourceReportKeys]);

  return {
    availableSourceReports,
    clearSelectedSourceReports: () => setSelectedSourceReportKeys([]),
    error: sourceReportsError,
    handleApplySourceSelection: () =>
      syncSourceReports(draftRef.current, {
        explicitSelection: true,
        selectedReportKeys: selectedSourceReportKeysRef.current,
        successNotice: buildQuarterlySelectionNotice(selectedSourceReportKeysRef.current),
      }),
    handlePeriodChange: (field: 'periodStartDate' | 'periodEndDate', value: string) => {
      const nextDraft = { ...draftRef.current, [field]: value };
      setNotice(null);
      if (hasInvalidQuarterlyPeriod(nextDraft)) {
        setDraft(nextDraft);
        setSourceReports([]);
        setSourceReportsError(null);
        setSelectedSourceReportKeys([]);
        return;
      }
      void syncSourceReports(nextDraft, { optimistic: true, successNotice: null });
    },
    handleQuarterChange: (value: string) => {
      const nextQuarter = Number.parseInt(value, 10);
      if (nextQuarter < 1 || nextQuarter > 4) {
        return;
      }
      const nextDraft = buildQuarterlyDraftForQuarterChange(draftRef.current, nextQuarter);
      setNotice(null);
      void syncSourceReports(nextDraft, { optimistic: true, successNotice: null });
    },
    handleToggleSourceReport: (reportKey: string, checked: boolean) => {
      setSelectedSourceReportKeys((current) => {
        if (checked) return current.includes(reportKey) ? current : [...current, reportKey];
        return current.filter((item) => item !== reportKey);
      });
    },
    hasPendingSelectionChanges: normalizeIds(selectedSourceReportKeys) !== normalizeIds(draft.generatedFromSessionIds),
    loading: sourceReportsLoading,
    selectAllSourceReports: () =>
      setSelectedSourceReportKeys(availableSourceReports.map((report) => report.report_key)),
    selectedSourceReportKeys,
    selectedSourceSet,
  };
}
