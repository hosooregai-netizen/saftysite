import Link from "next/link";

import { DocumentPreview } from "../../../../components/document-preview";
import { ErpShell } from "../../../../components/erp-shell";
import { InspectionReminderPanel } from "../../../../components/inspection-reminder-panel";
import { InspectionRoundCard } from "../../../../components/inspection-round-card";
import { InspectionRoundTable } from "../../../../components/inspection-round-table";
import { InspectionTimeline } from "../../../../components/inspection-timeline";
import { InspectionYearGrid } from "../../../../components/inspection-year-grid";
import { MilestoneBadge } from "../../../../components/milestone-badge";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { loadProjectInspectionsPageData } from "../../../../lib/inspection-page-data";

type ProjectInspectionsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectInspectionsPage({ params }: ProjectInspectionsPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectInspectionsPageData(projectId);
  const nextRound = pageData.rounds.find((item) => item.round.status === "planned") ?? pageData.rounds[0];
  const milestoneRounds = pageData.rounds.filter((item) => item.round.milestoneLabel);
  const completedRounds = pageData.rounds.filter((item) => ["checked", "submitted", "closed"].includes(item.round.status)).length;
  const pendingReports = pageData.rounds.flatMap((item) => item.ownerReportTasks).filter((task) => task.status !== "submitted" && task.status !== "confirmed").length;
  const missingItems: Array<{ label: string; reason: string; severity: "required" | "recommended" }> = [];
  if (!nextRound?.round.plannedDate) {
    missingItems.push({
      label: "다음 점검일 미확정",
      reason: `${nextRound?.round.roundNo ?? "-"}회 점검은 예정월만 있고 실제 점검일이 아직 없습니다.`,
      severity: "required",
    });
  }
  if (pendingReports > 0) {
    missingItems.push({
      label: "발주처 제출 확인 필요",
      reason: `미제출 또는 확인 전 보고서가 ${pendingReports}건 있습니다.`,
      severity: "recommended",
    });
  }

  return (
    <ErpShell
      title="점검회차 / 일정 관리"
      subtitle="Project 하위에서 회차를 만들고, 이후 Checklist / Findings / Report / Submission의 기준키로 사용합니다."
    >
      <ProjectDetailLayout activeLabel="점검회차" projectId={projectId}>
        <section className="hero-card inspection-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Inspection Operations</p>
              <h2 className="hero-title">점검회차 운영 현황</h2>
              <p className="hero-subtitle">
                {pageData.aggregate.project.projectName}의 전체 점검 흐름, 발주처별 제출 상태, milestone 연결을 한 화면에서 관리합니다.
              </p>
            </div>
            <div className="hero-badges">
              <MilestoneBadge label={nextRound?.round.milestoneLabel} />
              <span className="pill">다음 회차 {nextRound?.round.roundNo ?? "-"}회</span>
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>총 점검회차</span>
              <strong>{pageData.rounds.length}회</strong>
            </div>
            <div className="hero-summary-card">
              <span>완료 회차</span>
              <strong>{completedRounds}회</strong>
            </div>
            <div className="hero-summary-card">
              <span>다음 점검</span>
              <strong>{nextRound?.round.plannedMonth ?? "미정"}</strong>
            </div>
            <div className="hero-summary-card">
              <span>미제출 보고서</span>
              <strong>{pendingReports}건</strong>
            </div>
          </div>
          <div className="inspection-action-strip">
            <Link className="inline-link" href={`/projects/${projectId}/inspections/schedule`}>
              일정 생성
            </Link>
            <Link className="inline-link" href={`/projects/${projectId}/inspections/new`}>
              회차 수동 등록
            </Link>
            <Link className="inline-link" href="/calendar/inspections">
              점검 캘린더
            </Link>
          </div>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            {missingItems.length > 0 ? <MissingFieldPanel title="점검 일정 누락 / 제출 주의" items={missingItems} /> : null}
            <InspectionRoundTable items={pageData.rounds} />
            <InspectionTimeline items={pageData.rounds} />
            <InspectionYearGrid items={pageData.rounds} />
          </div>
          <div className="section-stack">
            <InspectionReminderPanel
              items={pageData.rounds.flatMap((item) => item.ownerReportTasks.map((task) => ({
                id: task.id,
                projectId: task.projectId,
                inspectionRoundId: task.inspectionRoundId,
                taskType: "owner_submission",
                title: `${task.ownerPartyId} 제출 상태 확인`,
                dueDate: null,
                assigneeId: null,
                status: task.status === "submitted" ? "done" : "todo",
                linkedEntityType: "owner_report_task",
                linkedEntityId: task.id,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
              })))}
            />
            <DocumentPreview
              title="발주처 제출 흐름 미리보기"
              statusLabel={pendingReports > 0 ? "제출 전 검토" : "제출 흐름 안정"}
              statusTone={pendingReports > 0 ? "warning" : "submitted"}
              previewTitle="점검회차별 발주처 제출 패킷"
              rows={pageData.rounds.slice(0, 4).map((item) => ({
                label: `${item.round.roundNo}회 / ${item.round.documentNo ?? "-"}`,
                status: item.ownerReportTasks.every((task) => task.status === "submitted" || task.status === "confirmed") ? "정리" : "미제출",
                note: item.round.milestoneLabel ?? "정기 점검",
              }))}
              noteBadges={["AI 초안 아님", "발주처 제출 분기", "점검회차 기준"]}
            />
            {pageData.rounds.slice(0, 3).map((item) => (
              <InspectionRoundCard item={item} key={item.round.id} />
            ))}
            <section className="card">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Milestones</p>
                  <h3>계약 milestone 연결</h3>
                </div>
              </div>
              <div className="link-list">
                {milestoneRounds.map((item) => (
                  <MilestoneBadge key={item.round.id} label={`${item.round.roundNo}회 · ${item.round.milestoneLabel}`} />
                ))}
              </div>
            </section>
          </div>
        </section>
      </ProjectDetailLayout>
    </ErpShell>
  );
}
