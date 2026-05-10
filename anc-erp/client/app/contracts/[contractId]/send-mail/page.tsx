import { ContractEstimateMailComposer } from "../../../../components/contract-estimate-mail-composer";
import { ErpShell } from "../../../../components/erp-shell";
import { loadContractMailComposerPageData, loadMailComposePageData } from "../../../../lib/mail-page-data";

type ContractMailPageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractMailPage({ params }: ContractMailPageProps) {
  const { contractId } = await params;
  const [draftData, composeData] = await Promise.all([
    loadContractMailComposerPageData(contractId),
    loadMailComposePageData(),
  ]);
  return (
    <ErpShell title={`계약 메일 · ${contractId}`} subtitle="계약/견적 송부 맥락의 메일 초안입니다.">
      <ContractEstimateMailComposer draft={draftData.draft} templates={composeData.templates} />
    </ErpShell>
  );
}
