import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";

function createAdminApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function createAdminUserAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).createAdminUser(payload);
}

export async function updateAdminUserAction(userId: string, payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).updateAdminUser(userId, payload);
}

export async function createAdminRoleAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).createAdminRole(payload);
}

export async function updateAdminRolePermissionsAction(
  roleId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).updateAdminRolePermissions(roleId, payload);
}

export async function updateAdminCompanyProfileAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).updateAdminCompanyProfile(payload);
}

export async function uploadAdminLogoAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).uploadAdminCompanyLogo(payload);
}

export async function uploadAdminSealAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).uploadAdminCompanySeal(payload);
}

export async function createAdminDocumentTemplateAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).createAdminDocumentTemplate(payload);
}

export async function updateAdminDocumentTemplateAction(
  templateId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).updateAdminDocumentTemplate(templateId, payload);
}

export async function createAdminTemplateVersionAction(
  templateId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).createAdminTemplateVersion(templateId, payload);
}

export async function extractAdminTemplateVariablesAction(versionId: string, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).extractAdminTemplateVariables(versionId);
}

export async function previewAdminTemplateVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).previewAdminTemplateVersion(versionId, payload);
}

export async function validateAdminTemplateVersionAction(versionId: string, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).validateAdminTemplateVersion(versionId);
}

export async function reviewAdminTemplateVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).reviewAdminTemplateVersion(versionId, payload);
}

export async function publishAdminTemplateVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).publishAdminTemplateVersion(versionId, payload);
}

export async function rollbackAdminTemplateVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).rollbackAdminTemplateVersion(versionId, payload);
}

export async function publishAdminChecklistTemplateAction(templateId: string, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).publishAdminChecklistTemplate(templateId);
}

export async function createAdminPhraseAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).createAdminPhrase(payload);
}

export async function publishAdminPhraseAction(phraseId: string, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).publishAdminPhrase(phraseId);
}

export async function createAdminLegalClauseAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).createAdminLegalClause(payload);
}

export async function updateAdminLegalClauseAction(
  clauseId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).updateAdminLegalClause(clauseId, payload);
}

export async function publishAdminLegalClauseAction(
  clauseId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).publishAdminLegalClause(clauseId, payload);
}

export async function createAdminPromptAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).createAdminPrompt(payload);
}

export async function updateAdminPromptAction(promptId: string, payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).updateAdminPrompt(promptId, payload);
}

export async function createAdminPromptVersionAction(
  promptId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).createAdminPromptVersion(promptId, payload);
}

export async function runAdminPromptVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).runAdminPromptVersion(versionId, payload);
}

export async function runAdminPromptTestCasesAction(versionId: string, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).runAdminPromptTestCases(versionId);
}

export async function publishAdminPromptVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).publishAdminPromptVersion(versionId, payload);
}

export async function rollbackAdminPromptVersionAction(
  versionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).rollbackAdminPromptVersion(versionId, payload);
}

export async function createAdminPromptTestCaseAction(
  promptId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).createAdminPromptTestCase(promptId, payload);
}

export async function updateAdminWebhardPolicyAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createAdminApi(fetchImpl).updateAdminWebhardPolicy(payload);
}

export async function updateAdminMailTemplateAction(
  templateId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).updateAdminMailTemplate(templateId, payload);
}

export async function updateAdminApprovalTemplateAction(
  templateId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).updateAdminApprovalTemplate(templateId, payload);
}

export async function updateAdminSignatureAssetAction(
  assetId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createAdminApi(fetchImpl).updateAdminSignatureAsset(assetId, payload);
}
