import {
  applyQuarterlySummarySeed,
  buildInitialQuarterlySummaryReport,
  buildLocalQuarterlySummarySeed,
} from '@/lib/erpReports/quarterly';
import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import { parseQuarterKey } from '@/lib/erpReports/shared';
import {
  fetchQuarterlySummarySeed,
  fetchSafetyReportByKey,
  SafetyApiError,
} from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession/session';
import { shouldUseLocalSeed } from './mobileQuarterlyReportHelpers';

export async function fetchMobileQuarterlySeed(params: {
  currentSite: InspectionSite;
  explicitSelection?: boolean;
  nextDraft: QuarterlySummaryReport;
  selectedReportKeys?: string[];
  siteSessions: InspectionSession[];
  token: string;
}) {
  const {
    currentSite,
    explicitSelection,
    nextDraft,
    selectedReportKeys,
    siteSessions,
    token,
  } = params;

  return fetchQuarterlySummarySeed(token, currentSite.id, {
    explicitSelection,
    periodEndDate: nextDraft.periodEndDate,
    periodStartDate: nextDraft.periodStartDate,
    selectedReportKeys,
  }).catch((error) => {
    if (shouldUseLocalSeed(error)) {
      return buildLocalQuarterlySummarySeed(nextDraft, currentSite, siteSessions, {
        explicitSelection,
        selectedReportKeys,
      });
    }
    throw error;
  });
}

export async function loadMobileQuarterlyDraft(params: {
  currentSite: InspectionSite;
  currentUserName?: string | null;
  decodedQuarterKey: string;
  siteSessions: InspectionSession[];
  token: string;
}) {
  const { currentSite, currentUserName, decodedQuarterKey, siteSessions, token } = params;
  const drafter = currentUserName?.trim() || currentSite.assigneeName || '담당자';
  const target = parseQuarterKey(decodedQuarterKey);
  let nextDraft: QuarterlySummaryReport;
  let createdFromQuarter = false;

  try {
    const report = await fetchSafetyReportByKey(token, decodedQuarterKey);
    const mapped = mapSafetyReportToQuarterlySummaryReport(report);
    if (!mapped) {
      throw new Error('분기 보고서를 찾을 수 없습니다.');
    }
    nextDraft = buildInitialQuarterlySummaryReport(currentSite, siteSessions, drafter, mapped);
  } catch (error) {
    if (target && error instanceof SafetyApiError && error.status === 404) {
      nextDraft = buildInitialQuarterlySummaryReport(
        currentSite,
        siteSessions,
        target,
        drafter,
        null,
      );
      createdFromQuarter = true;
    } else {
      throw error;
    }
  }

  let sourceReports: Awaited<ReturnType<typeof fetchMobileQuarterlySeed>>['source_reports'] = [];
  if (nextDraft.periodStartDate && nextDraft.periodEndDate) {
    const seed = await fetchMobileQuarterlySeed({
      currentSite,
      explicitSelection: nextDraft.generatedFromSessionIds.length > 0,
      nextDraft,
      selectedReportKeys: nextDraft.generatedFromSessionIds,
      siteSessions,
      token,
    });
    nextDraft = applyQuarterlySummarySeed(nextDraft, seed);
    sourceReports = seed.source_reports;
  }

  return { createdFromQuarter, draft: nextDraft, sourceReports };
}
