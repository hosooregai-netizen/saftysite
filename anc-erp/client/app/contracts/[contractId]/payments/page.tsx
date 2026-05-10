import { ErpShell } from "../../../../components/erp-shell";
import { ContractTabs } from "../../../../components/contract-tabs";
import { PaymentSplitMatrix } from "../../../../components/payment-split-matrix";
import { PaymentTermTable } from "../../../../components/payment-term-table";
import { loadContractDetailData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractPaymentsPage({ params }: PageProps) {
  const { contractId } = await params;
  const pageData = await loadContractDetailData(contractId);

  return (
    <ErpShell title="지급조건" subtitle="PaymentTerm과 발주처별 split은 Contract 하위에서 관리합니다.">
      <ContractTabs active="지급조건" contractId={contractId} />
      <PaymentTermTable items={pageData.detail.paymentTerms} />
      <PaymentSplitMatrix calculation={pageData.paymentSplit} />
    </ErpShell>
  );
}
