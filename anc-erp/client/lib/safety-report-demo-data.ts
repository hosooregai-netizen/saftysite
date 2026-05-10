import type {
  InspectionOwnerReportTask,
  MissingField,
  ReviewWarning,
  SafetyReportDetailResponse,
  SafetyReportExportResponse,
  SafetyReportLinkedDataResponse,
  SafetyReportListItem,
  SafetyReportMutationResponse,
  SafetyReportRequiredDataResponse,
  SafetyReportSubmissionResponse,
  SafetyReportVariablesResponse,
} from "../../packages/contracts/src";

function buildMissingFields(): MissingField[] {
  return [
    {
      field: "contractorName",
      message: "시공사명이 연결되지 않았습니다.",
      severity: "recommended",
      label: "시공사명",
      sectionKey: "project_summary",
      reason: "프로젝트 관계자 원장과 연계 상태를 확인하세요.",
    },
  ];
}

function buildWarnings(): ReviewWarning[] {
  return [
    {
      type: "legal_text_review_required",
      message: "법정 고정 문구는 템플릿 본문 기준으로 검토해야 합니다.",
      severity: "warning",
      sectionKey: "cover",
    },
  ];
}

export function getSampleSafetyReportDetail(documentId: string): SafetyReportDetailResponse {
  const missingFields = buildMissingFields();
  const warnings = buildWarnings();
  const snapshot = {
    meta: {
      documentId,
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      ownerDisplayName: "삼성문화재단",
      templateId: "template-safety-report-v1",
      generatedMode: "from_linked_data" as const,
      draftWatermark: "AI DRAFT",
    },
    variables: {
      projectName: "리움미술관 승강기 교체공사",
      siteAddress: "서울특별시 용산구 이태원로 55길 60-16",
      inspectionDate: "2026-01-23",
      documentNo: "제2026-01호",
      roundNo: 1,
      contractorName: "ANC이엔지",
      ownerDisplayName: "삼성문화재단",
      checklistResultCount: 8,
      findingCount: 2,
      photoLedgerCount: 1,
      safetyCostUsageCount: 1,
      attachmentCount: 1,
      safetyCostUsedRate: 38.2,
    },
    sections: [
      {
        id: `section-${documentId}-cover`,
        key: "cover",
        title: "표지",
        status: "ai_draft" as const,
        order: 1,
        content: {
          title: "표지",
          summary: "리움미술관 승강기 교체공사 / 삼성문화재단 / 제2026-01호",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      {
        id: `section-${documentId}-project_summary`,
        key: "project_summary",
        title: "공사 개요",
        status: "edited" as const,
        order: 2,
        content: {
          title: "공사 개요",
          summary: "서울특별시 용산구 이태원로 55길 60-16 / 시공사 ANC이엔지",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      {
        id: `section-${documentId}-inspection_checklist`,
        key: "inspection_checklist",
        title: "점검 체크리스트",
        status: "review" as const,
        order: 3,
        content: {
          title: "점검 체크리스트",
          summary: "체크리스트 8건 반영",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      {
        id: `section-${documentId}-implementation_confirmation`,
        key: "implementation_confirmation",
        title: "이행확인",
        status: "review" as const,
        order: 4,
        content: {
          title: "이행확인",
          summary: "지적사항 2건 검토",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      {
        id: `section-${documentId}-safety_cost_usage`,
        key: "safety_cost_usage",
        title: "산업안전보건관리비 사용내용",
        status: "review" as const,
        order: 5,
        content: {
          title: "산업안전보건관리비 사용내용",
          summary: "산안비 1건 / 사용률 38.2",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
      {
        id: `section-${documentId}-photo_ledger`,
        key: "photo_ledger",
        title: "사진대지",
        status: "review" as const,
        order: 6,
        content: {
          title: "사진대지",
          summary: "사진대지 1건",
        },
        sourceEntityRefs: [],
        updatedAt: "2026-05-10T09:00:00+09:00",
      },
    ],
    missingFields,
    reviewWarnings: warnings,
    sourceLinks: [],
  };

  return {
    document: {
      id: documentId,
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      ownerReportTaskId: "owner-report-task-001-01",
      templateId: "template-safety-report-v1",
      documentType: "safety_health_ledger_inspection_report",
      title: "공사안전보건대장 이행확인 보고서",
      documentNo: "제2026-01호",
      roundNo: 1,
      status: "draft",
      contentSnapshot: snapshot,
      latestVersionNo: 1,
      createdAt: "2026-05-10T09:00:00+09:00",
      updatedAt: "2026-05-10T09:00:00+09:00",
    },
    snapshot,
    sections: snapshot.sections,
    versions: [
      {
        id: "document-version-safety-report-001",
        documentId,
        versionNo: 1,
        contentSnapshot: snapshot,
        createdBy: "system",
        createdAt: "2026-05-10T09:00:00+09:00",
        changeSummary: "초안 생성",
      },
    ],
    missingFields,
    warnings,
    linkedOwnerReportTask: {
      id: "owner-report-task-001-01",
      projectId: "project-sample-001",
      inspectionRoundId: "round-sample-001",
      ownerPartyId: "owner-samsung-cultural-foundation",
      ownerDisplayName: "삼성문화재단",
      documentInstanceId: documentId,
      status: "drafting",
      exportedFileId: null,
      submittedAt: null,
      mailThreadId: null,
      submissionId: null,
      createdAt: "2026-05-10T09:00:00+09:00",
      updatedAt: "2026-05-10T09:00:00+09:00",
    },
    linkedDataSummary: {
      checklistResults: 8,
      findings: 2,
      photoLedgers: 1,
      safetyCostUsages: 1,
      attachments: 1,
    },
    exportedFile: null,
  };
}

export function getSampleSafetyReportList(projectId: string): SafetyReportListItem[] {
  const detail = getSampleSafetyReportDetail("doc-sample-001");
  return [
    {
      document: detail.document,
      ownerDisplayName: "삼성문화재단",
      inspectionRoundName: "1회 점검",
      missingRequiredCount: detail.missingFields.filter((item) => item.severity === "required").length,
      warningCount: detail.warnings.length,
      linkedOwnerReportTask: detail.linkedOwnerReportTask,
      latestVersion: detail.versions[0],
    },
  ].filter((item) => item.document.projectId === projectId);
}

export function getSampleSafetyReportRequiredData(
  inspectionRoundId: string,
): SafetyReportRequiredDataResponse {
  return {
    projectId: "project-sample-001",
    inspectionRoundId,
    ownerBranches: [
      {
        ownerPartyId: "owner-samsung-cultural-foundation",
        ownerDisplayName: "삼성문화재단",
        ownerReportTaskId: "owner-report-task-001-01",
      },
      {
        ownerPartyId: "owner-samsung-life-foundation",
        ownerDisplayName: "삼성생명공익재단",
        ownerReportTaskId: "owner-report-task-001-02",
      },
    ],
    requiredData: buildMissingFields(),
    warnings: buildWarnings(),
  };
}

export function getSampleSafetyReportVariables(documentId: string): SafetyReportVariablesResponse {
  const detail = getSampleSafetyReportDetail(documentId);
  return {
    documentId,
    variables: detail.snapshot.variables,
    sourceLinks: detail.snapshot.sourceLinks,
  };
}

export function getSampleSafetyReportLinkedData(
  documentId: string,
  sectionKey: string,
): SafetyReportLinkedDataResponse {
  const itemsBySection: Record<string, Record<string, unknown>[]> = {
    inspection_checklist: [{ id: "checklist-result-sample-001", label: "근로자 보호구 착용" }],
    implementation_confirmation: [{ id: "finding-sample-001", title: "승강로 개구부 안전난간 보강 필요" }],
    photo_ledger: [{ id: "photo-ledger-sample-001", status: "confirmed" }],
    safety_cost_usage: [{ id: "safety-cost-usage-sample-001", usedRateCalculated: 38.2 }],
  };
  return {
    documentId,
    sectionKey,
    items: itemsBySection[sectionKey] ?? [],
  };
}

export function getSampleSafetyReportMutationResponse(
  documentId: string,
): SafetyReportMutationResponse {
  const detail = getSampleSafetyReportDetail(documentId);
  return {
    document: detail.document,
    snapshot: detail.snapshot,
    warnings: detail.warnings,
    missingFields: detail.missingFields,
    version: detail.versions[0],
  };
}

export function getSampleSafetyReportExportResponse(
  documentId: string,
): SafetyReportExportResponse {
  const detail = getSampleSafetyReportDetail(documentId);
  return {
    document: {
      ...detail.document,
      status: "exported",
      exportedFileId: "file-asset-safety-report-sample-001",
    },
    exportJob: {
      id: "safety-report-export-sample-001",
      documentId,
      projectId: detail.document.projectId,
      inspectionRoundId: detail.document.inspectionRoundId,
      ownerPartyId: detail.document.ownerPartyId,
      status: "completed",
      fileId: "file-asset-safety-report-sample-001",
      storagePath: "/리움미술관 승강기 교체공사/05_보고서/round-sample-001/owner-samsung-cultural-foundation/제2026-01호.pdf",
      createdAt: "2026-05-10T09:00:00+09:00",
      completedAt: "2026-05-10T09:00:00+09:00",
    },
    fileAsset: {
      id: "file-asset-safety-report-sample-001",
      projectId: detail.document.projectId,
      fileName: "공사안전보건대장 이행확인 보고서_제2026-01호.pdf",
      fileType: "application/pdf",
      storagePath: "/리움미술관 승강기 교체공사/05_보고서/round-sample-001/owner-samsung-cultural-foundation/제2026-01호.pdf",
      linkedEntityType: "document_instance",
      linkedEntityId: documentId,
      createdAt: "2026-05-10T09:00:00+09:00",
    },
    version: detail.versions[0],
  };
}

export function getSampleSafetyReportSubmissionResponse(
  documentId: string,
): SafetyReportSubmissionResponse {
  const detail = getSampleSafetyReportDetail(documentId);
  return {
    document: {
      ...detail.document,
      status: "submitted",
      exportedFileId: "file-asset-safety-report-sample-001",
      submittedAt: "2026-05-10T09:00:00+09:00",
      mailThreadId: "mail-thread-safety-report-001",
      submissionId: "submission-safety-report-001",
    },
    ownerReportTask: {
      ...(detail.linkedOwnerReportTask as InspectionOwnerReportTask),
      status: "submitted",
      exportedFileId: "file-asset-safety-report-sample-001",
      submittedAt: "2026-05-10T09:00:00+09:00",
      mailThreadId: "mail-thread-safety-report-001",
      submissionId: "submission-safety-report-001",
    },
    mailThreadId: "mail-thread-safety-report-001",
    submissionId: "submission-safety-report-001",
  };
}

