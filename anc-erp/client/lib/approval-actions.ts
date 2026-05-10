import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";

function createApprovalApi(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function requestDocumentApprovalAction(
  documentId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).requestDocumentApproval(documentId, payload);
}

export async function approveDocumentStepAction(
  stepId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).approveApprovalStep(stepId, payload);
}

export async function rejectDocumentStepAction(
  stepId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).rejectApprovalStep(stepId, payload);
}

export async function requestDocumentStepChangesAction(
  stepId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).requestApprovalStepChanges(stepId, payload);
}

export async function completeDocumentSignatureTaskAction(
  taskId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).completeSignatureTask(taskId, payload);
}

export async function waiveDocumentSignatureTaskAction(
  taskId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).waiveSignatureTask(taskId, payload);
}

export async function uploadSignedDocumentFileAction(
  documentId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).uploadSignedDocumentFile(documentId, payload);
}

export async function createSubmissionPackageAction(
  documentId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).createSubmissionPackage(documentId, payload);
}

export async function finalizeSubmissionPackageAction(
  packageId: string,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).finalizeSubmissionPackage(packageId);
}

export async function validateSubmissionPackageAction(
  packageId: string,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).validateSubmissionPackage(packageId);
}

export async function createProjectSubmissionAction(
  projectId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).createProjectSubmission(projectId, payload);
}

export async function sendSubmissionMailAction(
  submissionId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).sendSubmissionMail(submissionId, payload);
}

export async function markManualSubmissionAction(
  submissionId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).markSubmissionManualSubmitted(submissionId, payload);
}

export async function confirmSubmissionOwnerReceiptAction(
  submissionId: string,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).confirmSubmissionOwnerReceipt(submissionId);
}

export async function requestSubmissionRevisionAction(
  submissionId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).requestSubmissionRevision(submissionId, payload);
}

export async function archiveSubmissionAction(
  submissionId: string,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).archiveSubmission(submissionId);
}

export async function updateApprovalTemplateAction(
  templateId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).updateApprovalTemplate(templateId, payload);
}

export async function publishApprovalTemplateAction(
  templateId: string,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).publishApprovalTemplate(templateId);
}

export async function updateSignatureAssetAction(
  assetId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createApprovalApi(fetchImpl).updateSignatureAsset(assetId, payload);
}
