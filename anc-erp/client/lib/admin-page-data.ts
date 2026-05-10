import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  AdminAuditLog,
  AdminDashboardSummaryResponse,
  AdminUser,
  ApprovalTemplateDetailResponse,
  ChecklistTemplate,
  ChecklistTemplateDetailResponse,
  CompanyProfile,
  DocumentTemplateDetailResponse,
  DocumentTemplateListItem,
  LegalClause,
  MailTemplate,
  Permission,
  Phrase,
  PromptDetailResponse,
  PromptListItem,
  PromptRunLog,
  PromptTestCase,
  PromptVersion,
  Role,
  SignatureAsset,
  TemplateVariable,
  TemplateVersion,
  WebhardPolicy,
} from "../../packages/contracts/src";
import { getSampleApprovalTemplates, getSampleSignatureAssets } from "./approval-demo-data";
import {
  getSampleAdminAuditLogs,
  getSampleAdminDashboardSummary,
  getSampleAdminUsers,
  getSampleCompanyProfile,
  getSampleDocumentTemplateDetail,
  getSampleDocumentTemplateList,
  getSampleLegalClauses,
  getSamplePermissions,
  getSamplePhrases,
  getSamplePromptDetail,
  getSamplePromptList,
  getSampleRoles,
  getSampleWebhardPolicy,
} from "./admin-demo-data";
import { sampleChecklistTemplate } from "./checklist-demo-data";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

function getSampleMailTemplates(): MailTemplate[] {
  return [
    {
      id: "mail-template-admin-sample-001",
      name: "제출 메일 기본 템플릿",
      templateType: "submission_mail",
      subjectTemplate: "[A&C] {{document.title}} 제출 초안",
      bodyTemplate: "안녕하세요.\n\n{{document.title}} 초안을 전달드립니다.\n검토 부탁드립니다.",
      variables: ["document.title"],
      createdAt: "2026-05-10T15:00:00+09:00",
      updatedAt: "2026-05-10T15:00:00+09:00",
    },
  ];
}

function joinTemplatePreview(detail: DocumentTemplateDetailResponse) {
  return detail.sections
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((section) => `# ${section.title}\n${section.body}`)
    .join("\n\n");
}

function getSampleTemplateVersions(detail: DocumentTemplateDetailResponse): TemplateVersion[] {
  return detail.versions.length > 0
    ? detail.versions
    : detail.currentVersion
      ? [detail.currentVersion]
      : [];
}

function getSamplePromptVersions(detail: PromptDetailResponse): PromptVersion[] {
  return detail.versions.length > 0
    ? detail.versions
    : detail.currentVersion
      ? [detail.currentVersion]
      : [];
}

export async function loadAdminDashboardPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [summary, templates, prompts, users] = await Promise.all([
      api.getAdminSummary(),
      api.listAdminDocumentTemplates(),
      api.listAdminPrompts(),
      api.listAdminUsers(),
    ]);
    return {
      summary,
      templates,
      prompts,
      users,
      dataSource: "api" as const,
    };
  } catch {
    return {
      summary: getSampleAdminDashboardSummary(),
      templates: getSampleDocumentTemplateList(),
      prompts: getSamplePromptList(),
      users: getSampleAdminUsers(),
      dataSource: "sample" as const,
    };
  }
}

export async function loadAdminUsersPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [users, roles, permissions] = await Promise.all([
      api.listAdminUsers(),
      api.listAdminRoles(),
      api.listAdminPermissions(),
    ]);
    return { users, roles, permissions, dataSource: "api" as const };
  } catch {
    return {
      users: getSampleAdminUsers(),
      roles: getSampleRoles(),
      permissions: getSamplePermissions(),
      dataSource: "sample" as const,
    };
  }
}

export async function loadAdminRolesPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [roles, permissions] = await Promise.all([api.listAdminRoles(), api.listAdminPermissions()]);
    return { roles, permissions, dataSource: "api" as const };
  } catch {
    return {
      roles: getSampleRoles(),
      permissions: getSamplePermissions(),
      dataSource: "sample" as const,
    };
  }
}

export async function loadAdminCompanyPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const companyProfile = await api.getAdminCompanyProfile();
    return { companyProfile: companyProfile.companyProfile, dataSource: "api" as const };
  } catch {
    return { companyProfile: getSampleCompanyProfile(), dataSource: "sample" as const };
  }
}

export async function loadAdminTemplatesPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listAdminDocumentTemplates();
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleDocumentTemplateList(), dataSource: "sample" as const };
  }
}

export async function loadAdminTemplateDetailPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminDocumentTemplate(templateId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSampleDocumentTemplateDetail(templateId), dataSource: "sample" as const };
  }
}

export async function loadAdminTemplatePreviewPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminDocumentTemplate(templateId);
    const currentVersionId = detail.currentVersion?.id;
    if (!currentVersionId) {
      return { detail, previewText: "", missingFields: [], dataSource: "api" as const };
    }
    const preview = await api.previewAdminTemplateVersion(currentVersionId, { sampleName: "admin_preview" });
    return {
      detail,
      previewText: preview.previewText,
      missingFields: preview.missingFields,
      dataSource: "api" as const,
    };
  } catch {
    const detail = getSampleDocumentTemplateDetail(templateId);
    return {
      detail,
      previewText: joinTemplatePreview(detail),
      missingFields: [],
      dataSource: "sample" as const,
    };
  }
}

export async function loadAdminTemplateVersionsPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [detail, versions] = await Promise.all([
      api.getAdminDocumentTemplate(templateId),
      api.listAdminTemplateVersions(templateId),
    ]);
    return { detail, versions, dataSource: "api" as const };
  } catch {
    const detail = getSampleDocumentTemplateDetail(templateId);
    return { detail, versions: getSampleTemplateVersions(detail), dataSource: "sample" as const };
  }
}

export async function loadAdminTemplateVariablesPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminDocumentTemplate(templateId);
    const versionId = detail.currentVersion?.id ?? detail.versions[0]?.id;
    const variables = versionId ? await api.listAdminTemplateVariables(versionId) : [];
    return { detail, variables, dataSource: "api" as const };
  } catch {
    const detail = getSampleDocumentTemplateDetail(templateId);
    return { detail, variables: detail.variables, dataSource: "sample" as const };
  }
}

export async function loadAdminChecklistsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const templates = await api.listAdminChecklistTemplates();
    return { templates, dataSource: "api" as const };
  } catch {
    return { templates: [sampleChecklistTemplate], dataSource: "sample" as const };
  }
}

export async function loadAdminChecklistTemplateDetailPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminChecklistTemplate(templateId);
    return { detail, dataSource: "api" as const };
  } catch {
    return {
      detail: {
        template: sampleChecklistTemplate,
        categories: [],
        items: [],
      } as ChecklistTemplateDetailResponse,
      dataSource: "sample" as const,
    };
  }
}

export async function loadAdminPhrasesPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const phrases = await api.listAdminPhrases();
    return { phrases, dataSource: "api" as const };
  } catch {
    return { phrases: getSamplePhrases(), dataSource: "sample" as const };
  }
}

export async function loadAdminLegalClausesPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const clauses = await api.listAdminLegalClauses();
    return { clauses, dataSource: "api" as const };
  } catch {
    return { clauses: getSampleLegalClauses(), dataSource: "sample" as const };
  }
}

export async function loadAdminPromptsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listAdminPrompts();
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSamplePromptList(), dataSource: "sample" as const };
  }
}

export async function loadAdminPromptDetailPageData(promptId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminPrompt(promptId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSamplePromptDetail(promptId), dataSource: "sample" as const };
  }
}

export async function loadAdminPromptVersionsPageData(promptId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [detail, versions] = await Promise.all([
      api.getAdminPrompt(promptId),
      api.listAdminPromptVersions(promptId),
    ]);
    return { detail, versions, dataSource: "api" as const };
  } catch {
    const detail = getSamplePromptDetail(promptId);
    return { detail, versions: getSamplePromptVersions(detail), dataSource: "sample" as const };
  }
}

export async function loadAdminPromptTestCasesPageData(promptId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [detail, testCases] = await Promise.all([
      api.getAdminPrompt(promptId),
      api.listAdminPromptTestCases(promptId),
    ]);
    return { detail, testCases, dataSource: "api" as const };
  } catch {
    const detail = getSamplePromptDetail(promptId);
    return { detail, testCases: detail.testCases, dataSource: "sample" as const };
  }
}

export async function loadAdminPromptRunPageData(promptId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminPrompt(promptId);
    const versionId = detail.currentVersion?.id ?? detail.versions[0]?.id;
    const runLogs = versionId ? (await api.getAdminPromptVersion(versionId)).runLogs : detail.runLogs;
    return { detail, runLogs, dataSource: "api" as const };
  } catch {
    const detail = getSamplePromptDetail(promptId);
    return { detail, runLogs: detail.runLogs, dataSource: "sample" as const };
  }
}

export async function loadAdminMailTemplatesPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const templates = await api.listAdminMailTemplates();
    return { templates, dataSource: "api" as const };
  } catch {
    return { templates: getSampleMailTemplates(), dataSource: "sample" as const };
  }
}

export async function loadAdminApprovalTemplatesPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const [templates, assets] = await Promise.all([
      api.listAdminApprovalTemplates(),
      api.listAdminSignatureAssets(),
    ]);
    return { templates, assets, dataSource: "api" as const };
  } catch {
    return { templates: getSampleApprovalTemplates(), assets: getSampleSignatureAssets(), dataSource: "sample" as const };
  }
}

export async function loadAdminApprovalTemplateDetailPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminApprovalTemplate(templateId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSampleApprovalTemplates()[0], dataSource: "sample" as const };
  }
}

export async function loadAdminSignatureAssetsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const assets = await api.listAdminSignatureAssets();
    return { assets, dataSource: "api" as const };
  } catch {
    return { assets: getSampleSignatureAssets(), dataSource: "sample" as const };
  }
}

export async function loadAdminSignatureAssetDetailPageData(assetId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getAdminSignatureAsset(assetId);
    return { detail: detail.signatureAsset, dataSource: "api" as const };
  } catch {
    return { detail: getSampleSignatureAssets()[0], dataSource: "sample" as const };
  }
}

export async function loadAdminWebhardPolicyPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const policy = await api.getAdminWebhardPolicy();
    return { policy: policy.policy, dataSource: "api" as const };
  } catch {
    return { policy: getSampleWebhardPolicy(), dataSource: "sample" as const };
  }
}

export async function loadAdminAuditLogsPageData(fetchImpl?: typeof fetch, targetType?: string) {
  try {
    const api = createServerApiClient(fetchImpl);
    const logs = await api.listAdminAuditLogs(targetType);
    return { logs, dataSource: "api" as const };
  } catch {
    return { logs: getSampleAdminAuditLogs(), dataSource: "sample" as const };
  }
}

export type AdminDashboardPageData = {
  summary: AdminDashboardSummaryResponse;
  templates: DocumentTemplateListItem[];
  prompts: PromptListItem[];
  users: AdminUser[];
  dataSource: "api" | "sample";
};

export type AdminUsersPageData = {
  users: AdminUser[];
  roles: Role[];
  permissions: Permission[];
  dataSource: "api" | "sample";
};

export type AdminCompanyPageData = {
  companyProfile: CompanyProfile;
  dataSource: "api" | "sample";
};

export type AdminTemplatesPageData = {
  items: DocumentTemplateListItem[];
  dataSource: "api" | "sample";
};

export type AdminTemplateDetailPageData = {
  detail: DocumentTemplateDetailResponse;
  dataSource: "api" | "sample";
};

export type AdminTemplateVersionsPageData = {
  detail: DocumentTemplateDetailResponse;
  versions: TemplateVersion[];
  dataSource: "api" | "sample";
};

export type AdminTemplateVariablesPageData = {
  detail: DocumentTemplateDetailResponse;
  variables: TemplateVariable[];
  dataSource: "api" | "sample";
};

export type AdminTemplatePreviewPageData = {
  detail: DocumentTemplateDetailResponse;
  previewText: string;
  missingFields: Array<{ field: string; reason: string }>;
  dataSource: "api" | "sample";
};

export type AdminChecklistsPageData = {
  templates: ChecklistTemplate[];
  dataSource: "api" | "sample";
};

export type AdminChecklistTemplateDetailPageData = {
  detail: ChecklistTemplateDetailResponse;
  dataSource: "api" | "sample";
};

export type AdminPhrasesPageData = {
  phrases: Phrase[];
  dataSource: "api" | "sample";
};

export type AdminLegalClausesPageData = {
  clauses: LegalClause[];
  dataSource: "api" | "sample";
};

export type AdminPromptsPageData = {
  items: PromptListItem[];
  dataSource: "api" | "sample";
};

export type AdminPromptDetailPageData = {
  detail: PromptDetailResponse;
  dataSource: "api" | "sample";
};

export type AdminPromptVersionsPageData = {
  detail: PromptDetailResponse;
  versions: PromptVersion[];
  dataSource: "api" | "sample";
};

export type AdminPromptTestCasesPageData = {
  detail: PromptDetailResponse;
  testCases: PromptTestCase[];
  dataSource: "api" | "sample";
};

export type AdminPromptRunPageData = {
  detail: PromptDetailResponse;
  runLogs: PromptRunLog[];
  dataSource: "api" | "sample";
};

export type AdminMailTemplatesPageData = {
  templates: MailTemplate[];
  dataSource: "api" | "sample";
};

export type AdminApprovalTemplatesPageData = {
  templates: ApprovalTemplateDetailResponse[];
  assets: SignatureAsset[];
  dataSource: "api" | "sample";
};

export type AdminApprovalTemplateDetailPageData = {
  detail: ApprovalTemplateDetailResponse;
  dataSource: "api" | "sample";
};

export type AdminSignatureAssetsPageData = {
  assets: SignatureAsset[];
  dataSource: "api" | "sample";
};

export type AdminSignatureAssetDetailPageData = {
  detail: SignatureAsset;
  dataSource: "api" | "sample";
};

export type AdminWebhardPolicyPageData = {
  policy: WebhardPolicy;
  dataSource: "api" | "sample";
};

export type AdminAuditLogsPageData = {
  logs: AdminAuditLog[];
  dataSource: "api" | "sample";
};
