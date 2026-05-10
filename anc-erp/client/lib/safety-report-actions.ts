import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";

function createSafetyReportApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createSafetyReportDraftAction(
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).createSafetyReportDraft(payload);
}

export async function generateSafetyReportDraftAction(
  documentId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).generateSafetyReport(documentId);
}

export async function saveSafetyReportSectionDraft(
  documentId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).saveSafetyReportSection(documentId, payload);
}

export async function regenerateSafetyReportSectionDraft(
  documentId: string,
  sectionKey: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).regenerateSafetyReportSection(documentId, sectionKey);
}

export async function refreshSafetyReportLinkedDataDraft(
  documentId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).refreshSafetyReportLinkedData(documentId);
}

export async function getSafetyReportRequiredDataAction(
  inspectionRoundId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).getSafetyReportRequiredData(inspectionRoundId);
}

export async function getSafetyReportOwnerBranchesAction(
  inspectionRoundId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).getSafetyReportOwnerReportBranches(inspectionRoundId);
}

export async function exportSafetyReportDraft(
  documentId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).exportSafetyReport(documentId, payload);
}

export async function markSafetyReportSubmittedDraft(
  documentId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).markSafetyReportSubmitted(documentId, payload);
}

export async function linkSafetyReportOwnerTaskDraft(
  documentId: string,
  payload: { ownerReportTaskId: string },
  fetchImpl?: typeof fetch,
) {
  return createSafetyReportApi(fetchImpl).linkSafetyReportOwnerTask(documentId, payload);
}
