"use client";

import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";

function createBrowserApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl: fetchImpl ?? fetch,
  });
}

export async function uploadWebhardFileDraft(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).uploadFile(payload);
}

export async function createWebhardFolderDraft(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).createFolder(payload);
}

export async function updateWebhardFileDraft(
  fileId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).updateFile(fileId, payload);
}

export async function restoreWebhardFileDraft(fileId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).restoreFile(fileId);
}

export async function addWebhardFileVersionDraft(
  fileId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).addFileVersion(fileId, payload);
}

export async function createWebhardFileLinkDraft(
  fileId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).createFileLink(fileId, payload);
}

export async function classifyWebhardFileDraft(fileId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).classifyFile(fileId);
}

export async function createWebhardShareLinkDraft(payload: Record<string, unknown>, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).createShareLink(payload);
}

export async function revokeWebhardShareLinkDraft(shareLinkId: string, fetchImpl?: typeof fetch) {
  return createBrowserApiClient(fetchImpl).revokeShareLink(shareLinkId);
}

export async function getMailAttachmentSaveSuggestionsDraft(
  messageId: string,
  projectId: string,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).getMailAttachmentSaveSuggestions(messageId, projectId);
}

export async function saveMailAttachmentToWebhardDraft(
  messageId: string,
  payload: Record<string, unknown>,
  fetchImpl?: typeof fetch,
) {
  return createBrowserApiClient(fetchImpl).saveMailAttachmentToWebhard(messageId, payload);
}
