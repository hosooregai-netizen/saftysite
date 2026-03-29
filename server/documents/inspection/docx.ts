import 'server-only';

import type { InspectionSession } from '@/types/inspectionSession';
import { buildWordDocumentArchive } from '@/server/documents/sharedDocx';
import { fileNameForSession } from './format';
import { buildInspectionDocumentBody } from './body';
import { createInspectionDocContext } from './media';
import { buildDocumentXml } from './ooxml';

export async function buildInspectionWordDocument(
  session: InspectionSession,
  siteSessions: InspectionSession[]
) {
  const context = createInspectionDocContext();
  return buildWordDocumentArchive({
    assets: context.assets,
    body: buildDocumentXml(buildInspectionDocumentBody(session, siteSessions, context)),
    filename: fileNameForSession(session),
    title: '건설재해예방 기술지도결과보고서',
  });
}
