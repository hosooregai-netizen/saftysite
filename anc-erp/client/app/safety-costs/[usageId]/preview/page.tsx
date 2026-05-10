import { ErpShell } from "../../../../components/erp-shell";
import { SafetyCostReportPreviewCard } from "../../../../components/safety-cost-report-preview-card";
import { SafetyCostSyncToReportButton } from "../../../../components/safety-cost-sync-to-report-button";
import { loadSafetyCostDetailPageData } from "../../../../lib/safety-cost-page-data";

type SafetyCostPreviewPageProps = {
  params: Promise<{ usageId: string }>;
};

export default async function SafetyCostPreviewPage({
  params,
}: SafetyCostPreviewPageProps) {
  const { usageId } = await params;
  const pageData = await loadSafetyCostDetailPageData(usageId);

  return (
    <ErpShell
      title={`산안비 미리보기 · ${pageData.detail.ownerDisplayName}`}
      subtitle="보고서 표와 총평 문구 반영 전 미리보기 화면입니다."
    >
      <div className="section-stack">
        <SafetyCostReportPreviewCard
          usage={pageData.detail.usage}
          ownerDisplayName={pageData.detail.ownerDisplayName}
        />
        <SafetyCostSyncToReportButton
          usage={pageData.detail.usage}
          documentId={pageData.detail.reportMapping?.documentId ?? pageData.detail.usage.syncedDocumentId}
        />
      </div>
    </ErpShell>
  );
}
