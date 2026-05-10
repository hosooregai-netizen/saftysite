import { ErpShell } from "../../../../components/erp-shell";
import { SafetyCostCommentGeneratorPanel } from "../../../../components/safety-cost-comment-generator-panel";
import { SafetyCostReviewPanel } from "../../../../components/safety-cost-review-panel";
import { SafetyCostWarningPanel } from "../../../../components/safety-cost-warning-panel";
import { loadSafetyCostDetailPageData } from "../../../../lib/safety-cost-page-data";

type SafetyCostReviewPageProps = {
  params: Promise<{ usageId: string }>;
};

export default async function SafetyCostReviewPage({
  params,
}: SafetyCostReviewPageProps) {
  const { usageId } = await params;
  const pageData = await loadSafetyCostDetailPageData(usageId);

  return (
    <ErpShell
      title={`산안비 검토 · ${pageData.detail.ownerDisplayName}`}
      subtitle="AI 초안과 사용자 확정 의견을 분리해 검토합니다."
    >
      <section className="feature-split">
        <div className="section-stack">
          <SafetyCostCommentGeneratorPanel detail={pageData.detail} />
          <SafetyCostReviewPanel usage={pageData.detail.usage} reviews={pageData.detail.reviews} />
        </div>
        <div className="section-stack">
          <SafetyCostWarningPanel
            usageId={pageData.detail.usage.id}
            warnings={pageData.validation.warnings}
          />
        </div>
      </section>
    </ErpShell>
  );
}
