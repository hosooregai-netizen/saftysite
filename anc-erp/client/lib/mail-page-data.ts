import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  MailAccount,
  MailDraft,
  MailMessage,
  MailMessageDetailResponse,
  MailSignature,
  MailSyncJob,
  MailTemplate,
  MailThreadDetailResponse,
  MailThreadListItem,
} from "../../packages/contracts/src";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

const emptyThreadList: MailThreadListItem[] = [];
const emptyAccounts: MailAccount[] = [];
const emptyTemplates: MailTemplate[] = [];
const emptySignatures: MailSignature[] = [];
const emptyJobs: MailSyncJob[] = [];

function buildEmptyDraft(overrides: Partial<MailDraft> = {}): MailDraft {
  return {
    id: "mail-draft-empty",
    draftType: "general",
    mode: "guest_draft_mode",
    findingIds: [],
    toAddresses: [],
    ccAddresses: [],
    subject: "",
    body: "",
    attachmentFileIds: [],
    validationWarnings: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

export async function loadMailboxPageData(
  projectId?: string,
  folder?: string,
  fetchImpl?: typeof fetch,
) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [accounts, threads, messages, templates, signatures] = await Promise.all([
      api.listMailAccounts(),
      api.listMailThreads({ projectId, folder }),
      api.listMailMessages({ projectId, folder }),
      api.listMailTemplates(),
      api.listMailSignatures(),
    ]);
    const selectedThread = threads[0] ? await api.getMailThread(threads[0].thread.id) : null;
    return {
      projectId: projectId ?? null,
      folder: folder ?? "inbox",
      accounts,
      threads,
      messages,
      templates,
      signatures,
      selectedThread,
      dataSource: "api" as const,
    };
  } catch {
    return {
      projectId: projectId ?? null,
      folder: folder ?? "inbox",
      accounts: emptyAccounts,
      threads: emptyThreadList,
      messages: [] as MailMessage[],
      templates: emptyTemplates,
      signatures: emptySignatures,
      selectedThread: null as MailThreadDetailResponse | null,
      dataSource: "fallback" as const,
    };
  }
}

export async function loadMailThreadPageData(threadId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getMailThread(threadId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: null as MailThreadDetailResponse | null, dataSource: "fallback" as const };
  }
}

export async function loadMailMessagePageData(messageId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getMailMessage(messageId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: null as MailMessageDetailResponse | null, dataSource: "fallback" as const };
  }
}

export async function loadMailComposePageData(projectId?: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [accounts, templates, signatures] = await Promise.all([
      api.listMailAccounts(),
      api.listMailTemplates(),
      api.listMailSignatures(),
    ]);
    return {
      projectId: projectId ?? null,
      accounts,
      templates,
      signatures,
      draft: buildEmptyDraft({ projectId }),
      dataSource: "api" as const,
    };
  } catch {
    return {
      projectId: projectId ?? null,
      accounts: emptyAccounts,
      templates: emptyTemplates,
      signatures: emptySignatures,
      draft: buildEmptyDraft({ projectId }),
      dataSource: "fallback" as const,
    };
  }
}

export async function loadMailAccountsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const accounts = await api.listMailAccounts();
    const syncJobsByAccount = await Promise.all(accounts.map((account) => api.listMailSyncJobs(account.id)));
    return {
      accounts,
      syncJobsByAccount,
      dataSource: "api" as const,
    };
  } catch {
    return {
      accounts: emptyAccounts,
      syncJobsByAccount: [] as MailSyncJob[][],
      dataSource: "fallback" as const,
    };
  }
}

export async function loadMailSettingsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [accounts, templates, signatures] = await Promise.all([
      api.listMailAccounts(),
      api.listMailTemplates(),
      api.listMailSignatures(),
    ]);
    return { accounts, templates, signatures, dataSource: "api" as const };
  } catch {
    return { accounts: emptyAccounts, templates: emptyTemplates, signatures: emptySignatures, dataSource: "fallback" as const };
  }
}

export async function loadSubmissionMailComposerPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const draftResponse = await api.draftDocumentSubmissionMail(documentId, {});
    const [accounts, templates, signatures] = await Promise.all([
      api.listMailAccounts(),
      api.listMailTemplates(),
      api.listMailSignatures(),
    ]);
    return {
      draft: draftResponse.draft ?? buildEmptyDraft({ draftType: "submission_mail", documentId }),
      accounts,
      templates,
      signatures,
      dataSource: "api" as const,
    };
  } catch {
    return {
      draft: buildEmptyDraft({ draftType: "submission_mail", documentId }),
      accounts: emptyAccounts,
      templates: emptyTemplates,
      signatures: emptySignatures,
      dataSource: "fallback" as const,
    };
  }
}

export async function loadActionRequestMailComposerPageData(findingId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const response = await api.draftActionRequestMail({ findingIds: [findingId] });
    const [accounts, templates, signatures] = await Promise.all([
      api.listMailAccounts(),
      api.listMailTemplates(),
      api.listMailSignatures(),
    ]);
    return {
      draft: buildEmptyDraft({
        id: response.mailDraft.id,
        draftType: "action_request",
        mode: "connected_oauth_mode",
        projectId: response.mailDraft.projectId,
        inspectionRoundId: response.mailDraft.inspectionRoundId,
        ownerPartyId: response.mailDraft.ownerPartyId,
        findingIds: response.mailDraft.findingIds,
        subject: response.mailDraft.subject,
        body: response.mailDraft.body,
        attachmentFileIds: response.mailDraft.attachmentFileIds,
        createdAt: response.mailDraft.createdAt,
        updatedAt: response.mailDraft.updatedAt,
      }),
      accounts,
      templates,
      signatures,
      dataSource: "api" as const,
    };
  } catch {
    return {
      draft: buildEmptyDraft({ draftType: "action_request", findingIds: [findingId] }),
      accounts: emptyAccounts,
      templates: emptyTemplates,
      signatures: emptySignatures,
      dataSource: "fallback" as const,
    };
  }
}

export async function loadContractMailComposerPageData(contractId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const response = await api.draftContractSendMail(contractId);
    return { draft: response.draft ?? buildEmptyDraft({ contractId }), dataSource: "api" as const };
  } catch {
    return { draft: buildEmptyDraft({ contractId }), dataSource: "fallback" as const };
  }
}

export async function loadScheduleCoordinationMailComposerPageData(
  inspectionRoundId: string,
  fetchImpl?: typeof fetch,
) {
  try {
    const api = createServerApiClient(fetchImpl);
    const response = await api.draftScheduleCoordinationMail(inspectionRoundId);
    const [accounts, templates, signatures] = await Promise.all([
      api.listMailAccounts(),
      api.listMailTemplates(),
      api.listMailSignatures(),
    ]);
    return {
      draft: response.draft ?? buildEmptyDraft({ draftType: "schedule_coordination", inspectionRoundId }),
      accounts,
      templates,
      signatures,
      dataSource: "api" as const,
    };
  } catch {
    return {
      draft: buildEmptyDraft({ draftType: "schedule_coordination", inspectionRoundId }),
      accounts: emptyAccounts,
      templates: emptyTemplates,
      signatures: emptySignatures,
      dataSource: "fallback" as const,
    };
  }
}

export async function loadEstimateMailComposerPageData(estimateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const response = await api.draftEstimateSendMail(estimateId);
    return { draft: response.draft ?? buildEmptyDraft({ estimateId }), dataSource: "api" as const };
  } catch {
    return { draft: buildEmptyDraft({ estimateId }), dataSource: "fallback" as const };
  }
}
