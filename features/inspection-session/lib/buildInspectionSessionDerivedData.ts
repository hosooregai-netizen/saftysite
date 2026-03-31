import {
  LEGAL_REFERENCE_LIBRARY,
  getSessionProgress,
  getSessionSiteKey,
} from '@/constants/inspectionSession';
import { CAUSATIVE_AGENT_LABELS } from '@/constants/inspectionSession/doc7Catalog';
import { buildCountEntries, hasFindingContent } from '@/components/session/workspace/utils';
import { getMeasurementTemplatesForReportDate } from '@/lib/safetyApiMappers/masterData';
import type { SafetyMasterData } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';

export function buildInspectionSessionDerivedData(
  masterData: SafetyMasterData,
  session: InspectionSession,
  sessions: InspectionSession[],
) {
  const legalReferenceLibrary =
    masterData.legalReferences.length > 0 ? masterData.legalReferences : LEGAL_REFERENCE_LIBRARY;
  const siteSessions = sessions
    .filter((item) => getSessionSiteKey(item) === getSessionSiteKey(session))
    .sort((left, right) => left.reportNumber - right.reportNumber);
  const currentFindings = session.document7Findings.filter((item) => hasFindingContent(item));
  const cumulativeFindings = siteSessions
    .filter((item) => item.reportNumber <= session.reportNumber)
    .flatMap((item) => item.document7Findings.filter((finding) => hasFindingContent(finding)));

  return {
    correctionResultOptions: masterData.correctionResultOptions,
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
    legalReferenceLibrary,
    measurementTemplates: getMeasurementTemplatesForReportDate(
      masterData,
      session.meta.reportDate,
    ),
    progress: getSessionProgress(session),
    siteSessions,
  };
}

