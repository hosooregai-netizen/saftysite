import { ErpShell } from "../../../../components/erp-shell";
import { ContractForm } from "../../../../components/contract-form";
import { ContractPartyTable } from "../../../../components/contract-party-table";
import { ContractTabs } from "../../../../components/contract-tabs";
import { PaymentTermTable } from "../../../../components/payment-term-table";
import { loadContractDetailData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractEditPage({ params }: PageProps) {
  const { contractId } = await params;
  const pageData = await loadContractDetailData(contractId);

  return (
    <ErpShell title="계약 수정" subtitle="구조화 데이터 수정 화면 초안입니다.">
      <ContractTabs active="수정" contractId={contractId} />
      <ContractForm
        contract={pageData.detail.contract}
        contractId={contractId}
        projectId={pageData.detail.contract.projectId}
        projectParties={[]}
      />
      <ContractPartyTable parties={pageData.detail.parties} />
      <PaymentTermTable items={pageData.detail.paymentTerms} />
    </ErpShell>
  );
}
