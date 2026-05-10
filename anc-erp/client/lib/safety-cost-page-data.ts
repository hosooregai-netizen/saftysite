import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  DocumentSafetyCostUsageResponse,
  SafetyCostHistoryEvent,
  SafetyCostOwnerMatrixResponse,
  SafetyCostUsageDetailResponse,
  SafetyCostUsageListItem,
  SafetyCostValidationResponse,
} from "../../packages/contracts/src";
import {
  getSampleDocumentSafetyCostUsage,
  getSampleSafetyCostDetail,
  getSampleSafetyCostListItems,
  getSampleSafetyCostOwnerMatrix,
  getSampleSafetyCostValidation,
} from "./safety-cost-demo-data";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectSafetyCostsPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listProjectSafetyCostUsages(projectId);
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleSafetyCostListItems(projectId), dataSource: "sample" as const };
  }
}

export async function loadProjectSafetyCostOwnerMatrixPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const matrix = await api.getProjectSafetyCostOwnerMatrix(projectId);
    return { matrix, dataSource: "api" as const };
  } catch {
    return { matrix: getSampleSafetyCostOwnerMatrix(projectId), dataSource: "sample" as const };
  }
}

export async function loadRoundSafetyCostsPageData(inspectionRoundId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listInspectionRoundSafetyCostUsages(inspectionRoundId);
    return { items, dataSource: "api" as const };
  } catch {
    return { items: getSampleSafetyCostListItems(inspectionRoundId), dataSource: "sample" as const };
  }
}

export async function loadSafetyCostDetailPageData(usageId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSafetyCostUsage(usageId);
    const validation = await api.validateSafetyCostUsage(usageId);
    return { detail, validation, dataSource: "api" as const };
  } catch {
    return {
      detail: getSampleSafetyCostDetail(usageId),
      validation: getSampleSafetyCostValidation(usageId),
      dataSource: "sample" as const,
    };
  }
}

export async function loadSafetyCostHistoryPageData(
  usageId: string,
  fetchImpl?: typeof fetch,
) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSafetyCostUsage(usageId);
    const history = await api.getSafetyCostHistory(usageId);
    return { detail, history, dataSource: "api" as const };
  } catch {
    const detail = getSampleSafetyCostDetail(usageId);
    return { detail, history: detail.history, dataSource: "sample" as const };
  }
}

export async function loadDocumentSafetyCostPageData(documentId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const payload = await api.getDocumentSafetyCostUsage(documentId);
    return { payload, dataSource: "api" as const };
  } catch {
    return { payload: getSampleDocumentSafetyCostUsage(documentId), dataSource: "sample" as const };
  }
}

export type ProjectSafetyCostsPageData = {
  items: SafetyCostUsageListItem[];
  dataSource: "api" | "sample";
};
export type ProjectSafetyCostOwnerMatrixPageData = {
  matrix: SafetyCostOwnerMatrixResponse;
  dataSource: "api" | "sample";
};
export type RoundSafetyCostsPageData = {
  items: SafetyCostUsageListItem[];
  dataSource: "api" | "sample";
};
export type SafetyCostDetailPageData = {
  detail: SafetyCostUsageDetailResponse;
  validation: SafetyCostValidationResponse;
  dataSource: "api" | "sample";
};
export type SafetyCostHistoryPageData = {
  detail: SafetyCostUsageDetailResponse;
  history: SafetyCostHistoryEvent[];
  dataSource: "api" | "sample";
};
export type DocumentSafetyCostPageData = {
  payload: DocumentSafetyCostUsageResponse;
  dataSource: "api" | "sample";
};
