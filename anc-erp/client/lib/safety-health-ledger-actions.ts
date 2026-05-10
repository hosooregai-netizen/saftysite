import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";

function createSafetyHealthLedgerApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createSafetyHealthLedgerDraftAction(
  projectId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).createProjectSafetyHealthLedger(projectId, payload);
}

export async function saveSafetyHealthLedgerSectionDraft(
  ledgerId: string,
  sectionKey: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).saveSafetyHealthLedgerSection(ledgerId, sectionKey, payload);
}

export async function regenerateSafetyHealthLedgerSectionDraft(
  ledgerId: string,
  sectionKey: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).regenerateSafetyHealthLedgerSection(ledgerId, sectionKey);
}

export async function validateSafetyHealthLedgerDraft(
  ledgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).validateSafetyHealthLedger(ledgerId);
}

export async function exportSafetyHealthLedgerDraft(
  ledgerId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).exportSafetyHealthLedger(ledgerId, payload);
}

export async function importSafetyHealthLedgerRisksFromPlanDraft(
  ledgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).importSafetyHealthLedgerRisksFromPlan(ledgerId);
}

export async function detectSafetyHealthLedgerRecurrenceDraft(
  ledgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).detectSafetyHealthLedgerRecurrence(ledgerId);
}

export async function createSafetyHealthLedgerRiskDraft(
  ledgerId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).createSafetyHealthLedgerRisk(ledgerId, payload);
}

export async function createSafetyHealthLedgerMeasureDraft(
  ledgerId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).createSafetyHealthLedgerMeasure(ledgerId, payload);
}

export async function syncSafetyHealthLedgerInspectionHistoryDraft(
  ledgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).syncSafetyHealthLedgerInspectionHistory(ledgerId);
}

export async function syncSafetyHealthLedgerFindingHistoryDraft(
  ledgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).syncSafetyHealthLedgerFindingHistory(ledgerId);
}

export async function syncSafetyHealthLedgerSafetyCostHistoryDraft(
  ledgerId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).syncSafetyHealthLedgerSafetyCostHistory(ledgerId);
}

export async function linkSafetyHealthLedgerAttachmentDraft(
  ledgerId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyHealthLedgerApi(fetchImpl).linkSafetyHealthLedgerAttachment(ledgerId, payload);
}
