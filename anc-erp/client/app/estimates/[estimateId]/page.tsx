import { ErpShell } from "../../../components/erp-shell";
import { EstimateConvertButton } from "../../../components/estimate-convert-button";
import { EstimateForm } from "../../../components/estimate-form";
import { EstimateItemTable } from "../../../components/estimate-item-table";
import { EstimatePreviewA4 } from "../../../components/estimate-preview-a4";
import { loadEstimateDetailData } from "../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ estimateId: string }>;
};

export default async function EstimateDetailPage({ params }: PageProps) {
  const { estimateId } = await params;
  const pageData = await loadEstimateDetailData(estimateId);

  return (
    <ErpShell title="견적 상세" subtitle="견적 상세는 계약 전환 직전의 구조화 데이터 확인 화면입니다.">
      <EstimateForm estimate={pageData.estimate} />
      <EstimateItemTable items={pageData.estimate.items} />
      <EstimatePreviewA4 draftText={pageData.draftText} estimate={pageData.estimate} />
      <EstimateConvertButton estimateId={estimateId} />
    </ErpShell>
  );
}
