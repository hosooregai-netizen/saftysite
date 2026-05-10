import { ChecklistFindingCandidateTable } from "../../../../../components/checklist-finding-candidate-table";
import { ChecklistMissingInputPanel } from "../../../../../components/checklist-missing-input-panel";
import { ChecklistReportMappingPanel } from "../../../../../components/checklist-report-mapping-panel";
import { ChecklistResultMatrix } from "../../../../../components/checklist-result-matrix";
import { DocumentPreview } from "../../../../../components/document-preview";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadChecklistRoundPageData } from "../../../../../lib/checklist-page-data";

type PageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function ChecklistReviewPage({ params }: PageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadChecklistRoundPageData(inspectionRoundId);
  return (
    <ErpShell title="체크리스트 검토" subtitle="데스크톱에서는 결과 matrix, 누락정보, 지적후보, 보고서 반영 상태를 동시에 검토합니다.">
      <section className="feature-split">
        <div className="section-stack">
          <ChecklistResultMatrix results={pageData.detail.results} />
          <ChecklistFindingCandidateTable items={pageData.detail.findingCandidates} />
        </div>
        <div className="section-stack">
          <ChecklistMissingInputPanel sessionId={pageData.detail.session.id} warnings={pageData.detail.warnings} />
          <ChecklistReportMappingPanel sessionId={pageData.detail.session.id} mappings={pageData.detail.reportMappings} />
          <DocumentPreview
            title="A4 반영 검토"
            statusLabel="Review Queue"
            statusTone="review"
            previewTitle="공사안전보건대장 이행 확인 점검표"
            rows={pageData.detail.results.map((item) => ({
              label: item.item?.title ?? item.checklistItemId,
              status: item.result,
              note: item.findingCandidateId ? "지적후보 검토" : item.comment ?? "원문 반영",
            }))}
            noteBadges={["AI 초안", "표 구조 확인", "최종 export 전 검토"]}
          />
        </div>
      </section>
    </ErpShell>
  );
}
