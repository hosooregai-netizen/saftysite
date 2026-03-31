import {
  FUTURE_PROCESS_LIBRARY,
  createFutureProcessRiskPlan,
  getSessionProgress,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import type { QuarterTarget, QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import {
  QUARTERLY_SUMMARY_REPORT_KIND,
  buildQuarterlyReportKey,
  isDateWithinRange,
} from './shared';

const CAUSATIVE_AGENT_LABELS = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.left, row.right]),
).reduce<Record<CausativeAgentKey, string>>((accumulator, item) => {
  accumulator[item.key] = item.label;
  return accumulator;
}, {} as Record<CausativeAgentKey, string>);

function hasMeaningfulFinding(finding: InspectionSession['document7Findings'][number]) {
  return Boolean(
    finding.location ||
      finding.emphasis ||
      finding.improvementPlan ||
      finding.accidentType ||
      finding.causativeAgentKey ||
      finding.metadata,
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

function sortSessionsByDateDesc(sessions: InspectionSession[]) {
  return [...sessions].sort((left, right) => {
    const rightTime = new Date(right.meta.reportDate || right.updatedAt).getTime();
    const leftTime = new Date(left.meta.reportDate || left.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

function buildOverallComment(
  target: QuarterTarget,
  sessions: InspectionSession[],
  accidentStats: QuarterlyCounter[],
  causativeStats: QuarterlyCounter[],
) {
  if (sessions.length === 0) {
    return `${target.label}에는 아직 집계할 기술지도 보고서가 없습니다. 대상 보고서를 선택한 뒤 다시 계산하면 종합 총평과 통계가 자동으로 채워집니다.`;
  }

  const completedReports = sessions.filter(
    (session) => getSessionProgress(session).percentage >= 100,
  ).length;
  const topAccident = accidentStats[0]?.label || '주요 재해유형 미확정';
  const topCause = causativeStats[0]?.label || '주요 기인물 미확정';

  return [
    `${target.label}에는 총 ${sessions.length}건의 기술지도 보고서가 반영되었습니다.`,
    `완료 처리된 보고서는 ${completedReports}건이며 가장 자주 확인된 재해유형은 ${topAccident}입니다.`,
    `주요 기인물은 ${topCause}로 집계되어 해당 영역을 중심으로 후속 관리가 필요합니다.`,
  ].join(' ');
}

function createQuarterlySiteSnapshot(site: InspectionSite): QuarterlySummaryReport['siteSnapshot'] {
  return {
    ...site.adminSiteSnapshot,
  };
}

export function getQuarterlySourceSessions(
  siteSessions: InspectionSession[],
  target: Pick<QuarterTarget, 'startDate' | 'endDate'>,
) {
  return [...siteSessions]
    .filter((session) =>
      isDateWithinRange(session.meta.reportDate, target.startDate, target.endDate),
    )
    .sort((left, right) => left.meta.reportDate.localeCompare(right.meta.reportDate));
}

function buildDerivedQuarterlyContent(
  site: InspectionSite,
  siteSessions: InspectionSession[],
  target: QuarterTarget,
  selectedSessionIds: string[],
  availableSourceSessions?: InspectionSession[],
) {
  const quarterSessions = availableSourceSessions ?? getQuarterlySourceSessions(siteSessions, target);
  const selectedIdSet = new Set(selectedSessionIds);
  const selectedSessions =
    selectedIdSet.size > 0
      ? quarterSessions.filter((session) => selectedIdSet.has(session.id))
      : [];
  const accidentCounter = new Map<string, number>();
  const causativeCounter = new Map<string, number>();
  const majorMeasures: string[] = [];

  selectedSessions.forEach((session) => {
    session.document7Findings.filter(hasMeaningfulFinding).forEach((finding) => {
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

  const implementationRows = selectedSessions.map((session) => ({
    sessionId: session.id,
    reportTitle: getSessionTitle(session),
    reportDate: session.meta.reportDate,
    reportNumber: session.reportNumber,
    drafter: session.meta.drafter,
    progressRate: session.document2Overview.progressRate || '',
    findingCount: session.document7Findings.filter(hasMeaningfulFinding).length,
    improvedCount: session.document4FollowUps.filter((item) => item.result === 'implemented')
      .length,
  }));

  const latestSelectedSession =
    sortSessionsByDateDesc(selectedSessions)[0] ||
    sortSessionsByDateDesc(quarterSessions)[0] ||
    sortSessionsByDateDesc(siteSessions)[0] ||
    null;

  const futurePlans =
    latestSelectedSession?.document8Plans
      .filter((item) => item.processName || item.hazard || item.countermeasure || item.note)
      .map((item) => createFutureProcessRiskPlan(item)) ||
    FUTURE_PROCESS_LIBRARY.slice(0, 3).map((item) =>
      createFutureProcessRiskPlan({
        processName: item.processName,
        hazard: item.hazard,
        countermeasure: item.countermeasure,
        source: 'api',
      }),
    );

  const accidentStats = takeTopCounters(accidentCounter);
  const causativeStats = takeTopCounters(causativeCounter);

  return {
    siteSnapshot: createQuarterlySiteSnapshot(site),
    generatedFromSessionIds: selectedSessions.map((session) => session.id),
    lastCalculatedAt: createTimestamp(),
    overallComment: buildOverallComment(
      target,
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
  target: QuarterTarget,
  selectedSessionIds: string[],
  availableSourceSessions?: InspectionSession[],
): QuarterlySummaryReport {
  const derived = buildDerivedQuarterlyContent(
    site,
    siteSessions,
    target,
    selectedSessionIds,
    availableSourceSessions,
  );

  return {
    ...report,
    title: `${target.label} 종합보고서`,
    ...derived,
  };
}

export function buildInitialQuarterlySummaryReport(
  site: InspectionSite,
  siteSessions: InspectionSession[],
  target: QuarterTarget,
  drafter: string,
  existing?: QuarterlySummaryReport | null,
): QuarterlySummaryReport {
  if (existing) {
    return {
      ...existing,
      title: `${target.label} 종합보고서`,
      drafter: existing.drafter || drafter,
      siteSnapshot:
        existing.siteSnapshot && Object.values(existing.siteSnapshot).some(Boolean)
          ? existing.siteSnapshot
          : createQuarterlySiteSnapshot(site),
      lastCalculatedAt: existing.lastCalculatedAt || existing.updatedAt || createTimestamp(),
      updatedAt: existing.updatedAt || createTimestamp(),
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

  const timestamp = createTimestamp();
  const quarterSessions = getQuarterlySourceSessions(siteSessions, target);
  const derived = buildDerivedQuarterlyContent(
    site,
    siteSessions,
    target,
    quarterSessions.map((session) => session.id),
  );

  return {
    id: buildQuarterlyReportKey(site.id, target.quarterKey),
    siteId: site.id,
    title: `${target.label} 종합보고서`,
    reportKind: QUARTERLY_SUMMARY_REPORT_KIND,
    quarterKey: target.quarterKey,
    year: target.year,
    quarter: target.quarter,
    status: 'draft',
    drafter,
    ...derived,
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
