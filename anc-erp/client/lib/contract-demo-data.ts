import type {
  AuditLog,
  Contract,
  ContractChange,
  ContractDetailResponse,
  ContractFileLink,
  ContractListItem,
  ContractParty,
  ContractPreviewResponse,
  ContractVersion,
  Estimate,
  EstimateListItem,
  FileAsset,
  PaymentSplitCalculationResponse,
  PaymentTerm,
  Project,
} from "../../packages/contracts/src";
import { sampleOrganizations, sampleProject } from "./project-demo-data";

export const sampleContract: Contract = {
  id: "contract-sample-001",
  projectId: sampleProject.id,
  contractNo: "ANC-C-2026-001",
  contractTitle: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서",
  contractType: "technical_service",
  serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
  serviceScope: "공사안전보건대장 이행점검 결과보고서 작성 및 제출",
  contractAmount: 11000000,
  vatIncluded: true,
  vatAmount: 1000000,
  supplyAmount: 10000000,
  contractStartDate: "2026-05-01",
  contractEndDate: "2026-12-31",
  constructionStartDate: "2025-11-03",
  constructionEndDate: "2028-02-29",
  deliverables: ["공사안전보건대장 이행점검 결과보고서", "발주처별 제출용 최종본"],
  inspectionCount: 10,
  paymentSummary: "1차기성 4,400,000원 / 준공금 6,600,000원",
  status: "draft",
  finalFileId: "contract-file-sample-final",
  latestVersionId: "contract-version-sample-001",
  createdAt: "2026-05-09T09:00:00+09:00",
  updatedAt: "2026-05-09T09:00:00+09:00",
};

export const sampleContractParties: ContractParty[] = [
  {
    id: "contract-party-client-001",
    contractId: sampleContract.id,
    organizationId: "org-owner-001",
    projectPartyId: "project-party-owner-001",
    role: "client_1",
    displayName: "삼성문화재단",
    shareRatio: 60,
    shareAmount: 6600000,
    paymentRequired: true,
    signingRequired: true,
    displayOrder: 1,
    createdAt: "2026-05-09T09:00:00+09:00",
    updatedAt: "2026-05-09T09:00:00+09:00",
  },
  {
    id: "contract-party-client-002",
    contractId: sampleContract.id,
    organizationId: "org-owner-002",
    projectPartyId: "project-party-owner-002",
    role: "client_2",
    displayName: "삼성생명공익재단",
    shareRatio: 40,
    shareAmount: 4400000,
    paymentRequired: true,
    signingRequired: true,
    displayOrder: 2,
    createdAt: "2026-05-09T09:00:00+09:00",
    updatedAt: "2026-05-09T09:00:00+09:00",
  },
  {
    id: "contract-party-service-001",
    contractId: sampleContract.id,
    organizationId: "org-engineer-001",
    projectPartyId: "project-party-engineer-001",
    role: "service_provider",
    displayName: "A&C기술사사무소",
    paymentRequired: false,
    signingRequired: true,
    displayOrder: 3,
    createdAt: "2026-05-09T09:00:00+09:00",
    updatedAt: "2026-05-09T09:00:00+09:00",
  },
];

export const samplePaymentTerms: PaymentTerm[] = [
  {
    id: "payment-term-sample-001",
    contractId: sampleContract.id,
    label: "1차기성",
    triggerText: "착수 후 1차 이행점검 완료 시",
    amount: 4400000,
    ratio: 40,
    status: "planned",
    splitItems: [
      {
        organizationId: "org-owner-001",
        projectPartyId: "project-party-owner-001",
        label: "삼성문화재단",
        ratio: 60,
        amount: 2640000,
      },
      {
        organizationId: "org-owner-002",
        projectPartyId: "project-party-owner-002",
        label: "삼성생명공익재단",
        ratio: 40,
        amount: 1760000,
      },
    ],
    createdAt: "2026-05-09T09:00:00+09:00",
    updatedAt: "2026-05-09T09:00:00+09:00",
  },
  {
    id: "payment-term-sample-002",
    contractId: sampleContract.id,
    label: "준공금",
    triggerText: "최종 결과보고서 제출 후",
    amount: 6600000,
    ratio: 60,
    status: "planned",
    splitItems: [
      {
        organizationId: "org-owner-001",
        projectPartyId: "project-party-owner-001",
        label: "삼성문화재단",
        ratio: 60,
        amount: 3960000,
      },
      {
        organizationId: "org-owner-002",
        projectPartyId: "project-party-owner-002",
        label: "삼성생명공익재단",
        ratio: 40,
        amount: 2640000,
      },
    ],
    createdAt: "2026-05-09T09:00:00+09:00",
    updatedAt: "2026-05-09T09:00:00+09:00",
  },
];

export const sampleContractVersions: ContractVersion[] = [
  {
    id: "contract-version-sample-001",
    contractId: sampleContract.id,
    versionNo: 1,
    draftText:
      "계약서 초안\n프로젝트: 리움미술관 승강기 교체공사\n용역범위: 공사안전보건대장 이행점검 결과보고서 작성 및 제출\n발주처 분담: 삼성문화재단 60%, 삼성생명공익재단 40%",
    templateKey: "contract-draft-generation",
    isDraft: true,
    missingFields: [],
    createdAt: "2026-05-09T09:00:00+09:00",
  },
];

