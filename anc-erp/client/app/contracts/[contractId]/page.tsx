import { ErpShell } from "../../../components/erp-shell";
import { ContractAmountSummary, ContractSummaryCard } from "../../../components/contract-amount-summary";
import { ContractChangeTimeline } from "../../../components/contract-change-timeline";
import { ContractFileList } from "../../../components/contract-file-list";
import { ContractPartySplitEditor } from "../../../components/contract-party-split-editor";
import { MissingFieldPanel } from "../../../components/missing-field-panel";
import { PaymentTermTable } from "../../../components/payment-term-table";
import { ContractTabs } from "../../../components/contract-tabs";
import { ContractVersionHistory } from "../../../components/contract-version-history";
import { loadContractDetailData } from "../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractDetailPage({ params }: PageProps) {
  const { contractId } = await params;
  const pageData = await loadContractDetailData(contractId);

  return (
    <ErpShell title="계약 상세" subtitle="Contract는 Project 하위 aggregate이며, 아래 탭은 모두 contractId 기준입니다.">
      <ContractTabs active="요약" contractId={contractId} />
      <ContractSummaryCard
        contract={pageData.detail.contract}
        clientNames={pageData.detail.parties.filter((item) => item.role.startsWith("client")).map((item) => item.displayName)}
      />
      <div className="feature-split">
        <div className="feature-side-stack">
          <ContractAmountSummary
            contract={pageData.detail.contract}
            parties={pageData.detail.parties}
            paymentTerms={pageData.detail.paymentTerms}
          />
          <ContractPartySplitEditor parties={pageData.detail.parties} />
          <PaymentTermTable items={pageData.detail.paymentTerms} />
        </div>
        <div className="feature-side-stack">
          <MissingFieldPanel
            title="관련 업무 영향"
            items={[
              {
                label: "점검회차 일정",
                reason: "계약기간과 점검횟수는 이후 InspectionSchedule 생성 기준으로 사용됩니다.",
                severity: "recommended",
              },
              {
                label: "보고서 자동화",
                reason: "용역범위와 산출물은 보고서 기본 섹션과 export 메타데이터에 연결됩니다.",
                severity: "recommended",
              },
            ]}
          />
          <ContractVersionHistory versions={pageData.detail.versions} />
          <ContractFileList files={pageData.detail.files} />
          <ContractChangeTimeline changes={pageData.detail.changes} />
        </div>
      </div>
    </ErpShell>
  );
}
