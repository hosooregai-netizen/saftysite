import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type {
  ContractDetailResponse,
  ContractListItem,
  ContractPreviewResponse,
  Estimate,
  EstimateListItem,
  PaymentSplitCalculationResponse,
  ProjectAggregateResponse,
  ProjectPartyWithOrganization,
} from "../../packages/contracts/src";
import {
  getSampleContractDetail,
  sampleContractList,
  sampleContractPreview,
  sampleEstimate,
  sampleEstimateList,
} from "./contract-demo-data";
import { getSampleProjectData, sampleProject } from "./project-demo-data";

function getApiClient(fetchImpl?: typeof fetch) {
  return createAncErpApiClient({
    baseUrl: getDefaultAncErpApiBaseUrl(),
    fetchImpl,
  });
}

export async function loadProjectContractsPageData(projectId: string, fetchImpl?: typeof fetch) {
  const sampleProjectData = getSampleProjectData(projectId);
  try {
    const api = getApiClient(fetchImpl);
    const [aggregate, contracts, estimates] = await Promise.all([
      api.getProject(projectId),
      api.listContracts(projectId),
      api.listEstimates(projectId),
    ]);
    return {
      aggregate,
      contracts,
      estimates,
      dataSource: "api" as const,
    };
  } catch {
    return {
      aggregate: {
        project: sampleProjectData.project,
        organizations: sampleProjectData.organizations,
        projectParties: sampleProjectData.projectParties,
        contacts: sampleProjectData.contacts,
        inspectionRounds: [],
        relatedCounts: sampleProjectData.relatedCounts,
        activityLogs: sampleProjectData.activityLogs,
      } satisfies ProjectAggregateResponse,
      contracts: sampleContractList.map((item) => ({
        ...item,
        contract: { ...item.contract, projectId },
      })),
      estimates: sampleEstimateList.map((item) => ({
        ...item,
        estimate: { ...item.estimate, projectId },
      })),
      dataSource: "sample" as const,
    };
  }
}

export async function loadProjectContractCreateData(projectId: string, fetchImpl?: typeof fetch) {
  const sampleProjectData = getSampleProjectData(projectId);
  try {
    const api = getApiClient(fetchImpl);
    const [aggregate, projectParties] = await Promise.all([
      api.getProject(projectId),
      api.listProjectParties(projectId),
    ]);
    return {
      aggregate,
      projectParties: projectParties as ProjectPartyWithOrganization[],
      paymentSplit: buildDraftPaymentSplit(
        (projectParties as ProjectPartyWithOrganization[]).map((party) => ({
          displayName: party.organization?.name ?? party.organizationId,
          organizationId: party.organizationId,
          projectPartyId: party.id,
          shareRatio: party.shareRatio,
          role: party.role,
        })),
      ),
      dataSource: "api" as const,
    };
  } catch {
    return {
      aggregate: {
        project: sampleProjectData.project,
        organizations: sampleProjectData.organizations,
        projectParties: sampleProjectData.projectParties,
        contacts: sampleProjectData.contacts,
        inspectionRounds: [],
        relatedCounts: sampleProjectData.relatedCounts,
        activityLogs: sampleProjectData.activityLogs,
      } satisfies ProjectAggregateResponse,
      projectParties: sampleProjectData.projectParties.map((party) => ({
        ...party,
        organization:
          sampleProjectData.organizations.find((organization) => organization.id === party.organizationId) ?? null,
      })),
      paymentSplit: buildDraftPaymentSplit(
        sampleProjectData.projectParties.map((party) => ({
          displayName:
            sampleProjectData.organizations.find((organization) => organization.id === party.organizationId)?.name ??
            party.organizationId,
          organizationId: party.organizationId,
          projectPartyId: party.id,
          shareRatio: party.shareRatio,
          role: party.role,
        })),
      ),
      dataSource: "sample" as const,
    };
  }
}

export async function loadContractDetailData(contractId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const detail = await api.getContract(contractId);
    const splitTargetAmount = detail.paymentTerms[0]?.amount ?? detail.contract.contractAmount;
    const [preview, split] = await Promise.all([
      api.previewContract(contractId),
      api.calculatePaymentSplit(contractId, { amount: splitTargetAmount }),
    ]);
    return {
      detail,
      preview,
      paymentSplit: split,
      dataSource: "api" as const,
    };
  } catch {
    return {
      detail: getSampleContractDetail(contractId),
      preview: sampleContractPreview,
      paymentSplit: buildDraftPaymentSplit(
        getSampleContractDetail(contractId).parties.map((party) => ({
          displayName: party.displayName,
          organizationId: party.organizationId,
          projectPartyId: party.projectPartyId ?? null,
          shareRatio: party.shareRatio,
          role: party.role,
        })),
        getSampleContractDetail(contractId).paymentTerms[0]?.amount ??
          getSampleContractDetail(contractId).contract.contractAmount,
        contractId,
      ),
      dataSource: "sample" as const,
    };
  }
}

export async function loadProjectEstimatesPageData(projectId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const estimates = await api.listEstimates(projectId);
    return {
      estimates,
      dataSource: "api" as const,
    };
  } catch {
    return {
      estimates: sampleEstimateList.map((item) => ({
        ...item,
        estimate: { ...item.estimate, projectId },
      })),
      dataSource: "sample" as const,
    };
  }
}

export async function loadEstimateDetailData(estimateId: string, fetchImpl?: typeof fetch) {
  try {
    const api = getApiClient(fetchImpl);
    const [estimate, draft] = await Promise.all([
      api.getEstimate(estimateId),
      api.generateEstimate(estimateId),
    ]);
    return {
      estimate: estimate as Estimate,
      draftText: draft.draftText,
      dataSource: "api" as const,
    };
  } catch {
    return {
      estimate: { ...sampleEstimate, id: estimateId, projectId: sampleProject.id },
      draftText: "견적서 초안\n총액 11,000,000원",
      dataSource: "sample" as const,
    };
  }
}

export type ProjectContractsPageData = Awaited<ReturnType<typeof loadProjectContractsPageData>>;
export type ProjectContractCreateData = Awaited<ReturnType<typeof loadProjectContractCreateData>>;
export type ContractDetailPageData = Awaited<ReturnType<typeof loadContractDetailData>>;
export type ProjectEstimatesPageData = Awaited<ReturnType<typeof loadProjectEstimatesPageData>>;
export type EstimateDetailPageData = Awaited<ReturnType<typeof loadEstimateDetailData>>;

function buildDraftPaymentSplit(
  parties: Array<{
    displayName: string;
    organizationId: string;
    projectPartyId?: string | null;
    shareRatio?: number | null;
    role: string;
  }>,
  amount: number = 0,
  contractId: string = "contract-draft",
): PaymentSplitCalculationResponse {
  const owners = parties.filter((party) => party.role === "owner" || party.role.startsWith("client"));
  let remaining = amount;
  const splitItems = owners.map((party, index) => {
    const ratio = party.shareRatio ?? 0;
    const splitAmount = index === owners.length - 1 ? remaining : Math.round((amount * ratio) / 100);
    remaining -= splitAmount;
    return {
      organizationId: party.organizationId,
      projectPartyId: party.projectPartyId ?? null,
      label: party.displayName,
      ratio,
      amount: splitAmount,
    };
  });
  return {
    contractId,
    paymentTermAmount: amount,
    splitItems,
    warnings: [],
    totalRatio: splitItems.reduce((sum, item) => sum + item.ratio, 0),
    totalAmount: splitItems.reduce((sum, item) => sum + item.amount, 0),
  };
}