export const sampleContractChanges: ContractChange[] = [
  {
    id: "contract-change-sample-001",
    contractId: sampleContract.id,
    summary: "계약금액과 지급조건 초안이 등록되었습니다.",
    changedFields: ["contractAmount", "paymentSummary"],
    createdAt: "2026-05-09T09:00:00+09:00",
  },
];

export const sampleContractFiles: ContractFileLink[] = [
  {
    id: "contract-file-sample-final",
    fileId: "file-asset-sample-final",
    contractId: sampleContract.id,
    fileName: "리움미술관_기술용역계약서_v1.pdf",
    fileType: "application/pdf",
    storagePath: "/리움미술관 승강기 교체공사/00_계약_견적/리움미술관_기술용역계약서_v1.pdf",
    fileCategory: "final",
    isFinal: true,
    isSigned: false,
    createdAt: "2026-05-09T09:00:00+09:00",
  },
];

export const sampleFileAssets: FileAsset[] = [
  {
    id: "file-asset-sample-final",
    projectId: sampleProject.id,
    fileName: "리움미술관_기술용역계약서_v1.pdf",
    fileType: "application/pdf",
    storagePath: "/리움미술관 승강기 교체공사/00_계약_견적/리움미술관_기술용역계약서_v1.pdf",
    linkedEntityType: "contract",
    linkedEntityId: sampleContract.id,
    createdAt: "2026-05-09T09:00:00+09:00",
  },
];

export const sampleContractAuditLogs: AuditLog[] = [
  {
    id: "contract-audit-sample-001",
    entityType: "contract",
    entityId: sampleContract.id,
    action: "contract.created",
    summary: "계약 초안이 생성되었습니다.",
    fieldNames: ["contractTitle", "contractAmount"],
    createdAt: "2026-05-09T09:00:00+09:00",
  },
];

export const sampleContractList: ContractListItem[] = [
  {
    contract: sampleContract,
    clientNames: ["삼성문화재단", "삼성생명공익재단"],
    paymentTermCount: samplePaymentTerms.length,
    versionCount: sampleContractVersions.length,
    warnings: [],
  },
];

export const sampleContractPreview: ContractPreviewResponse = {
  contractId: sampleContract.id,
  templateKey: "contract-draft-generation",
  draftText:
    "계약서 초안\n프로젝트: 리움미술관 승강기 교체공사\n계약명: 리움미술관 승강기 교체공사 공사안전보건대장 이행점검 기술용역계약서\n지급조건: 1차기성 4,400,000원, 준공금 6,600,000원",
  missingFields: [],
  warnings: [],
  isDraft: true,
};

export const samplePaymentSplitCalculation: PaymentSplitCalculationResponse = {
  contractId: sampleContract.id,
  paymentTermAmount: 4400000,
  splitItems: samplePaymentTerms[0].splitItems,
  warnings: [],
  totalRatio: 100,
  totalAmount: 4400000,
};

export const sampleEstimate: Estimate = {
  id: "estimate-sample-001",
  projectId: sampleProject.id,
  estimateNo: "ANC-E-2026-001",
  title: "리움미술관 승강기 교체공사 기술용역 견적서",
  serviceName: "한남동 승강기 교체공사(리움미술관) 기술용역",
  validUntil: "2026-06-30",
  status: "draft",
  supplyAmount: 10000000,
  vatAmount: 1000000,
  totalAmount: 11000000,
  items: [
    {
      id: "estimate-item-sample-001",
      label: "정기 이행점검",
      description: "총 10회 현장 점검 및 보고서 작성",
      quantity: 10,
      unitPrice: 1000000,
      supplyAmount: 10000000,
      vatAmount: 1000000,
      totalAmount: 11000000,
    },
  ],
  createdAt: "2026-05-09T09:00:00+09:00",
  updatedAt: "2026-05-09T09:00:00+09:00",
};

export const sampleEstimateList: EstimateListItem[] = [
  {
    estimate: sampleEstimate,
    itemCount: sampleEstimate.items.length,
  },
];

export function getSampleContractDetail(
  contractId: string,
  projectId: string = sampleProject.id,
): ContractDetailResponse {
  const project: Project = { ...sampleProject, id: projectId };
  return {
    contract: { ...sampleContract, id: contractId, projectId },
    project,
    parties: sampleContractParties.map((party) => ({
      ...party,
      contractId,
      organization:
        sampleOrganizations.find((organization) => organization.id === party.organizationId) ?? null,
    })),
    paymentTerms: samplePaymentTerms.map((term) => ({ ...term, contractId })),
    versions: sampleContractVersions.map((version) => ({ ...version, contractId })),
    changes: sampleContractChanges.map((change) => ({ ...change, contractId })),
    files: sampleContractFiles.map((file) => ({ ...file, contractId })),
    auditLogs: sampleContractAuditLogs.map((log) => ({ ...log, entityId: contractId })),
    warnings: [],
  };
}
