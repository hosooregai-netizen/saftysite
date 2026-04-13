import { useEffect, type MutableRefObject } from 'react';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import type { QuarterlySummaryReport } from '@/types/erpReports';

export function useQuarterlyAutosave(args: {
  draft: QuarterlySummaryReport;
  draftFingerprint: string;
  isSaving: boolean;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
  sourceReportsLoading: boolean;
  lastPersistedDraftFingerprintRef: MutableRefObject<string>;
}) {
  const { draft, draftFingerprint, isSaving, onSave, sourceReportsLoading, lastPersistedDraftFingerprintRef } = args;

  useEffect(() => {
    if (
      draftFingerprint === lastPersistedDraftFingerprintRef.current ||
      isSaving ||
      sourceReportsLoading ||
      !draft.periodStartDate ||
      !draft.periodEndDate ||
      draft.periodStartDate > draft.periodEndDate
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextDraft = { ...draft, updatedAt: createTimestamp() };
      void onSave(nextDraft)
        .then(() => {
          lastPersistedDraftFingerprintRef.current = draftFingerprint;
        })
        .catch(() => {
          // shared operational report hook surfaces error state
        });
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft, draftFingerprint, isSaving, lastPersistedDraftFingerprintRef, onSave, sourceReportsLoading]);
}
