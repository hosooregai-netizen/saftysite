import {
  createFutureProcessRiskPlan,
  getSessionGuidanceDate,
  isImplementedFollowUpResult,
} from '@/constants/inspectionSession';
import { mergeAdminSiteSnapshots } from '@/constants/inspectionSession/normalizeSite';
import { isMeaningfulDocument7Finding } from '@/lib/erpReports/document7FindingCount';
import {
  createTimestamp,
  generateId,
} from '@/constants/inspectionSession/shared';
import { CAUSATIVE_AGENT_LABELS } from '@/constants/inspectionSession/doc7Catalog';
import type { SafetyQuarterlySummarySeed } from '@/types/backend';
import type { QuarterTarget, QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { AdminSiteSnapshot, InspectionSession, InspectionSite } from '@/types/inspectionSession';
import {
  buildQuarterlyTitleForPeriod,
  buildQuarterlyDefaultTitle,
  formatPeriodRangeLabel,
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

function normalizeFuturePlanKeyText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeFuturePlanHazardText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function buildQuarterlyFuturePlans(selectedSessions: InspectionSession[]) {
  const seenPlanKeys = new Set<string>();
  const futurePlans: QuarterlySummaryReport['futurePlans'] = [];

  sortSessionsByDateDesc(selectedSessions).forEach((session) => {
    session.document8Plans.forEach((item) => {
      const hazard = normalizeFuturePlanHazardText(item.hazard || item.processName);
      const countermeasure = item.countermeasure.trim();
      const note = item.note.trim();

      if (!hazard && !countermeasure) {
        return;
      }

      const dedupeKey = `${normalizeFuturePlanKeyText(hazard)}::${normalizeFuturePlanKeyText(countermeasure)}`;
      if (seenPlanKeys.has(dedupeKey)) {
        return;
      }

      seenPlanKeys.add(dedupeKey);
      futurePlans.push(
        createFutureProcessRiskPlan({
          ...item,
          processName: item.processName.trim(),
          hazard,
          countermeasure,
          note,
        }),
      );
    });
  });

  return futurePlans;
}

function buildQuarterlyCounters(counterMap: Map<string, number>): QuarterlyCounter[] {
  const entries = [...counterMap.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ko'))
    .map(([label, count]) => ({ label, count }));

  return collapseQuarterlyCounters(entries);
}

function collapseQuarterlyCounters(
  counters: QuarterlyCounter[],
  topN = 5,
  otherLabel = '기타',
) {
  if (counters.length <= topN) {
    return counters;
  }

  const head = counters.slice(0, topN).map((item) => ({ ...item }));
  const otherCount = counters
    .slice(topN)
    .reduce((total, item) => total + item.count, 0);

  if (otherCount <= 0) {
    return head;
  }

  const existingOtherIndex = head.findIndex((item) => item.label === otherLabel);
  if (existingOtherIndex >= 0) {
    head[existingOtherIndex] = {
      ...head[existingOtherIndex],
      count: head[existingOtherIndex].count + otherCount,
    };
    return head;
  }

  return [...head, { label: otherLabel, count: otherCount }];
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

function createQuarterlySiteSnapshot(site: InspectionSite): QuarterlySummaryReport['siteSnapshot'] {
  return {
    ...site.adminSiteSnapshot,
  };
}

function mergeQuarterlySiteSnapshot(
  primary: QuarterlySummaryReport['siteSnapshot'] | null | undefined,
  fallback: AdminSiteSnapshot,
) {
  return mergeAdminSiteSnapshots(primary ?? {}, fallback);
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

  const futurePlans = buildQuarterlyFuturePlans(selectedSessions);

  const accidentStats = buildQuarterlyCounters(accidentCounter);
  const causativeStats = buildQuarterlyCounters(causativeCounter);

  return {
    siteSnapshot: createQuarterlySiteSnapshot(site),
    generatedFromSessionIds: selectedSessionsByReportNumber.map((session) => session.id),
    lastCalculatedAt: createTimestamp(),
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

export function getQuarterlySessionReportTitle(session: InspectionSession) {
  if (session.meta.reportTitle?.trim()) {
    return session.meta.reportTitle.trim();
  }

  const guidanceDate = getSessionGuidanceDate(session);
  if (guidanceDate && Number.isFinite(session.reportNumber) && session.reportNumber > 0) {
    return `${guidanceDate} 보고서 ${session.reportNumber}`;
  }

  if (guidanceDate) {
    return guidanceDate;
  }

  if (Number.isFinite(session.reportNumber) && session.reportNumber > 0) {
    return `보고서 ${session.reportNumber}`;
  }

  return session.id;
}

export function buildLocalQuarterlySummarySeed(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  siteSessions: InspectionSession[],
  options?: {
    selectedReportKeys?: string[];
    explicitSelection?: boolean;
  },
): SafetyQuarterlySummarySeed {
  const normalizedSelectedKeys = Array.from(
    new Set((options?.selectedReportKeys ?? []).map((value) => value.trim()).filter(Boolean)),
  );
  const sourceSessions = [...siteSessions]
    .filter((session) => getSessionGuidanceDate(session))
    .filter((session) => {
      const guidanceDate = getSessionGuidanceDate(session);
      return guidanceDate >= report.periodStartDate && guidanceDate <= report.periodEndDate;
    })
    .sort((left, right) => {
      const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
      const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
      return rightTime - leftTime;
    });
  const selectedReportKeys =
    options?.explicitSelection || normalizedSelectedKeys.length > 0
      ? normalizedSelectedKeys
      : sourceSessions.map((session) => session.id);
  const derivedReport = syncQuarterlySummaryReportSources(
    report,
    site,
    siteSessions,
    selectedReportKeys,
    sourceSessions,
  );

  return {
    period_start_date: report.periodStartDate,
    period_end_date: report.periodEndDate,
    selected_report_keys: [...derivedReport.generatedFromSessionIds],
    source_reports: sourceSessions.map((session) => ({
      report_key: session.id,
      report_title: getQuarterlySessionReportTitle(session),
      guidance_date: getSessionGuidanceDate(session),
      drafter: session.meta.drafter || '',
      progress_rate: session.document2Overview.progressRate || '',
      finding_count: session.document7Findings.length,
      improved_count: session.document4FollowUps.filter((item) => item.result === 'completed')
        .length,
    })),
    last_calculated_at: createTimestamp(),
    implementation_rows: derivedReport.implementationRows.map((row) => ({
      session_id: row.sessionId,
      report_title: row.reportTitle,
      report_date: row.reportDate,
      report_number: row.reportNumber,
      drafter: row.drafter,
      progress_rate: row.progressRate,
      finding_count: row.findingCount,
      improved_count: row.improvedCount,
      note: row.note,
    })),
    accident_stats: derivedReport.accidentStats.map((item) => ({ ...item })),
    causative_stats: derivedReport.causativeStats.map((item) => ({ ...item })),
    future_plans: derivedReport.futurePlans.map((plan) => ({
      id: plan.id,
      process_name: plan.processName,
      hazard: plan.hazard,
      countermeasure: plan.countermeasure,
      note: plan.note,
      source: plan.source,
    })),
    major_measures: [...derivedReport.majorMeasures],
  };
}

export function applyQuarterlySummarySeed(
  report: QuarterlySummaryReport,
  seed: SafetyQuarterlySummarySeed,
): QuarterlySummaryReport {
  const noteBySessionId = new Map(
    report.implementationRows.map((row) => [row.sessionId, row.note]),
  );

  return {
    ...report,
    periodStartDate: seed.period_start_date || report.periodStartDate,
    periodEndDate: seed.period_end_date || report.periodEndDate,
    generatedFromSessionIds: [...seed.selected_report_keys],
    lastCalculatedAt: seed.last_calculated_at || report.lastCalculatedAt,
    implementationRows: seed.implementation_rows.map((row) => ({
      sessionId: row.session_id,
      reportTitle: row.report_title,
      reportDate: row.report_date,
      reportNumber: row.report_number,
      drafter: row.drafter,
      progressRate: row.progress_rate,
      findingCount: row.finding_count,
      improvedCount: row.improved_count,
      note: noteBySessionId.get(row.session_id) ?? row.note ?? '',
    })),
    accidentStats: seed.accident_stats.map((item) => ({ ...item })),
    causativeStats: seed.causative_stats.map((item) => ({ ...item })),
    futurePlans: seed.future_plans.map((item) =>
      createFutureProcessRiskPlan({
        id: item.id,
        processName: item.process_name,
        hazard: item.hazard,
        countermeasure: item.countermeasure,
        note: item.note,
        source: item.source === 'api' ? 'api' : 'manual',
      }),
    ),
    majorMeasures: [...seed.major_measures],
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
    dispatchCompleted: false,
    periodStartDate: '',
    periodEndDate: '',
    quarterKey: '',
    year: 0,
    quarter: 0,
    status: 'draft',
    controllerReview: null,
    dispatch: null,
    drafter,
    reviewer: '',
    approver: '',
    siteSnapshot: createQuarterlySiteSnapshot(site),
    generatedFromSessionIds: [],
    lastCalculatedAt: timestamp,
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
      reviewer: existing.reviewer || '',
      approver: existing.approver || '',
      controllerReview: existing.controllerReview ?? null,
      dispatch: existing.dispatch ?? null,
      siteSnapshot: mergeQuarterlySiteSnapshot(
        existing.siteSnapshot,
        createQuarterlySiteSnapshot(site),
      ),
      lastCalculatedAt: existing.lastCalculatedAt || existing.updatedAt || createTimestamp(),
      updatedAt: existing.updatedAt || createTimestamp(),
      accidentStats: collapseQuarterlyCounters(existing.accidentStats || []),
      causativeStats: collapseQuarterlyCounters(existing.causativeStats || []),
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
