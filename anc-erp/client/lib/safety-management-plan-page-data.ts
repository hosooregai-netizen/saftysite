import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  SafetyManagementPlanDetailResponse,
  SafetyManagementPlanListItem,
  SafetyManagementPlanValidationResponse,
} from "../../packages/contracts/src";

function createServerApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: process.env.NEXT_PUBLIC_ANC_ERP_API_BASE_URL ?? getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectSafetyManagementPlansPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const items = await api.listProjectSafetyManagementPlans(projectId);
    return { items, dataSource: "api" as const };
  } catch {
    return { items: [], dataSource: "sample" as const };
  }
}

export async function loadSafetyManagementPlanDetailPageData(planId: string, fetchImpl?: typeof fetch) {
  try {
    const api = createServerApiClient(fetchImpl);
    const detail = await api.getSafetyManagementPlan(planId);
    const validation = await api.validateSafetyManagementPlan(planId);
    return { detail, validation, dataSource: "api" as const };
  } catch {
    return {
      detail: getFallbackSafetyManagementPlanDetail(planId),
      validation: getFallbackSafetyManagementPlanValidation(planId),
      dataSource: "sample" as const,
    };
  }
}

function getFallbackSafetyManagementPlanDetail(planId: string): SafetyManagementPlanDetailResponse {
  return {
    plan: {
      id: planId,
      projectId: "project-unresolved",
      title: "안전관리계획서",
      status: "draft",
      templateId: "template-unresolved",
      revisionNo: 1,
      latestVersionNo: 0,
      createdAt: "",
      updatedAt: "",
    },
    snapshot: {
      meta: {
        planId,
        projectId: "project-unresolved",
        templateId: "template-unresolved",
        contractId: null,
        inspectionRoundId: null,
        generatedMode: "unresolved",
        draftWatermark: "AI DRAFT",
      },
      projectSnapshot: {
        projectId: "project-unresolved",
        projectName: "API 연결 대기",
        siteName: "API 연결 대기",
        siteAddress: "API 연결 대기",
        constructionType: "unresolved",
        contractorName: null,
        ownerName: null,
        contractTitle: null,
        contractPeriodText: null,
        sourceUpdatedAt: null,
      },
      variables: {},
      sections: [
        {
          id: `plan-section-${planId}-cover`,
          key: "cover",
          title: "표지",
          status: "ai_draft",
          order: 1,
          content: {
            title: "표지",
            summary: "API 연결 후 실제 초안을 불러옵니다.",
          },
          sourceEntityRefs: [],
          updatedAt: "",
        },
      ],
      missingFields: [
        {
          field: "apiConnection",
          message: "실제 프로젝트/계약/첨부 정보를 불러오지 못했습니다.",
          severity: "required",
          label: "API 연결 확인",
          sectionKey: "project_overview",
        },
      ],
      reviewWarnings: [
        {
          type: "missing_required_data",
          message: "실제 문서 데이터를 불러오지 못해 비어 있는 draft fallback을 표시합니다.",
          severity: "warning",
          sectionKey: "cover",
        },
      ],
      sourceLinks: [],
    },
    sections: [
      {
        id: `plan-section-${planId}-cover`,
        key: "cover",
        title: "표지",
        status: "ai_draft",
        order: 1,
        content: {
          title: "표지",
          summary: "API 연결 후 실제 초안을 불러옵니다.",
        },
        sourceEntityRefs: [],
        updatedAt: "",
      },
    ],
    versions: [],
    workTypes: [],
    riskItems: [],
    organization: null,
    education: null,
    emergency: null,
    attachments: [],
    missingFields: [
      {
        field: "apiConnection",
        message: "실제 프로젝트/계약/첨부 정보를 불러오지 못했습니다.",
        severity: "required",
        label: "API 연결 확인",
        sectionKey: "project_overview",
      },
    ],
    warnings: [
      {
        type: "missing_required_data",
        message: "실제 문서 데이터를 불러오지 못해 비어 있는 draft fallback을 표시합니다.",
        severity: "warning",
        sectionKey: "cover",
      },
    ],
    exportedFile: null,
  };
}

function getFallbackSafetyManagementPlanValidation(planId: string): SafetyManagementPlanValidationResponse {
  return {
    planId,
    missingFields: [
      {
        field: "apiConnection",
        message: "실제 프로젝트/계약/첨부 정보를 불러오지 못했습니다.",
        severity: "required",
        label: "API 연결 확인",
        sectionKey: "project_overview",
      },
    ],
    warnings: [
      {
        type: "missing_required_data",
        message: "실제 문서 데이터를 불러오지 못해 비어 있는 draft fallback을 표시합니다.",
        severity: "warning",
        sectionKey: "cover",
      },
    ],
    hasDanger: true,
  };
}

export type ProjectSafetyManagementPlansPageData = {
  items: SafetyManagementPlanListItem[];
  dataSource: "api" | "sample";
};

export type SafetyManagementPlanDetailPageData = {
  detail: SafetyManagementPlanDetailResponse;
  validation: SafetyManagementPlanValidationResponse;
  dataSource: "api" | "sample";
};
