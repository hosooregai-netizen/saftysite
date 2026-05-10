import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";

function createSafetyCostApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createRoundSafetyCostUsageDraft(
  inspectionRoundId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).createInspectionRoundSafetyCostUsage(
    inspectionRoundId,
    payload,
  );
}

export async function updateSafetyCostUsageDraft(
  usageId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).updateSafetyCostUsage(usageId, payload);
}

export async function calculateSafetyCostRateDraft(
  usageId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).calculateSafetyCostRate(usageId);
}

export async function validateSafetyCostUsageDraft(
  usageId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).validateSafetyCostUsage(usageId);
}

export async function uploadSafetyCostEvidenceDraft(
  usageId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).uploadSafetyCostEvidence(usageId, payload);
}

export async function generateSafetyCostCommentDraft(
  usageId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).generateSafetyCostComment(usageId);
}

export async function reviewSafetyCostUsageDraft(
  usageId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).reviewSafetyCostUsage(usageId, payload);
}

export async function confirmSafetyCostUsageDraft(
  usageId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).confirmSafetyCostUsage(usageId, payload);
}

export async function syncSafetyCostUsageDraft(
  usageId: string,
  payload: { documentId: string },
  fetchImpl?: typeof fetch,
) {
  return createSafetyCostApi(fetchImpl).syncSafetyCostUsageToReport(
    usageId,
    payload,
  );
}
