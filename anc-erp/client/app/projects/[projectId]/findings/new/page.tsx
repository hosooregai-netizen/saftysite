import { ErpShell } from "../../../../../components/erp-shell";
import { FindingForm } from "../../../../../components/finding-form";

type NewProjectFindingPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function NewProjectFindingPage({ params }: NewProjectFindingPageProps) {
  const { projectId } = await params;

  return (
    <ErpShell
      title={`신규 지적사항 · ${projectId}`}
      subtitle="프로젝트 기준에서 수동 지적사항을 등록할 때에도 실제 소유권은 InspectionRound에 연결되어야 합니다."
    >
      <FindingForm title="프로젝트 지적사항 수동 등록" />
    </ErpShell>
  );
}
