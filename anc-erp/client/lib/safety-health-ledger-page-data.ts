import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  SafetyHealthLedgerDetailResponse,
  SafetyHealthLedgerListItem,
  SafetyHealthLedgerValidationResponse,
} from "../../packages/contracts/src";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectSafetyHealthLedgersPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listProjectSafetyHealthLedgers(projectId);
    return { items, dataSource: "api" as const };
  } catch {
    return { items: [], dataSource: "sample" as const };
  }
}

export async function loadSafetyHealthLedgerDetailPageData(ledgerId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSafetyHealthLedger(ledgerId);
    const validation = await api.validateSafetyHealthLedger(ledgerId);
    return { detail, validation, dataSource: "api" as const };
  } catch {
    return {
      detail: getFallbackSafetyHealthLedgerDetail(ledgerId),
      validation: getFallbackSafetyHealthLedgerValidation(ledgerId),
      dataSource: "sample" as const,
    };
  }
}

function getFallbackSafetyHealthLedgerDetail(ledgerId: string): SafetyHealthLedgerDetailResponse {
  return {
    ledger: {
      id: ledgerId,
      projectId: "project-unresolved",
      templateId: "template-unresolved",
      title: "안전보건대장",
      status: "draft",
      currentVersionNo: 0,
      createdAt: "",
      updatedAt: "",
    },
    snapshot: {
      meta: {
        projectId: "project-unresolved",
        projectName: "API 연결 대기",
        siteName: "API 연결 대기",
        siteAddress: "API 연결 대기",
        constructionType: "unresolved",
        ownerNames: [],
        contractorName: null,
        engineerName: null,
        constructionStartDate: null,
        constructionEndDate: null,
        latestInspectionRoundNo: null,
        latestUpdatedAt: null,
        sourcePlanId: null,
        draftWatermark: "AI DRAFT",
      },
      sections: [
        {
          id: `${ledgerId}-basic_info`,
          ledgerId,
          key: "basic_info",
          title: "기본정보",
          order: 1,
          status: "ai_draft",
          content: {
            title: "기본정보",
            summary: "API 연결 후 실제 누적 대장 초안을 불러옵니다.",
          },
          sourceLinks: [],
          updatedAt: "",
        },
      ],
      riskItems: [],
      measures: [],
      inspectionHistory: [],
      findingHistory: [],
      safetyCostHistory: [],
      attachments: [],
      missingFields: [
        {
          field: "apiConnection",
          message: "실제 프로젝트/계획서/점검 누적 데이터를 불러오지 못했습니다.",
          severity: "required",
          label: "API 연결 확인",
          sectionKey: "basic_info",
        },
      ],
      reviewWarnings: [
        {
          type: "missing_required_data",
          message: "실제 누적 대장 데이터를 불러오지 못해 비어 있는 draft fallback을 표시합니다.",
          severity: "warning",
          sectionKey: "basic_info",
        },
      ],
      sourceLinks: [],
    },
    sections: [
      {
        id: `${ledgerId}-basic_info`,
        ledgerId,
        key: "basic_info",
        title: "기본정보",
        order: 1,
        status: "ai_draft",
        content: {
          title: "기본정보",
          summary: "API 연결 후 실제 누적 대장 초안을 불러옵니다.",
        },
        sourceLinks: [],
        updatedAt: "",
      },
    ],
    versions: [],
    riskItems: [],
    measures: [],
    inspectionHistory: [],
    findingHistory: [],
    safetyCostHistory: [],
    attachments: [],
    missingFields: [
      {
        field: "apiConnection",
        message: "실제 프로젝트/계획서/점검 누적 데이터를 불러오지 못했습니다.",
        severity: "required",
        label: "API 연결 확인",
        sectionKey: "basic_info",
      },
    ],
    warnings: [
      {
        type: "missing_required_data",
        message: "실제 누적 대장 데이터를 불러오지 못해 비어 있는 draft fallback을 표시합니다.",
        severity: "warning",
        sectionKey: "basic_info",
      },
    ],
    exportedFile: null,
  };
}

function getFallbackSafetyHealthLedgerValidation(ledgerId: string): SafetyHealthLedgerValidationResponse {
  return {
    ledgerId,
    missingFields: [
      {
        field: "apiConnection",
        message: "실제 프로젝트/계획서/점검 누적 데이터를 불러오지 못했습니다.",
        severity: "required",
        label: "API 연결 확인",
        sectionKey: "basic_info",
      },
    ],
    warnings: [
      {
        type: "missing_required_data",
        message: "실제 누적 대장 데이터를 불러오지 못해 비어 있는 draft fallback을 표시합니다.",
        severity: "warning",
        sectionKey: "basic_info",
      },
    ],
    hasDanger: true,
  };
}

export type ProjectSafetyHealthLedgersPageData = {
  items: SafetyHealthLedgerListItem[];
  dataSource: "api" | "sample";
};

export type SafetyHealthLedgerDetailPageData = {
  detail: SafetyHealthLedgerDetailResponse;
  validation: SafetyHealthLedgerValidationResponse;
  dataSource: "api" | "sample";
};
