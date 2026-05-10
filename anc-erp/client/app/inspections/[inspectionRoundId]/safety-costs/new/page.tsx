import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyCostUsageForm } from "../../../../../components/safety-cost-usage-form";

type NewSafetyCostUsagePageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function NewSafetyCostUsagePage({
  params,
}: NewSafetyCostUsagePageProps) {
  const { inspectionRoundId } = await params;

  return (
    <ErpShell
      title={`산안비 사용내역 등록 · ${inspectionRoundId}`}
      subtitle="발주처별 계상금액, 사용금액, 기준월, 관련근거를 입력하는 초안 화면입니다."
    >
      <SafetyCostUsageForm
        inspectionRoundId={inspectionRoundId}
        title="점검회차 안전관리비 입력"
      />
    </ErpShell>
  );
}
