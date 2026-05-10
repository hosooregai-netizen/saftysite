import type {
  DocumentSafetyCostUsageResponse,
  SafetyCostEvidence,
  SafetyCostHistoryEvent,
  SafetyCostOwnerMatrixResponse,
  SafetyCostReportMapping,
  SafetyCostReview,
  SafetyCostUsage,
  SafetyCostUsageDetailResponse,
  SafetyCostUsageListItem,
  SafetyCostValidationResponse,
  SafetyCostValidationWarning,
} from "../../packages/contracts/src";

const now = "2026-05-10T09:00:00+09:00";

export const sampleSafetyCostUsages: SafetyCostUsage[] = [
  {
    id: "safety-cost-usage-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    calculatedAmount: 99462613,
    usedAmount: 37978000,
    usedRateCalculated: 38.2,
    userEnteredRate: 38.2,
    basisMonth: "1월말",
    basisDocumentText: "산업안전보건관리비 사용내역서",
    appropriatenessComment: "공사 특수성을 반영, 적정하게 사용 중으로 판단됨",
    appropriatenessStatus: "appropriate",
    status: "synced_to_report",
    confirmedBy: "user-engineer-001",
    confirmedAt: now,
    reportInclude: true,
    syncedDocumentId: "doc-sample-001",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "safety-cost-usage-sample-002",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    calculatedAmount: 66928618,
    usedAmount: 27117450,
    usedRateCalculated: 40.5,
    userEnteredRate: 40.5,
    basisMonth: "1월말",
    basisDocumentText: "산업안전보건관리비 사용내역서",
    appropriatenessComment: "공사 특수성을 반영, 적정하게 사용 중으로 판단됨",
    appropriatenessStatus: "appropriate",
    status: "review",
    reportInclude: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const sampleSafetyCostEvidence: SafetyCostEvidence[] = [
  {
    id: "safety-cost-evidence-sample-001",
    safetyCostUsageId: "safety-cost-usage-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    fileId: "file-asset-safety-cost-001",
    evidenceType: "safety_cost_usage_statement",
    fileName: "산업안전보건관리비_사용내역서_문화재단.pdf",
    storagePath: "/리움미술관 승강기 교체공사/04_현장점검/제1회/산업안전보건관리비/usage_culture.pdf",
    issuedDate: "2026-01-31",
    submittedBy: "contact-contractor-001",
    memo: "시공사 제출본",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "safety-cost-evidence-sample-002",
    safetyCostUsageId: "safety-cost-usage-sample-002",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-life-foundation",
    fileId: "file-asset-safety-cost-002",
    evidenceType: "safety_cost_usage_statement",
    fileName: "산업안전보건관리비_사용내역서_생명공익재단.pdf",
    storagePath: "/리움미술관 승강기 교체공사/04_현장점검/제1회/산업안전보건관리비/usage_life.pdf",
    issuedDate: "2026-01-31",
    submittedBy: "contact-contractor-001",
    memo: "시공사 제출본",
    createdAt: now,
    updatedAt: now,
  },
];

export const sampleSafetyCostReviews: SafetyCostReview[] = [
  {
    id: "safety-cost-review-sample-001",
    safetyCostUsageId: "safety-cost-usage-sample-001",
    reviewerId: "user-engineer-001",
    reviewedAt: now,
    reviewComment: "공사 특수성을 반영, 적정하게 사용 중으로 판단됨",
    appropriatenessStatus: "appropriate",
    aiDraftComment: "공사 특수성을 반영, 적정하게 사용 중으로 판단됨",
  },
];

export const sampleSafetyCostHistory: SafetyCostHistoryEvent[] = [
  {
    id: "safety-cost-history-sample-001",
    safetyCostUsageId: "safety-cost-usage-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    eventType: "safety-cost.created",
    summary: "산업안전보건관리비 사용내역이 등록되었습니다.",
    changedFields: ["calculatedAmount", "usedAmount", "basisMonth"],
    createdAt: now,
  },
  {
    id: "safety-cost-history-sample-002",
    safetyCostUsageId: "safety-cost-usage-sample-001",
    projectId: "project-sample-001",
    inspectionRoundId: "round-sample-001",
    ownerPartyId: "owner-samsung-cultural-foundation",
    eventType: "safety-cost.synced",
    summary: "보고서 safety_cost_usage 섹션에 반영되었습니다.",
    changedFields: ["status", "syncedDocumentId"],
    createdAt: now,
  },
];

export const sampleSafetyCostWarnings: Record<string, SafetyCostValidationWarning[]> = {
  "safety-cost-usage-sample-001": [],
  "safety-cost-usage-sample-002": [
    {
      type: "not_confirmed",
      severity: "info",
      message: "보고서 export 전 확정이 필요합니다.",
    },
  ],
};

const ownerDisplayNames: Record<string, string> = {
  "owner-samsung-cultural-foundation": "삼성문화재단",
  "owner-samsung-life-foundation": "삼성생명공익재단",
};

export function getSampleSafetyCostListItems(projectOrRoundId: string): SafetyCostUsageListItem[] {
  return sampleSafetyCostUsages
    .filter(
      (item) =>
        item.projectId === projectOrRoundId || item.inspectionRoundId === projectOrRoundId,
    )
    .map((usage) => ({
      usage,
      ownerDisplayName: ownerDisplayNames[usage.ownerPartyId] ?? usage.ownerPartyId,
      evidenceCount: sampleSafetyCostEvidence.filter((item) => item.safetyCostUsageId === usage.id).length,
      warnings: sampleSafetyCostWarnings[usage.id] ?? [],
    }));
}

export function getSampleSafetyCostDetail(usageId: string): SafetyCostUsageDetailResponse {
  const usage = sampleSafetyCostUsages.find((item) => item.id === usageId) ?? sampleSafetyCostUsages[0];
  const reportMapping: SafetyCostReportMapping | null =
    usage.syncedDocumentId
      ? {
          id: `safety-cost-report-mapping-${usage.id}`,
          safetyCostUsageId: usage.id,
          documentId: usage.syncedDocumentId,
          projectSummaryPhrase: `계상금액 ${usage.calculatedAmount.toLocaleString()}원 중 ${usage.usedAmount.toLocaleString()}원 사용, 사용률 ${usage.usedRateCalculated.toFixed(1)}% (${usage.basisMonth ?? "기준"} 기준)`,
          implementationBudgetPhrase: usage.appropriatenessComment ?? "",
          sectionKey: "safety_cost_usage",
          documentVersionId: "document-version-safety-cost-sample-001",
          syncedAt: now,
        }
      : null;
  return {
    usage,
    ownerDisplayName: ownerDisplayNames[usage.ownerPartyId] ?? usage.ownerPartyId,
    evidenceItems: sampleSafetyCostEvidence.filter((item) => item.safetyCostUsageId === usage.id),
    reviews: sampleSafetyCostReviews.filter((item) => item.safetyCostUsageId === usage.id),
    history: sampleSafetyCostHistory.filter((item) => item.safetyCostUsageId === usage.id),
    warnings: sampleSafetyCostWarnings[usage.id] ?? [],
    reportMapping,
    documentVersion: reportMapping
      ? {
          id: "document-version-safety-cost-sample-001",
          documentId: reportMapping.documentId,
          projectId: usage.projectId,
          inspectionRoundId: usage.inspectionRoundId,
          ownerPartyId: usage.ownerPartyId,
          sectionKey: "safety_cost_usage",
          createdAt: now,
        }
      : null,
  };
}

export function getSampleSafetyCostOwnerMatrix(projectId: string): SafetyCostOwnerMatrixResponse {
  return {
    projectId,
    rows: sampleSafetyCostUsages.map((usage) => ({
      ownerPartyId: usage.ownerPartyId,
      ownerDisplayName: ownerDisplayNames[usage.ownerPartyId] ?? usage.ownerPartyId,
      usage,
      warnings: sampleSafetyCostWarnings[usage.id] ?? [],
      evidenceCount: sampleSafetyCostEvidence.filter((item) => item.safetyCostUsageId === usage.id).length,
    })),
  };
}

export function getSampleSafetyCostValidation(usageId: string): SafetyCostValidationResponse {
  return {
    usageId,
    warnings: sampleSafetyCostWarnings[usageId] ?? [],
    hasDanger: (sampleSafetyCostWarnings[usageId] ?? []).some((item) => item.severity === "danger"),
  };
}

export function getSampleDocumentSafetyCostUsage(documentId: string): DocumentSafetyCostUsageResponse {
  const detail = getSampleSafetyCostDetail("safety-cost-usage-sample-001");
  return {
    documentId,
    section: {
      documentId,
      documentVersionId: "document-version-safety-cost-sample-001",
      sectionKey: "safety_cost_usage",
      safetyCostUsageId: detail.usage.id,
      projectSummaryPhrase:
        detail.reportMapping?.projectSummaryPhrase ??
        `계상금액 ${detail.usage.calculatedAmount.toLocaleString()}원 중 ${detail.usage.usedAmount.toLocaleString()}원 사용`,
      implementationBudgetPhrase: detail.usage.appropriatenessComment ?? "",
      updatedAt: now,
    },
    documentVersion: detail.documentVersion,
    usage: detail.usage,
    evidenceItems: detail.evidenceItems,
    reviews: detail.reviews,
    warnings: detail.warnings,
    reportMapping: detail.reportMapping,
  };
}
