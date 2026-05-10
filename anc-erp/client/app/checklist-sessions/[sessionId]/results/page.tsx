import { ChecklistResultTable } from "../../../../components/checklist-result-table";
import { ErpShell } from "../../../../components/erp-shell";
import { loadChecklistSessionPageData } from "../../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ChecklistSessionResultsPage({ params }: PageProps) {
  const { sessionId } = await params;
  const pageData = await loadChecklistSessionPageData(sessionId);
  return (
    <ErpShell title="체크리스트 결과 목록" subtitle="항목별 입력 결과와 comment, 사진 연결 상태를 검토합니다.">
      <ChecklistResultTable results={pageData.detail.results} />
    </ErpShell>
  );
}
