"use client";

import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";

function createBrowserApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl: fetchImpl ?? fetch,
  });
}

export async function createGuestMailAccountDraft(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).createGuestMailAccount(payload);
}

export async function startGoogleMailOAuthDraft(fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).startGoogleMailOAuth();
}

export async function syncMailAccountDraft(accountId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).syncMailAccount(accountId);
}

export async function createMailDraftAction(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).createMailDraft(payload);
}

export async function updateMailDraftAction(
  draftId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).updateMailDraft(draftId, payload);
}

export async function generateMailDraftAction(draftId: string, payload: Record<string, unknown> = {}, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).generateMailDraft(draftId, payload);
}

export async function validateMailDraftAction(draftId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).validateMailDraft(draftId);
}

export async function sendMailDraftAction(draftId: string, payload: Record<string, unknown> = {}, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).sendMailDraft(draftId, payload);
}

export async function markMailMessageReadDraft(messageId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).markMailMessageRead(messageId);
}

export async function classifyMailMessageDraft(messageId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).classifyMailMessage(messageId);
}

export async function linkMailMessageEntityDraft(
  messageId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).linkMailMessageEntity(messageId, payload);
}

export async function saveMailboxAttachmentToWebhardDraft(attachmentId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).saveMailboxAttachmentToWebhard(attachmentId);
}

export async function saveMailboxAttachmentsBulkToWebhardDraft(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).saveMailboxAttachmentsBulkToWebhard(payload);
}

export async function linkMailboxAttachmentFileDraft(
  attachmentId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).linkMailboxAttachmentFile(attachmentId, payload);
}

export async function createSubmissionMailDraftAction(
  documentId: string,
  payload: Record<string, unknown> = {},
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).draftDocumentSubmissionMail(documentId, payload);
}

export async function createMaterialRequestMailDraftAction(projectId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).draftMaterialRequestMail(projectId);
}

export async function createScheduleCoordinationMailDraftAction(
  inspectionRoundId: string,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).draftScheduleCoordinationMail(inspectionRoundId);
}

export async function createContractSendMailDraftAction(contractId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).draftContractSendMail(contractId);
}

export async function createEstimateSendMailDraftAction(estimateId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).draftEstimateSendMail(estimateId);
}

export async function createMailTemplateDraft(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).createMailTemplate(payload);
}

export async function updateMailTemplateDraft(
  templateId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).updateMailTemplate(templateId, payload);
}

export async function updateMailSignatureDraft(
  signatureId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).updateMailSignature(signatureId, payload);
}
