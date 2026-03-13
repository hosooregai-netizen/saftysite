import 'server-only';

import { getSessionSiteTitle, getSessionTitle } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';

export interface InspectionWordData {
  meta: {
    generatedAt: string;
    sessionId: string;
    reportNumber: number;
    title: string;
    siteTitle: string;
  };
  cover: InspectionSession['cover'];
  siteOverview: InspectionSession['siteOverview'];
  previousGuidanceItems: InspectionSession['previousGuidanceItems'];
  currentHazards: InspectionSession['currentHazards'];
  futureProcessRisks: InspectionSession['futureProcessRisks'];
  supportItems: InspectionSession['supportItems'];
}

export function mapInspectionSessionToWordData(
  session: InspectionSession
): InspectionWordData {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      sessionId: session.id,
      reportNumber: session.reportNumber,
      title: getSessionTitle(session),
      siteTitle: getSessionSiteTitle(session),
    },
    cover: session.cover,
    siteOverview: session.siteOverview,
    previousGuidanceItems: session.previousGuidanceItems,
    currentHazards: session.currentHazards,
    futureProcessRisks: session.futureProcessRisks,
    supportItems: session.supportItems,
  };
}

