import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  InspectionRoundListItem,
  SafetyReportDetailResponse,
  SafetyReportLinkedDataResponse,
  SafetyReportListItem,
  SafetyReportRequiredDataResponse,
  SafetyReportVariablesResponse,
} from "../../packages/contracts/src";
import { getSampleInspectionRoundList } from "./inspection-demo-data";
import {
  getSampleSafetyReportDetail,
  getSampleSafetyReportLinkedData,
  getSampleSafetyReportList,
  getSampleSafetyReportRequiredData,
  getSampleSafetyReportVariables,
} from "./safety-report-demo-data";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectSafetyReportsPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listProjectSafetyReports(projectId);
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleSafetyReportList(projectId), dataSource: "sample" as const };
  }
}

export async function loadSafetyReportCreatePageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const rounds = await api.listInspectionRounds(projectId);
    const inspectionRoundId = rounds[0]?.round.id ?? "round-sample-001";
    const requiredData = await api.getSafetyReportRequiredData(inspectionRoundId);
    return {
      rounds,
      requiredData,
      dataSource: "api" as const,
    };
  } catch {
    return {
      rounds: getSampleInspectionRoundList(projectId),
      requiredData: getSampleSafetyReportRequiredData("round-sample-001"),
      dataSource: "sample" as const,
    };
  }
}

export async function loadSafetyReportDetailPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSafetyReport(documentId);
    const variables = await api.getSafetyReportVariables(documentId);
    const validation = await api.validateSafetyReport(documentId);
    return { detail, variables, validation, dataSource: "api" as const };
  } catch {
    return {
      detail: getSampleSafetyReportDetail(documentId),
      variables: getSampleSafetyReportVariables(documentId),
      validation: {
        documentId,
        missingFields: getSampleSafetyReportDetail(documentId).missingFields,
        warnings: getSampleSafetyReportDetail(documentId).warnings,
        hasDanger: false,
      },
      dataSource: "sample" as const,
    };
  }
}

export async function loadSafetyReportVariablesPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const variables = await api.getSafetyReportVariables(documentId);
    const missingFields = await api.getSafetyReportMissingFields(documentId);
    return { variables, missingFields, dataSource: "api" as const };
  } catch {
    const detail = getSampleSafetyReportDetail(documentId);
    return {
      variables: getSampleSafetyReportVariables(documentId),
      missingFields: detail.missingFields,
      dataSource: "sample" as const,
    };
  }
}

export async function loadSafetyReportLinkedDataPageData(
  documentId: string,
  sectionKey: string,
  fetchImpl?: typeof fetch,
) {
  try {
    const api = createServerApiClient(fetchImpl);
    const loaders: Record<string, () => Promise<SafetyReportLinkedDataResponse>> = {
      inspection_checklist: () => api.getSafetyReportChecklistResults(documentId),
      implementation_confirmation: () => api.getSafetyReportFindings(documentId),
      photo_ledger: () => api.getSafetyReportPhotoLedger(documentId),
      safety_cost_usage: () => api.getSafetyReportSafetyCost(documentId),
    };
    const payload = await (loaders[sectionKey] ?? loaders.photo_ledger)();
    return { payload, dataSource: "api" as const };
  } catch {
    return { payload: getSampleSafetyReportLinkedData(documentId, sectionKey), dataSource: "sample" as const };
  }
}

export async function loadOwnerReportTaskDocumentPageData(
  inspectionRoundId: string,
  ownerReportTaskId: string,
  fetchImpl?: typeof fetch,
) {
  try {
    const api = createServerApiClient(fetchImpl);
    const tasks = await api.listOwnerReportTasks(inspectionRoundId);
    const ownerTask = tasks.find((item) => item.id === ownerReportTaskId) ?? tasks[0];
    const documentId = ownerTask?.documentInstanceId ?? "doc-sample-001";
    const detail = await api.getSafetyReport(documentId);
    return { ownerTask, detail, dataSource: "api" as const };
  } catch {
    return {
      ownerTask: getSampleSafetyReportDetail("doc-sample-001").linkedOwnerReportTask,
      detail: getSampleSafetyReportDetail("doc-sample-001"),
      dataSource: "sample" as const,
    };
  }
}

export type ProjectSafetyReportsPageData = {
  items: SafetyReportListItem[];
  dataSource: "api" | "sample";
};

export type SafetyReportCreatePageData = {
  rounds: InspectionRoundListItem[];
  requiredData: SafetyReportRequiredDataResponse;
  dataSource: "api" | "sample";
};

export type SafetyReportDetailPageData = {
  detail: SafetyReportDetailResponse;
  variables: SafetyReportVariablesResponse;
  validation: {
    documentId: string;
    missingFields: unknown[];
    warnings: unknown[];
    hasDanger: boolean;
  };
  dataSource: "api" | "sample";
};

export type SafetyReportVariablesPageData = {
  variables: SafetyReportVariablesResponse;
  missingFields: unknown[];
  dataSource: "api" | "sample";
};

export type SafetyReportLinkedDataPageData = {
  payload: SafetyReportLinkedDataResponse;
  dataSource: "api" | "sample";
};
