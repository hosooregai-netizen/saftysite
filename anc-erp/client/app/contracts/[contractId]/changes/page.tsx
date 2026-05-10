import { ErpShell } from "../../../../components/erp-shell";
import { ContractChangeForm, ContractChangeTimeline } from "../../../../components/contract-change-timeline";
import { ContractTabs } from "../../../../components/contract-tabs";
import { loadContractDetailData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractChangesPage({ params }: PageProps) {
  const { contractId } = await params;
  const pageData = await loadContractDetailData(contractId);

  return (
    <ErpShell title="계약 변경 이력" subtitle="변경 사유와 diff는 Contract 하위 로그로 유지합니다.">
      <ContractTabs active="변경이력" contractId={contractId} />
      <ContractChangeTimeline changes={pageData.detail.changes} />
      <ContractChangeForm />
    </ErpShell>
  );
}
