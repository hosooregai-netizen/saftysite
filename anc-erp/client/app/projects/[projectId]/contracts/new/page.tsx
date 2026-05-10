import { ErpShell } from "../../../../../components/erp-shell";
import { ContractForm } from "../../../../../components/contract-form";
import { ContractPartySplitEditor } from "../../../../../components/contract-party-split-editor";
import { PaymentSplitMatrix } from "../../../../../components/payment-split-matrix";
import { PaymentTermForm } from "../../../../../components/payment-term-form";
import { ProjectDetailLayout } from "../../../../../components/project-detail-layout";
import { loadProjectContractCreateData } from "../../../../../lib/contract-page-data";
import type { ContractDetailResponse } from "../../../../../../packages/contracts/src";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function NewContractPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectContractCreateData(projectId);
  let ownerOrder = 0;
  const draftParties: ContractDetailResponse["parties"] = pageData.projectParties
    .filter((party) => party.role === "owner" || party.role === "engineer" || party.role === "contractor")
    .map((party) => ({
      id: `contract-draft-party-${party.id}`,
      contractId: "contract-draft-new",
      organizationId: party.organizationId,
      projectPartyId: party.id,
      role: (() => {
        if (party.role === "owner") {
          ownerOrder += 1;
          return ownerOrder === 1 ? "client_1" : "client_2";
        }
        return party.role === "engineer" ? "service_provider" : "contractor";
      })(),
      displayName: party.organization?.name ?? party.organizationId,
      shareRatio: party.shareRatio,
      shareAmount: party.shareAmount,
      paymentRequired: party.role === "owner",
      signingRequired: party.role !== "contractor",
      displayOrder: party.displayOrder,
      createdAt: party.createdAt,
      updatedAt: party.updatedAt,
      organization: party.organization,
    }));
  const draftContract = {
    id: "",
    projectId,
    contractType: "technical_service",
    contractTitle: "",
    serviceName: "",
    serviceScope: "",
    contractAmount: undefined,
    vatIncluded: true,
    deliverables: [],
    inspectionCount: undefined,
  };

  return (
    <ErpShell title="신규 계약 초안" subtitle="ProjectParty 기반 client/split 구조를 먼저 검토합니다.">
      <ProjectDetailLayout activeLabel="계약/견적" projectId={projectId}>
        <ContractForm contract={draftContract} projectId={projectId} projectParties={pageData.projectParties} />
        <ContractPartySplitEditor parties={draftParties} />
        <PaymentTermForm items={[]} />
        <PaymentSplitMatrix calculation={pageData.paymentSplit} />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
