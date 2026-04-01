import {
  getSessionGuidanceDate,
  getSessionProgress,
  getSessionSiteKey,
} from '@/constants/inspectionSession';
import { CAUSATIVE_AGENT_LABELS } from '@/constants/inspectionSession/doc7Catalog';
import {
  buildCountEntries,
  collapseChartEntriesToTopOther,
  hasFindingContent,
} from '@/components/session/workspace/utils';

const DOC5_CHART_TOP_N = 5;
import {
  getDoc7ReferenceMaterialsForReportDate,
  getMeasurementTemplatesForReportDate,
} from '@/lib/safetyApiMappers/masterData';
import type { SafetyMasterData } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';

export function buildInspectionSessionDerivedData(
  masterData: SafetyMasterData,
  session: InspectionSession,
  sessions: InspectionSession[],
) {
  const siteSessions = sessions
    .filter((item) => getSessionSiteKey(item) === getSessionSiteKey(session))
    .sort((left, right) => left.reportNumber - right.reportNumber);
  const currentFindings = session.document7Findings.filter((item) => hasFindingContent(item));
  const cumulativeFindings = siteSessions
    .filter((item) => item.reportNumber <= session.reportNumber)
    .flatMap((item) => item.document7Findings.filter((finding) => hasFindingContent(finding)));

  return {
    currentAccidentEntries: collapseChartEntriesToTopOther(
      buildCountEntries(currentFindings, (item) => item.accidentType),
      DOC5_CHART_TOP_N,
    ),
    currentAgentEntries: collapseChartEntriesToTopOther(
      buildCountEntries(currentFindings, (item) =>
        item.causativeAgentKey
          ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey
          : '',
      ),
      DOC5_CHART_TOP_N,
    ),
    cumulativeAccidentEntries: collapseChartEntriesToTopOther(
      buildCountEntries(cumulativeFindings, (item) => item.accidentType),
      DOC5_CHART_TOP_N,
    ),
    cumulativeAgentEntries: collapseChartEntriesToTopOther(
      buildCountEntries(cumulativeFindings, (item) =>
        item.causativeAgentKey
          ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey
          : '',
      ),
      DOC5_CHART_TOP_N,
    ),
    measurementTemplates: getMeasurementTemplatesForReportDate(
      masterData,
      getSessionGuidanceDate(session),
    ),
    doc7ReferenceMaterials: getDoc7ReferenceMaterialsForReportDate(
      masterData,
      getSessionGuidanceDate(session),
    ),
    progress: getSessionProgress(session),
    siteSessions,
  };
}

