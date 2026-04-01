import {
  getSessionGuidanceDate,
  getSessionProgress,
  getSessionSiteKey,
} from '@/constants/inspectionSession';
import { CAUSATIVE_AGENT_LABELS } from '@/constants/inspectionSession/doc7Catalog';
import { buildCountEntries, hasFindingContent } from '@/components/session/workspace/utils';
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
    currentAccidentEntries: buildCountEntries(currentFindings, (item) => item.accidentType),
    currentAgentEntries: buildCountEntries(currentFindings, (item) =>
      item.causativeAgentKey
        ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey
        : '',
    ),
    cumulativeAccidentEntries: buildCountEntries(
      cumulativeFindings,
      (item) => item.accidentType,
    ),
    cumulativeAgentEntries: buildCountEntries(cumulativeFindings, (item) =>
      item.causativeAgentKey
        ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey
        : '',
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

