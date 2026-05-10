import { ErpShell } from "../../../../components/erp-shell";
import { SafetyCostUsageForm } from "../../../../components/safety-cost-usage-form";
import { SafetyCostWarningPanel } from "../../../../components/safety-cost-warning-panel";
import { loadSafetyCostDetailPageData } from "../../../../lib/safety-cost-page-data";

type SafetyCostEditPageProps = {
  params: Promise<{ usageId: string }>;
};

export default async function SafetyCostEditPage({
  params,
}: SafetyCostEditPageProps) {
  const { usageId } = await params;
  const pageData = await loadSafetyCostDetailPageData(usageId);

  return (
    <ErpShell
      title={`산안비 수정 · ${pageData.detail.ownerDisplayName}`}
      subtitle="금액, 기준월, 관련근거, 적정성 의견을 수정하는 검토 화면입니다."
    >
      <div className="section-stack">
        <SafetyCostUsageForm detail={pageData.detail} title="안전관리비 수정" />
        <SafetyCostWarningPanel
          usageId={pageData.detail.usage.id}
          warnings={pageData.validation.warnings}
        />
      </div>
    </ErpShell>
  );
}
