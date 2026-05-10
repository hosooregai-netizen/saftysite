import {
  createAncErpApiClient,
  getDefaultAncErpApiBaseUrl,
} from "../../packages/api-client/src";

function createSafetyManagementPlanApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ??
      getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createSafetyManagementPlanDraftAction(
  projectId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).createProjectSafetyManagementPlan(projectId, payload);
}

export async function saveSafetyManagementPlanSectionDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).saveSafetyManagementPlanSection(planId, payload);
}

export async function regenerateSafetyManagementPlanSectionDraft(
  planId: string,
  sectionKey: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).regenerateSafetyManagementPlanSection(planId, sectionKey);
}

export async function refreshSafetyManagementPlanLinkedDataDraft(
  planId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).refreshSafetyManagementPlanLinkedData(planId);
}

export async function exportSafetyManagementPlanDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).exportSafetyManagementPlan(planId, payload);
}

export async function validateSafetyManagementPlanDraft(
  planId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).validateSafetyManagementPlan(planId);
}

export async function createSafetyManagementWorkTypeDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).createSafetyManagementWorkType(planId, payload);
}

export async function createSafetyManagementRiskDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).createSafetyManagementRisk(planId, payload);
}

export async function generateSafetyManagementRisksFromWorkTypesDraft(
  planId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).generateSafetyManagementRisksFromWorkTypes(planId);
}

export async function importSafetyManagementRisksFromChecklistDraft(
  planId: string,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).importSafetyManagementRisksFromChecklist(planId);
}

export async function updateSafetyManagementOrganizationDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).updateSafetyManagementPlanOrganization(planId, payload);
}

export async function updateSafetyManagementEducationDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).updateSafetyManagementPlanEducation(planId, payload);
}

export async function updateSafetyManagementEmergencyDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).updateSafetyManagementPlanEmergency(planId, payload);
}

export async function linkSafetyManagementAttachmentDraft(
  planId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createSafetyManagementPlanApi(fetchImpl).linkSafetyManagementPlanAttachment(planId, payload);
}
