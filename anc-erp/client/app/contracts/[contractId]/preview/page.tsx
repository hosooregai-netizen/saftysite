import { ErpShell } from "../../../../components/erp-shell";
import { ContractPreviewA4 } from "../../../../components/contract-preview-a4";
import { ContractTabs } from "../../../../components/contract-tabs";
import { loadContractDetailData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractPreviewPage({ params }: PageProps) {
  const { contractId } = await params;
  const pageData = await loadContractDetailData(contractId);

  return (
    <ErpShell title="계약 미리보기" subtitle="일반조건 법률문구를 새로 만들지 않고 저장된 구조화 데이터만 사용합니다.">
      <ContractTabs active="미리보기" contractId={contractId} />
      <ContractPreviewA4 detail={pageData.detail} preview={pageData.preview} />
    </ErpShell>
  );
}
