'use client';

import {
  createMailboxDraft,
  deleteMailboxDraft,
  disconnectMailAccount,
  fetchMailAccounts,
  fetchMailboxDrafts,
  fetchMailProviderStatuses,
  fetchMailRecipientSuggestions,
  fetchMailThreadDetail,
  fetchMailThreads,
  patchMailThread,
  sendMail,
  startGoogleMailConnect,
  syncMail,
  updateMailboxDraft,
} from '@/lib/mail/apiClient';
import type {
  MailAccount,
  MailAttachmentPayload,
  MailboxBox,
  MailboxDraft,
  MailMessage,
  MailProviderStatus,
  MailRecipient,
  MailRecipientSuggestion,
  MailSyncSummary,
  MailThread,
  MailThreadDetail,
} from '@/types/mail';
import { readFileAsBase64 } from '@/lib/fileData';

export interface MailboxAttachmentDraft {
  contentType: string;
  dataBase64?: string;
  downloadUrl?: string;
  filename: string;
  file?: File;
  id: string;
  sizeBytes: number;
  source?: string | null;
}

export async function listMailAccounts(): Promise<MailAccount[]> {
  const response = await fetchMailAccounts();
  return response.rows;
}

export async function getMailProviderStatus(): Promise<MailProviderStatus[]> {
  const response = await fetchMailProviderStatuses();
  return response.rows;
}

export async function startMailConnect() {
  return startGoogleMailConnect();
}

export async function removeMailAccount(accountId: string) {
  await disconnectMailAccount(accountId);
}

export async function listMailThreads(input: {
  accountId?: string;
  box?: MailboxBox | string;
  headquarterId?: string;
  query?: string;
  reportKey?: string;
  siteId?: string;
}) {
  return fetchMailThreads(input);
}

export async function getMailThreadDetail(threadId: string): Promise<MailThreadDetail> {
  return fetchMailThreadDetail(threadId);
}

export async function updateMailThreadState(
  threadId: string,
  input: {
    isStarred?: boolean;
    isArchived?: boolean;
    isTrashed?: boolean;
    markRead?: boolean;
    restore?: boolean;
  },
): Promise<MailThread> {
  return patchMailThread(threadId, input);
}

export async function listRecipientSuggestions(input: {
  accountId?: string;
  query?: string;
}): Promise<MailRecipientSuggestion[]> {
  const response = await fetchMailRecipientSuggestions(input);
  return response.rows;
}

export async function listMailboxDrafts(input: {
  accountId?: string;
  query?: string;
} = {}): Promise<MailboxDraft[]> {
  const response = await fetchMailboxDrafts(input);
  return response.rows;
}

export async function createDraft(input: {
  accountId?: string;
  attachments?: MailAttachmentPayload[];
  body?: string;
  ccRecipients?: string[];
  headquarterId?: string;
  recipients?: string[];
  reportKeys?: string[];
  siteId?: string;
  subject?: string;
}) {
  return createMailboxDraft(input);
}

export async function updateDraft(
  draftId: string,
  input: {
    accountId?: string;
    attachments?: MailAttachmentPayload[];
    body?: string;
    ccRecipients?: string[];
    headquarterId?: string;
    recipients?: string[];
    reportKeys?: string[];
    siteId?: string;
    subject?: string;
  },
) {
  return updateMailboxDraft(draftId, input);
}

export async function removeDraft(draftId: string) {
  await deleteMailboxDraft(draftId);
}

export async function syncMailAccounts(): Promise<MailSyncSummary> {
  return syncMail();
}

export async function prepareInlineAttachments(
  attachments: MailboxAttachmentDraft[],
): Promise<MailAttachmentPayload[]> {
  const rows: MailAttachmentPayload[] = [];
  for (const attachment of attachments) {
    if (!attachment.file) {
      rows.push({
        contentType: attachment.contentType,
        dataBase64: attachment.dataBase64,
        downloadUrl: attachment.downloadUrl,
        filename: attachment.filename,
        sizeBytes: attachment.sizeBytes,
        source: attachment.source || 'draft',
      });
      continue;
    }
    rows.push({
      contentType: attachment.contentType,
      dataBase64: await readFileAsBase64(attachment.file),
      filename: attachment.filename,
      sizeBytes: attachment.sizeBytes,
      source: attachment.source || 'inline',
    });
  }
  return rows;
}

export async function sendMailboxMessage(input: {
  accountId: string;
  attachments?: MailboxAttachmentDraft[];
  body: string;
  cc?: MailRecipient[];
  forwardedFromMessageId?: string;
  fromName?: string;
  headquarterId?: string;
  recipients: MailRecipient[];
  replyToMessageId?: string;
  reportKeys?: string[];
  siteId?: string;
  subject: string;
  threadId?: string;
}): Promise<MailMessage> {
  return sendMail({
    accountId: input.accountId,
    attachments: await prepareInlineAttachments(input.attachments || []),
    body: input.body,
    cc: input.cc,
    forwardedFromMessageId: input.forwardedFromMessageId,
    fromName: input.fromName,
    headquarterId: input.headquarterId,
    reportKeys: input.reportKeys,
    replyToMessageId: input.replyToMessageId,
    siteId: input.siteId,
    subject: input.subject,
    threadId: input.threadId,
    to: input.recipients,
  });
}

export function buildRecipientObjects(emails: string[]): MailRecipient[] {
  return emails.map((email) => ({ email, name: null }));
}

export function normalizeThreadList(rows: MailThread[], activeBox: 'inbox' | 'sent') {
  if (activeBox === 'sent') {
    return rows.filter((row) => row.box === 'sent' || row.lastDirection === 'outgoing');
  }
  return rows.filter((row) => row.box === 'inbox' || row.lastDirection !== 'outgoing');
}
