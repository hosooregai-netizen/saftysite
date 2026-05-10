import { ErpShell } from "../../../../components/erp-shell";
import { SafetyCostHistoryTimeline } from "../../../../components/safety-cost-history-timeline";
import { loadSafetyCostHistoryPageData } from "../../../../lib/safety-cost-page-data";

type SafetyCostHistoryPageProps = {
  params: Promise<{ usageId: string }>;
};

export default async function SafetyCostHistoryPage({
  params,
}: SafetyCostHistoryPageProps) {
  const { usageId } = await params;
  const pageData = await loadSafetyCostHistoryPageData(usageId);

  return (
    <ErpShell
      title={`산안비 이력 · ${pageData.detail.ownerDisplayName}`}
      subtitle="금액, 기준, 의견, 증빙 변경 이력을 시간순으로 확인합니다."
    >
      <SafetyCostHistoryTimeline items={pageData.history} />
    </ErpShell>
  );
}
