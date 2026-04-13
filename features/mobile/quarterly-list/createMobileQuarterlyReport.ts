import {
  applyQuarterlySummarySeed,
  buildLocalQuarterlySummarySeed,
  createQuarterlySummaryDraft,
} from '@/lib/erpReports/quarterly';
import { createQuarterKey } from '@/lib/erpReports/shared';
import { fetchQuarterlySummarySeed, readSafetyAuthToken } from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import {
  getCreateQuarterSelectionTarget,
  shouldUseLocalQuarterlySeedFallback,
} from './mobileQuarterlyListHelpers';
import type { CreateQuarterlyReportForm } from './types';

interface CreateMobileQuarterlyReportOptions {
  createForm: CreateQuarterlyReportForm;
  currentSite: InspectionSite;
  currentUserName?: string | null;
  ensureSiteReportsLoaded: (siteId: string) => Promise<void> | void;
  getSessionsBySiteId: (siteId: string) => InspectionSession[];
  saveQuarterlyReport: (report: QuarterlySummaryReport) => Promise<void>;
}

export async function createMobileQuarterlyReport({
  createForm,
  currentSite,
  currentUserName,
  ensureSiteReportsLoaded,
  getSessionsBySiteId,
  saveQuarterlyReport,
}: CreateMobileQuarterlyReportOptions) {
  const title = createForm.title.trim();
  const periodStartDate = createForm.periodStartDate.trim();
  const periodEndDate = createForm.periodEndDate.trim();

  if (!title) {
    throw new Error('제목을 입력해 주세요.');
  }
  if (!periodStartDate || !periodEndDate) {
    throw new Error('기간 시작일과 종료일을 모두 입력해 주세요.');
  }
  if (periodStartDate > periodEndDate) {
    throw new Error('종료일이 시작일보다 빠를 수 없습니다.');
  }

  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const { quarter, year } = getCreateQuarterSelectionTarget({
    periodEndDate,
    periodStartDate,
  });
  const drafter = currentUserName?.trim() || currentSite.assigneeName || '담당자';
  const siteSessions = getSessionsBySiteId(currentSite.id);
  let nextDraft = createQuarterlySummaryDraft(currentSite, drafter, periodStartDate);
  nextDraft = {
    ...nextDraft,
    periodEndDate,
    periodStartDate,
    quarter,
    quarterKey: createQuarterKey(year, quarter),
    title,
    year,
  };

  const seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
    periodEndDate,
    periodStartDate,
  }).catch(async (error) => {
    if (!shouldUseLocalQuarterlySeedFallback(error)) {
      throw error;
    }

    await ensureSiteReportsLoaded(currentSite.id);
    return buildLocalQuarterlySummarySeed(nextDraft, currentSite, siteSessions);
  });

  nextDraft = applyQuarterlySummarySeed(nextDraft, seed);
  await saveQuarterlyReport(nextDraft);
  return nextDraft;
}
