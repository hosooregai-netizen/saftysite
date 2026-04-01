import {
  createFutureProcessRiskPlan,
  getSessionGuidanceDate,
  getSessionProgress,
  isImplementedFollowUpResult,
} from '@/constants/inspectionSession';
import { isMeaningfulDocument7Finding } from '@/lib/erpReports/document7FindingCount';
import {
  createTimestamp,
  generateId,
} from '@/constants/inspectionSession/shared';
import { CAUSATIVE_AGENT_LABELS } from '@/constants/inspectionSession/doc7Catalog';
import type { QuarterTarget, QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import {
  buildQuarterlyTitleForPeriod,
  buildQuarterlyDefaultTitle,
  formatPeriodRangeLabel,
  getQuarterlyReportPeriodLabel,
  isDateWithinRange,
  normalizeQuarterlyReportPeriod,
  QUARTERLY_SUMMARY_REPORT_KIND,
} from './shared';

function normalizeMeasureText(value: string) {
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .join(' ');
}

function buildQuarterlyCounters(counterMap: Map<string, number>): QuarterlyCounter[] {
  return [...counterMap.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ko'))
    .map(([label, count]) => ({ label, count }));
}

function sortSessionsByDateDesc(sessions: InspectionSession[]) {
  return [...sessions].sort((left, right) => {
    const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
    const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

function sortSessionsByReportNumberAsc(sessions: InspectionSession[]) {
  return [...sessions].sort((left, right) => {
    const leftNumber = Number.isFinite(left.reportNumber) ? left.reportNumber : Number.MAX_SAFE_INTEGER;
    const rightNumber = Number.isFinite(right.reportNumber)
      ? right.reportNumber
      : Number.MAX_SAFE_INTEGER;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    const leftDate = getSessionGuidanceDate(left);
    const rightDate = getSessionGuidanceDate(right);
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
  });
}

function buildOverallComment(
  periodLabel: string,
  sessions: InspectionSession[],
  accidentStats: QuarterlyCounter[],
  causativeStats: QuarterlyCounter[],
) {
  if (sessions.length === 0) {
    return `${periodLabel} 기준으로 연결된 기술지도 보고서가 없습니다. 기간을 다시 설정하거나 보고서를 선택하면 종합 총평과 통계가 반영됩니다.`;
  }

  const completedReports = sessions.filter(
    (session) => getSessionProgress(session).percentage >= 100,
  ).length;
  const topAccident = accidentStats[0]?.label || '주요 지적유형 없음';
  const topCause = causativeStats[0]?.label || '주요 기인물 없음';

  return [
    `${periodLabel} 기준으로 총 ${sessions.length}건의 기술지도 보고서를 반영했습니다.`,
    `완료 처리된 보고서는 ${completedReports}건이며 가장 많이 확인된 지적유형은 ${topAccident}입니다.`,
    `주요 기인물은 ${topCause}로 집계되어 해당 영역을 우선 관리할 필요가 있습니다.`,
  ].join(' ');
}

function createQuarterlySiteSnapshot(site: InspectionSite): QuarterlySummaryReport['siteSnapshot'] {
  return {
    ...site.adminSiteSnapshot,
  };
}

export function getQuarterlySourceSessions(
  siteSessions: InspectionSession[],
  period:
    | Pick<QuarterlySummaryReport, 'periodStartDate' | 'periodEndDate'>
    | Pick<QuarterTarget, 'startDate' | 'endDate'>,
) {
  const startDate = 'periodStartDate' in period ? period.periodStartDate : period.startDate;
  const endDate = 'periodEndDate' in period ? period.periodEndDate : period.endDate;

  if (!startDate || !endDate) {
    return [];
  }

  return [...siteSessions]
    .filter((session) =>
      isDateWithinRange(getSessionGuidanceDate(session), startDate, endDate),
    )
    .sort((left, right) =>
      getSessionGuidanceDate(left).localeCompare(getSessionGuidanceDate(right)),
    );
}

function buildDerivedQuarterlyContent(
  site: InspectionSite,
  siteSessions: InspectionSession[],
  report: QuarterlySummaryReport,
  selectedSessionIds: string[],
  availableSourceSessions?: InspectionSession[],
) {
  const normalizedPeriod = normalizeQuarterlyReportPeriod(report);
  const quarterSessions =
    availableSourceSessions ?? getQuarterlySourceSessions(siteSessions, normalizedPeriod);
  const selectedIdSet = new Set(selectedSessionIds);
  const selectedSessions =
    selectedIdSet.size > 0
      ? quarterSessions.filter((session) => selectedIdSet.has(session.id))
      : [];
  const selectedSessionsByReportNumber = sortSessionsByReportNumberAsc(selectedSessions);
  const accidentCounter = new Map<string, number>();
  const causativeCounter = new Map<string, number>();
  const majorMeasures: string[] = [];

  selectedSessions.forEach((session) => {
    session.document7Findings.filter(isMeaningfulDocument7Finding).forEach((finding) => {
      const accidentLabel = finding.accidentType || '기타';
      accidentCounter.set(accidentLabel, (accidentCounter.get(accidentLabel) || 0) + 1);

      const causativeLabel = finding.causativeAgentKey
        ? CAUSATIVE_AGENT_LABELS[finding.causativeAgentKey]
        : '기타 위험요인';
      causativeCounter.set(
        causativeLabel,
        (causativeCounter.get(causativeLabel) || 0) + 1,
      );

      const normalizedMeasure = normalizeMeasureText(finding.improvementPlan);
      if (normalizedMeasure && !majorMeasures.includes(normalizedMeasure)) {
        majorMeasures.push(normalizedMeasure);
      }
    });
  });

  const implementationRows = selectedSessionsByReportNumber.map((session) => ({
    sessionId: session.id,
    reportTitle: '',
    reportDate: getSessionGuidanceDate(session),
    reportNumber: session.reportNumber,
    drafter: session.meta.drafter,
    progressRate: session.document2Overview.progressRate || '',
    findingCount: session.document7Findings.filter(isMeaningfulDocument7Finding).length,
    improvedCount: session.document4FollowUps.filter((item) => isImplementedFollowUpResult(item.result))
      .length,
    note: '',
  }));

  const latestSelectedSession = sortSessionsByDateDesc(selectedSessions)[0] || null;

  const futurePlans =
    latestSelectedSession?.document8Plans
      .filter((item) => item.processName || item.hazard || item.countermeasure || item.note)
      .map((item) => createFutureProcessRiskPlan(item)) || [];

  const accidentStats = buildQuarterlyCounters(accidentCounter);
  const causativeStats = buildQuarterlyCounters(causativeCounter);
  const periodLabel = getQuarterlyReportPeriodLabel(normalizedPeriod);

  return {
    siteSnapshot: createQuarterlySiteSnapshot(site),
    generatedFromSessionIds: selectedSessions.map((session) => session.id),
    lastCalculatedAt: createTimestamp(),
    overallComment: buildOverallComment(
      periodLabel,
      selectedSessions,
      accidentStats,
      causativeStats,
    ),
    implementationRows,
    accidentStats,
    causativeStats,
    futurePlans,
    majorMeasures: majorMeasures.slice(0, 5),
  };
}

export function syncQuarterlySummaryReportSources(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  siteSessions: InspectionSession[],
  selectedSessionIds: string[],
  availableSourceSessions?: InspectionSession[],
): QuarterlySummaryReport {
  const normalizedPeriod = normalizeQuarterlyReportPeriod(report);
  const derived = buildDerivedQuarterlyContent(
    site,
    siteSessions,
    {
      ...report,
      ...normalizedPeriod,
    },
    selectedSessionIds,
    availableSourceSessions,
  );

  return {
    ...report,
    ...normalizedPeriod,
    ...derived,
  };
}

export function createQuarterlySummaryDraft(
  site: InspectionSite,
  drafter: string,
  referenceDate: string | Date = new Date(),
): QuarterlySummaryReport {
  const timestamp = createTimestamp();

  return {
    id: generateId('quarterly-summary'),
    siteId: site.id,
    title: buildQuarterlyDefaultTitle(referenceDate),
    reportKind: QUARTERLY_SUMMARY_REPORT_KIND,
    periodStartDate: '',
    periodEndDate: '',
    quarterKey: '',
    year: 0,
    quarter: 0,
    status: 'draft',
    drafter,
    siteSnapshot: createQuarterlySiteSnapshot(site),
    generatedFromSessionIds: [],
    lastCalculatedAt: timestamp,
    overallComment: '',
    implementationRows: [],
    accidentStats: [],
    causativeStats: [],
    futurePlans: [],
    majorMeasures: [],
    opsAssetId: '',
    opsAssetTitle: '',
    opsAssetDescription: '',
    opsAssetPreviewUrl: '',
    opsAssetFileUrl: '',
    opsAssetFileName: '',
    opsAssetType: '',
    opsAssignedBy: '',
    opsAssignedAt: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildInitialQuarterlySummaryReport(
  site: InspectionSite,
  siteSessions: InspectionSession[],
  targetOrDrafter: QuarterTarget | string,
  drafterOrExisting: string | QuarterlySummaryReport | null,
  maybeExisting?: QuarterlySummaryReport | null,
): QuarterlySummaryReport {
  const isManualMode = typeof targetOrDrafter === 'string';
  const drafter = isManualMode ? targetOrDrafter : (drafterOrExisting as string);
  const existing = (isManualMode ? drafterOrExisting : maybeExisting) as QuarterlySummaryReport | null | undefined;

  if (existing) {
    const normalizedPeriod = normalizeQuarterlyReportPeriod(existing);
    return {
      ...existing,
      ...normalizedPeriod,
      drafter: existing.drafter || drafter,
      siteSnapshot:
        existing.siteSnapshot && Object.values(existing.siteSnapshot).some(Boolean)
          ? existing.siteSnapshot
          : createQuarterlySiteSnapshot(site),
      lastCalculatedAt: existing.lastCalculatedAt || existing.updatedAt || createTimestamp(),
      updatedAt: existing.updatedAt || createTimestamp(),
      futurePlans: existing.futurePlans,
      opsAssetId: existing.opsAssetId || '',
      opsAssetTitle: existing.opsAssetTitle || '',
      opsAssetDescription: existing.opsAssetDescription || '',
      opsAssetPreviewUrl: existing.opsAssetPreviewUrl || '',
      opsAssetFileUrl: existing.opsAssetFileUrl || '',
      opsAssetFileName: existing.opsAssetFileName || '',
      opsAssetType: existing.opsAssetType || '',
      opsAssignedBy: existing.opsAssignedBy || '',
      opsAssignedAt: existing.opsAssignedAt || '',
    };
  }

  if (isManualMode) {
    return createQuarterlySummaryDraft(site, drafter);
  }

  const target = targetOrDrafter as QuarterTarget;
  const quarterSessions = getQuarterlySourceSessions(siteSessions, target);
  const nextDraft = createQuarterlySummaryDraft(site, drafter, target.startDate);

  return syncQuarterlySummaryReportSources(
    {
      ...nextDraft,
      title: buildQuarterlyTitleForPeriod(target.startDate, target.endDate),
      periodStartDate: target.startDate,
      periodEndDate: target.endDate,
      quarterKey: target.quarterKey,
      year: target.year,
      quarter: target.quarter,
    },
    site,
    siteSessions,
    quarterSessions.map((session) => session.id),
    quarterSessions,
  );
}

export function getQuarterlyPeriodDisplay(
  report: Pick<
    QuarterlySummaryReport,
    'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'
  >,
) {
  const normalized = normalizeQuarterlyReportPeriod(report);
  return formatPeriodRangeLabel(normalized.periodStartDate, normalized.periodEndDate);
}
