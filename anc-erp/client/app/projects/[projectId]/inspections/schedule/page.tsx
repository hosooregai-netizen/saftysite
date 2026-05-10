import { DocumentPreview } from "../../../../../components/document-preview";
import { ErpShell } from "../../../../../components/erp-shell";
import { InspectionMonthGrid } from "../../../../../components/inspection-month-grid";
import { InspectionScheduleGenerator } from "../../../../../components/inspection-schedule-generator";
import { InspectionSchedulePreview } from "../../../../../components/inspection-schedule-preview";
import { MissingFieldPanel } from "../../../../../components/missing-field-panel";
import { ProjectDetailLayout } from "../../../../../components/project-detail-layout";
import { loadInspectionSchedulePageData } from "../../../../../lib/inspection-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function InspectionSchedulePage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadInspectionSchedulePageData(projectId);
  const monthGridItems = pageData.preview.rounds.map((round) => ({
    round: {
      id: `preview-round-${round.roundNo}`,
      projectId,
      name: round.name,
      status: round.status,
      roundNo: round.roundNo,
      documentNo: round.documentNo,
      plannedMonth: round.plannedMonth ?? null,
      plannedDate: round.plannedDate ?? null,
      actualInspectionDate: round.actualInspectionDate ?? null,
      reportDueDate: round.reportDueDate ?? null,
      milestoneLabel: round.milestoneLabel ?? null,
      documentInstances: [],
    },
    ownerReportTasks: [],
    openTaskCount: 0,
    reportTargetCount: pageData.preview.ownerReportTasks.filter((item) => item.roundNo === round.roundNo).length,
    warnings: [],
  }));
  const previewWarnings = [
    {
      label: "생성 전 확인",
      reason: "preview 상태이므로 저장되지 않습니다. 회차별 예정월과 문서번호를 먼저 검토해야 합니다.",
      severity: "recommended" as const,
    },
    ...pageData.preview.warnings.map((warning) => ({
      label: "일정 경고",
      reason: warning,
      severity: "required" as const,
    })),
  ];
  return (
    <ErpShell title="점검 일정 생성" subtitle="preview와 generate를 분리해 일정 미리보기와 저장을 분명히 구분합니다.">
      <ProjectDetailLayout activeLabel="점검회차" projectId={projectId}>
        <section className="hero-card inspection-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Schedule Builder</p>
              <h2 className="hero-title">점검 일정 생성</h2>
              <p className="hero-subtitle">
                프로젝트 또는 계약 기준으로 회차를 설계하고, 발주처별 보고서 작업과 문서번호 규칙을 저장 전에 검토합니다.
              </p>
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>기준</span>
              <strong>{pageData.preview.scheduleDraft.basisType}</strong>
            </div>
            <div className="hero-summary-card">
              <span>총 회차</span>
              <strong>{pageData.preview.scheduleDraft.totalRounds}회</strong>
            </div>
            <div className="hero-summary-card">
              <span>보고서 자동 생성</span>
              <strong>{pageData.preview.ownerReportTasks.length}건</strong>
            </div>
            <div className="hero-summary-card">
              <span>Preview 상태</span>
              <strong>{pageData.preview.isDraft ? "저장 전" : "생성 완료"}</strong>
            </div>
          </div>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            <InspectionScheduleGenerator
              projectId={projectId}
              schedule={pageData.schedules[0]}
              preview={pageData.preview}
              previewPayload={pageData.previewPayload}
            />
            <InspectionSchedulePreview
              generatePayload={pageData.previewPayload}
              preview={pageData.preview}
              projectId={projectId}
            />
            <InspectionMonthGrid items={monthGridItems} />
          </div>
          <div className="section-stack">
            <MissingFieldPanel title="일정 생성 전 확인" items={previewWarnings} />
            <DocumentPreview
              title="점검 일정 문서 미리보기"
              statusLabel={pageData.preview.isDraft ? "AI 초안 아님 / preview" : "생성 완료"}
              statusTone={pageData.preview.isDraft ? "review" : "submitted"}
              previewTitle="점검회차 생성 검토표"
              rows={pageData.preview.rounds.slice(0, 4).map((round) => ({
                label: `${round.roundNo}회`,
                status: round.plannedMonth ?? "월 미정",
                note: round.documentNo,
              }))}
              noteBadges={["저장 전 검토", "발주처 분기 예정", "문서번호 규칙"]}
            />
          </div>
        </section>
      </ProjectDetailLayout>
    </ErpShell>
  );
}
