import type {
  SafetyEducationPlan,
  SafetyEmergencyPlan,
  SafetyManagementPlanAttachment,
  SafetyManagementPlanDetailResponse,
  SafetyManagementPlanListItem,
  SafetyManagementPlanValidationResponse,
  SafetyManagementPlanVersion,
  SafetyManagementRiskItem,
  SafetyManagementWorkType,
  SafetyOrganizationPlan,
} from "../../packages/contracts/src";

const samplePlanId = "safety-management-plan-sample-001";

const sampleWorkTypes: SafetyManagementWorkType[] = [
  {
    id: "smp-work-type-001",
    planId: samplePlanId,
    name: "기존 승강기 해체",
    description: "기존 설비 해체 전 작업구간 분리와 추락방지 확인",
    processOrder: 1,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "smp-work-type-002",
    planId: samplePlanId,
    name: "신규 장비 반입 및 설치",
    description: "반입 동선, 양중, 설치 작업 순서 검토",
    processOrder: 2,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

const sampleRisks: SafetyManagementRiskItem[] = [
  {
    id: "smp-risk-item-001",
    planId: samplePlanId,
    workTypeId: "smp-work-type-001",
    workTypeName: "기존 승강기 해체",
    hazard: "해체 작업 중 추락 또는 협착 위험",
    riskCause: "작업구간 격리와 추락방지 조치가 미흡할 수 있음",
    reductionMeasure: "개구부 방호와 작업구간 통제 계획을 사전 점검한다.",
    riskLevel: "high",
    sourceType: "template",
    sourceId: "smp-work-type-001",
    status: "draft",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

const sampleOrganization: SafetyOrganizationPlan = {
  planId: samplePlanId,
  responsibilities: [
    {
      role: "총괄 책임",
      name: "입력 필요",
      responsibility: "프로젝트 안전관리 총괄 계획 검토",
    },
  ],
  updatedAt: "2026-05-10T09:00:00+09:00",
};

const sampleEducation: SafetyEducationPlan = {
  planId: samplePlanId,
  items: [
    {
      educationType: "정기교육",
      target: "현장 작업자",
      cycle: "월 1회",
      content: "작업공종별 위험요인 공유",
      recordMethod: "교육일지",
    },
  ],
  updatedAt: "2026-05-10T09:00:00+09:00",
};

const sampleEmergency: SafetyEmergencyPlan = {
  planId: samplePlanId,
  contacts: [
    {
      type: "현장 비상연락",
      organization: "현대엘리베이터(주)",
      note: "실제 담당자 입력 필요",
    },
  ],
  updatedAt: "2026-05-10T09:00:00+09:00",
};

const sampleAttachments: SafetyManagementPlanAttachment[] = [
  {
    id: "smp-attachment-001",
    planId: samplePlanId,
    fileId: "file-asset-smp-001",
    fileName: "기본_공정표.pdf",
    storagePath: "/리움미술관 승강기 교체공사/08_안전관리계획서/기본_공정표.pdf",
    attachmentType: "schedule",
    sourceLabel: "기본 공정표",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

const sampleVersion: SafetyManagementPlanVersion = {
  id: "safety-management-plan-version-sample-001",
  planId: samplePlanId,
  versionNo: 1,
  contentSnapshot: {},
  createdBy: "system",
  createdAt: "2026-05-10T09:00:00+09:00",
  changeSummary: "초안 생성",
};

export function getSampleSafetyManagementPlanList(projectId: string): SafetyManagementPlanListItem[] {
  return [
    {
      plan: {
        id: samplePlanId,
        projectId,
        title: "안전관리계획서",
        status: "draft",
        templateId: "template-safety-management-plan-v1",
        contractId: "contract-sample-001",
        inspectionRoundId: "round-sample-001",
        revisionNo: 1,
        latestVersionNo: 1,
        createdAt: "2026-05-10T09:00:00+09:00",
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      inspectionRoundName: "1회 점검",
      missingRequiredCount: 0,
      warningCount: 1,
      latestVersion: sampleVersion,
    },
  ];
}

export function getSampleSafetyManagementPlanDetail(planId: string): SafetyManagementPlanDetailResponse {
  return {
    plan: {
      id: planId,
      projectId: "project-sample-001",
      title: "안전관리계획서",
      status: "draft",
      templateId: "template-safety-management-plan-v1",
      contractId: "contract-sample-001",
      inspectionRoundId: "round-sample-001",
      revisionNo: 1,
      latestVersionNo: 1,
      createdAt: "2026-05-10T09:00:00+09:00",
      updatedAt: "2026-05-10T09:00:00+09:00",
    },
    snapshot: {
      meta: {
        planId,
        projectId: "project-sample-001",
        templateId: "template-safety-management-plan-v1",
        contractId: "contract-sample-001",
        inspectionRoundId: "round-sample-001",
        generatedMode: "from_project_snapshot",
        draftWatermark: "AI DRAFT",
      },
      projectSnapshot: {
        projectId: "project-sample-001",
        projectName: "리움미술관 승강기 교체공사",
        siteName: "리움미술관 한남동",
        siteAddress: "서울특별시 용산구 이태원로55길 60-16",
        constructionType: "elevator_replacement",
        contractorName: "현대엘리베이터(주)",
        ownerName: "삼성문화재단",
        contractTitle: "기본 계약 연결",
        contractPeriodText: "2026-05-01 ~ 2026-12-31",
        sourceUpdatedAt: "2026-05-10T09:00:00+09:00",
      },
      variables: {
        projectName: "리움미술관 승강기 교체공사",
        siteAddress: "서울특별시 용산구 이태원로55길 60-16",
        workTypeCount: sampleWorkTypes.length,
        riskItemCount: sampleRisks.length,
        attachmentCount: sampleAttachments.length,
        educationCount: sampleEducation.items.length,
        emergencyContactCount: sampleEmergency.contacts.length,
        organizationRoleCount: sampleOrganization.responsibilities.length,
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
            summary: "리움미술관 승강기 교체공사 / 안전관리계획서 draft",
          },
          sourceEntityRefs: [],
          updatedAt: "2026-05-10T09:00:00+09:00",
        },
        {
          id: `plan-section-${planId}-project_overview`,
          key: "project_overview",
          title: "공사 개요",
          status: "review",
          order: 2,
          content: {
            title: "공사 개요",
            summary: "서울특별시 용산구 이태원로55길 60-16 / elevator_replacement",
          },
          sourceEntityRefs: [],
          updatedAt: "2026-05-10T09:00:00+09:00",
        },
      ],
      missingFields: [],
      reviewWarnings: [
        {
          type: "legal_text_review_required",
          message: "법정 고정 문구는 등록된 템플릿 문구를 우선 검토해야 합니다.",
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
          summary: "리움미술관 승강기 교체공사 / 안전관리계획서 draft",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      {
        id: `plan-section-${planId}-project_overview`,
        key: "project_overview",
        title: "공사 개요",
        status: "review",
        order: 2,
        content: {
          title: "공사 개요",
          summary: "서울특별시 용산구 이태원로55길 60-16 / elevator_replacement",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
    ],
    versions: [sampleVersion],
    workTypes: sampleWorkTypes,
    riskItems: sampleRisks,
    organization: sampleOrganization,
    education: sampleEducation,
    emergency: sampleEmergency,
    attachments: sampleAttachments,
    missingFields: [],
    warnings: [
      {
        type: "legal_text_review_required",
        message: "법정 고정 문구는 등록된 템플릿 문구를 우선 검토해야 합니다.",
        severity: "warning",
        sectionKey: "cover",
      },
    ],
    exportedFile: null,
  };
}

export function getSampleSafetyManagementPlanValidation(
  planId: string,
): SafetyManagementPlanValidationResponse {
  const detail = getSampleSafetyManagementPlanDetail(planId);
  return {
    planId,
    missingFields: detail.missingFields,
    warnings: detail.warnings,
    hasDanger: false,
  };
}
