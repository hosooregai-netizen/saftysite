import { ErpShell } from "../../../../components/erp-shell";
import { EstimatePreviewA4 } from "../../../../components/estimate-preview-a4";
import { loadEstimateDetailData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ estimateId: string }>;
};

export default async function EstimatePreviewPage({ params }: PageProps) {
  const { estimateId } = await params;
  const pageData = await loadEstimateDetailData(estimateId);

  return (
    <ErpShell title="견적 미리보기" subtitle="견적 초안은 Contract 변환 전 검토 단계입니다.">
      <EstimatePreviewA4 draftText={pageData.draftText} estimate={pageData.estimate} />
    </ErpShell>
  );
}
