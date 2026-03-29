import {
  FUTURE_PROCESS_LIBRARY,
  createFutureProcessRiskPlan,
  getSessionProgress,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import type { QuarterTarget, QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { CausativeAgentKey } from '@/types/siteOverview';
import { buildQuarterlyReportKey, isDateWithinRange, QUARTERLY_SUMMARY_REPORT_KIND } from './shared';

const CAUSATIVE_AGENT_LABELS = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right])
).reduce<Record<CausativeAgentKey, string>>((accumulator, item) => {
  accumulator[item.key] = item.label;
  return accumulator;
}, {} as Record<CausativeAgentKey, string>);

function hasMeaningfulFinding(
  finding: InspectionSession['document7Findings'][number]
) {
  return Boolean(
    finding.location ||
      finding.emphasis ||
      finding.improvementPlan ||
      finding.accidentType ||
      finding.causativeAgentKey ||
      finding.metadata
  );
}

function normalizeMeasureText(value: string) {
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .join(' ');
}

function takeTopCounters(counterMap: Map<string, number>, limit = 6): QuarterlyCounter[] {
  return [...counterMap.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ko'))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function getQuarterSessions(
  siteSessions: InspectionSession[],
  target: Pick<QuarterTarget, 'startDate' | 'endDate'>
) {
  return [...siteSessions]
    .filter((session) =>
      isDateWithinRange(session.meta.reportDate, target.startDate, target.endDate)
    )
    .sort((left, right) => left.meta.reportDate.localeCompare(right.meta.reportDate));
}

function buildOverallComment(
  target: QuarterTarget,
  sessions: InspectionSession[],
  accidentStats: QuarterlyCounter[],
  causativeStats: QuarterlyCounter[]
) {
  if (sessions.length === 0) {
    return `${target.label}에는 아직 수집된 기술지도 보고서가 없습니다. 해당 분기 기술지도 보고서가 작성되면 통계와 총평이 자동으로 채워집니다.`;
  }

  const completedReports = sessions.filter(
    (session) => getSessionProgress(session).percentage >= 100
  ).length;
  const topAccident = accidentStats[0]?.label || '주요 재해유형 미확인';
  const topCause = causativeStats[0]?.label || '주요 기인물 미확인';

  return [
    `${target.label}에는 총 ${sessions.length}회의 기술지도가 누적되었습니다.`,
    `완료 수준 보고서는 ${completedReports}건이며, 가장 자주 확인된 재해유형은 ${topAccident}입니다.`,
    `주요 기인물은 ${topCause}로 집계되어 해당 영역 중심의 후속 관리가 필요합니다.`,
  ].join(' ');
}

export function buildInitialQuarterlySummaryReport(
  site: InspectionSite,
  siteSessions: InspectionSession[],
  target: QuarterTarget,
  drafter: string,
  existing?: QuarterlySummaryReport | null
): QuarterlySummaryReport {
  if (existing) {
    return {
      ...existing,
      title: `${target.label} 종합보고서`,
      drafter: existing.drafter || drafter,
      updatedAt: existing.updatedAt || createTimestamp(),
    };
  }

  const timestamp = createTimestamp();
  const quarterSessions = getQuarterSessions(siteSessions, target);
  const accidentCounter = new Map<string, number>();
  const causativeCounter = new Map<string, number>();
  const majorMeasures: string[] = [];

  quarterSessions.forEach((session) => {
    session.document7Findings.filter(hasMeaningfulFinding).forEach((finding) => {
      const accidentLabel = finding.accidentType || '기타';
      accidentCounter.set(accidentLabel, (accidentCounter.get(accidentLabel) || 0) + 1);

      const causativeLabel = finding.causativeAgentKey
        ? CAUSATIVE_AGENT_LABELS[finding.causativeAgentKey]
        : '기타 위험요인';
      causativeCounter.set(causativeLabel, (causativeCounter.get(causativeLabel) || 0) + 1);

      const normalizedMeasure = normalizeMeasureText(finding.improvementPlan);
      if (normalizedMeasure && !majorMeasures.includes(normalizedMeasure)) {
        majorMeasures.push(normalizedMeasure);
      }
    });
  });

  const implementationRows = quarterSessions.map((session) => ({
    sessionId: session.id,
    reportTitle: getSessionTitle(session),
    reportDate: session.meta.reportDate,
    reportNumber: session.reportNumber,
    drafter: session.meta.drafter,
    progressRate: session.document2Overview.progressRate || '',
    findingCount: session.document7Findings.filter(hasMeaningfulFinding).length,
    improvedCount: session.document4FollowUps.filter((item) => item.result === 'implemented').length,
  }));

  const latestSession =
    [...quarterSessions]
      .sort((left, right) => right.meta.reportDate.localeCompare(left.meta.reportDate))[0] ||
    [...siteSessions]
      .sort((left, right) => right.meta.reportDate.localeCompare(left.meta.reportDate))[0] ||
    null;

  const futurePlans =
    latestSession?.document8Plans.filter(
      (item) => item.processName || item.hazard || item.countermeasure || item.note
    ).map((item) => createFutureProcessRiskPlan(item)) ||
    FUTURE_PROCESS_LIBRARY.slice(0, 3).map((item) =>
      createFutureProcessRiskPlan({
        processName: item.processName,
        hazard: item.hazard,
        countermeasure: item.countermeasure,
        source: 'api',
      })
    );

  const accidentStats = takeTopCounters(accidentCounter);
  const causativeStats = takeTopCounters(causativeCounter);

  const nextReport: QuarterlySummaryReport = {
    id: buildQuarterlyReportKey(site.id, target.quarterKey),
    siteId: site.id,
    title: `${target.label} 종합보고서`,
    reportKind: QUARTERLY_SUMMARY_REPORT_KIND,
    quarterKey: target.quarterKey,
    year: target.year,
    quarter: target.quarter,
    status: 'draft',
    drafter,
    generatedFromSessionIds: quarterSessions.map((session) => session.id),
    overallComment: buildOverallComment(target, quarterSessions, accidentStats, causativeStats),
    implementationRows,
    accidentStats,
    causativeStats,
    futurePlans,
    majorMeasures: majorMeasures.slice(0, 5),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return nextReport;
}
