import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  ApprovalListItem,
  ApprovalTemplateDetailResponse,
  ApprovalWorkflowDetailResponse,
  SignatureAsset,
  SignatureTaskListResponse,
  SubmissionDetailResponse,
  SubmissionReadinessResponse,
} from "../../packages/contracts/src";
import {
  getSampleApprovalTemplates,
  getSampleApprovalWorkflowDetail,
  getSampleApprovals,
  getSampleSignatureAssets,
  getSampleSignatureTasks,
  getSampleSubmissionDetail,
  getSampleSubmissionReadiness,
} from "./approval-demo-data";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadApprovalsQueuePageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listApprovalWorkflows();
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleApprovals(), dataSource: "sample" as const };
  }
}

export async function loadApprovalsInboxPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listApprovalInbox();
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleApprovals(), dataSource: "sample" as const };
  }
}

export async function loadRequestedApprovalsPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listRequestedApprovals();
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleApprovals(), dataSource: "sample" as const };
  }
}

export async function loadApprovalWorkflowPageData(workflowId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getApprovalWorkflow(workflowId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSampleApprovalWorkflowDetail("doc-sample-001"), dataSource: "sample" as const };
  }
}

export async function loadDocumentApprovalPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getDocumentApproval(documentId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSampleApprovalWorkflowDetail(documentId), dataSource: "sample" as const };
  }
}

export async function loadDocumentSignaturePageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const tasks = await api.listDocumentSignatureTasks(documentId);
    const assets = await api.listSignatureAssets();
    return { tasks, assets, dataSource: "api" as const };
  } catch {
    return {
      tasks: getSampleSignatureTasks(documentId),
      assets: getSampleSignatureAssets(),
      dataSource: "sample" as const,
    };
  }
}

export async function loadDocumentSubmissionPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const readiness = await api.getDocumentSubmissionReadiness(documentId);
    const existingSubmissionId = readiness.document.submissionId;
    const submission = existingSubmissionId ? await api.getSubmission(existingSubmissionId) : null;
    return { readiness, submission, dataSource: "api" as const };
  } catch {
    return {
      readiness: getSampleSubmissionReadiness(documentId),
      submission: null,
      dataSource: "sample" as const,
    };
  }
}

export async function loadProjectSubmissionsPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listProjectSubmissions(projectId);
    return { items, dataSource: "api" as const };
  } catch {
    return { items: [{ submission: getSampleSubmissionDetail("submission-sample-001").submission }], dataSource: "sample" as const };
  }
}

export async function loadSubmissionDetailPageData(submissionId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSubmission(submissionId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSampleSubmissionDetail(submissionId), dataSource: "sample" as const };
  }
}

export async function loadApprovalAdminPageData(fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const templates = await api.listApprovalTemplates();
    const assets = await api.listSignatureAssets();
    return { templates, assets, dataSource: "api" as const };
  } catch {
    return {
      templates: getSampleApprovalTemplates(),
      assets: getSampleSignatureAssets(),
      dataSource: "sample" as const,
    };
  }
}

export async function loadApprovalTemplateDetailPageData(templateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getApprovalTemplate(templateId);
    return { detail, dataSource: "api" as const };
  } catch {
    return { detail: getSampleApprovalTemplates()[0], dataSource: "sample" as const };
  }
}

export async function loadSignatureAssetDetailPageData(assetId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSignatureAsset(assetId);
    return { detail: detail.signatureAsset, dataSource: "api" as const };
  } catch {
    return { detail: getSampleSignatureAssets()[0], dataSource: "sample" as const };
  }
}

export type ApprovalsQueuePageData = {
  items: ApprovalListItem[];
  dataSource: "api" | "sample";
};

export type ApprovalWorkflowPageData = {
  detail: ApprovalWorkflowDetailResponse;
  dataSource: "api" | "sample";
};

export type DocumentSignaturePageData = {
  tasks: SignatureTaskListResponse;
  assets: SignatureAsset[];
  dataSource: "api" | "sample";
};

export type DocumentSubmissionPageData = {
  readiness: SubmissionReadinessResponse;
  submission: SubmissionDetailResponse | null;
  dataSource: "api" | "sample";
};

export type ApprovalAdminPageData = {
  templates: ApprovalTemplateDetailResponse[];
  assets: SignatureAsset[];
  dataSource: "api" | "sample";
};
