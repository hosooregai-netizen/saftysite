import { ErpShell } from "../../../../../components/erp-shell";
import { FindingForm } from "../../../../../components/finding-form";

type NewRoundFindingPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function NewRoundFindingPage({ params }: NewRoundFindingPageProps) {
  const { inspectionRoundId } = await params;

  return (
    <ErpShell
      title={`회차 지적사항 등록 · ${inspectionRoundId}`}
      subtitle="체크리스트 외 수동 입력 지적사항도 InspectionRound 하위로만 생성합니다."
    >
      <FindingForm inspectionRoundId={inspectionRoundId} title="회차 지적사항 등록" />
    </ErpShell>
  );
}
