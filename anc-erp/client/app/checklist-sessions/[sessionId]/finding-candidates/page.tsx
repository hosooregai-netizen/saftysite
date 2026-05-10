import { ChecklistFindingCandidateTable } from "../../../../components/checklist-finding-candidate-table";
import { ErpShell } from "../../../../components/erp-shell";
import { loadChecklistSessionPageData } from "../../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ChecklistFindingCandidatesPage({ params }: PageProps) {
  const { sessionId } = await params;
  const pageData = await loadChecklistSessionPageData(sessionId);
  return (
    <ErpShell title="지적사항 후보" subtitle="주의/불량 결과에서 생성된 후보를 검토하고 정식 Finding 전환 전 상태를 확인합니다.">
      <ChecklistFindingCandidateTable items={pageData.detail.findingCandidates} />
    </ErpShell>
  );
}
