import Link from "next/link";

import { AdditionalHazardChecklistTable } from "../../../../components/additional-hazard-checklist-table";
import { ChecklistBulkActionBar } from "../../../../components/checklist-bulk-action-bar";
import { ChecklistCategoryTabs } from "../../../../components/checklist-category-tabs";
import { ChecklistProgressBar } from "../../../../components/checklist-progress-bar";
import { ChecklistReportMappingPanel } from "../../../../components/checklist-report-mapping-panel";
import { ChecklistResultTable } from "../../../../components/checklist-result-table";
import { ChecklistSessionHeader } from "../../../../components/checklist-session-header";
import { DocumentPreview } from "../../../../components/document-preview";
import { ErpShell } from "../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { RiskReductionChecklistTable } from "../../../../components/risk-reduction-checklist-table";
import { loadChecklistRoundPageData } from "../../../../lib/checklist-page-data";

type ChecklistPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadChecklistRoundPageData(inspectionRoundId);
  const detail = pageData.detail;
  const goodCount = detail.results.filter((item) => item.result === "good").length;
  const cautionCount = detail.results.filter((item) => item.result === "caution").length;
  const badCount = detail.results.filter((item) => item.result === "bad").length;
  const notApplicableCount = detail.results.filter((item) => item.result === "not_applicable").length;
  const notCheckedCount = detail.results.filter((item) => item.result === "not_checked").length;
  const photoMissingCount = detail.results.filter((item) => ["caution", "bad"].includes(item.result) && item.photoIds.length === 0).length;
  const warningItems = [
    ...detail.warnings.map((warning) => ({
      label: "세션 검토 필요",
      reason: warning,
      severity: "required" as const,
    })),
    ...detail.results
      .filter((item) => ["caution", "bad"].includes(item.result) && item.photoIds.length === 0)
      .map((item) => ({
        label: item.item?.title ?? item.checklistItemId,
        reason: "주의 또는 불량 항목에 사진이 연결되지 않았습니다.",
        severity: "recommended" as const,
      })),
  ];

  return (
    <ErpShell
      title={`체크리스트 · ${detail.session.inspectionRoundId}`}
      subtitle="현장 입력 결과는 지적사항 후보, 사진대지, 공사안전보건대장 이행확인 보고서의 원본 데이터로 사용됩니다."
    >
      <section className="feature-split">
        <div className="section-stack">
          <ChecklistSessionHeader session={detail.session} template={detail.template} />
          <ChecklistProgressBar
            completed={detail.session.completedCount ?? 0}
            total={detail.session.resultCount ?? 0}
            goodCount={goodCount}
            cautionCount={cautionCount}
            badCount={badCount}
            notApplicableCount={notApplicableCount}
            notCheckedCount={notCheckedCount}
            photoMissingCount={photoMissingCount}
          />
          <ChecklistCategoryTabs categories={detail.categories} />
          <ChecklistResultTable results={detail.results} />
          <RiskReductionChecklistTable items={detail.riskReductionItems} />
          <AdditionalHazardChecklistTable sessionId={detail.session.id} items={detail.additionalHazards} />
        </div>
        <div className="section-stack">
          {warningItems.length > 0 ? (
            <MissingFieldPanel title="누락정보 / 현장 경고" items={warningItems} />
          ) : null}
          <ChecklistBulkActionBar sessionId={detail.session.id} />
          <ChecklistReportMappingPanel sessionId={detail.session.id} mappings={detail.reportMappings} />
          <DocumentPreview
            title="보고서 반영 미리보기"
            statusLabel={photoMissingCount > 0 || notCheckedCount > 0 ? "검토 필요" : "반영 준비"}
            statusTone={photoMissingCount > 0 || notCheckedCount > 0 ? "warning" : "review"}
            previewTitle="공사안전보건대장 이행확인 점검표"
            rows={detail.results.map((item) => ({
              label: item.item?.reportLabel ?? item.item?.title ?? item.checklistItemId,
              status: item.result,
              note: item.comment ?? (item.findingCandidateId ? "지적후보 생성" : "원문 반영"),
            }))}
            noteBadges={["AI 초안", "점검표 원본 반영", "사진대지 연결 확인"]}
          />
          <section className="card">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Checklist Routes</p>
                <h3>입력 방식 전환</h3>
              </div>
            </div>
            <div className="link-list">
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/checklist/mobile`}>
                모바일 입력
              </Link>
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/checklist/review`}>
                데스크톱 검토
              </Link>
              <Link className="inline-link" href={`/checklist-sessions/${detail.session.id}`}>
                세션 상세
              </Link>
            </div>
          </section>
        </div>
      </section>
    </ErpShell>
  );
}
