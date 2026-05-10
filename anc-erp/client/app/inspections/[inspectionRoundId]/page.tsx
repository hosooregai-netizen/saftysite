import Link from "next/link";

import { DocumentPreview } from "../../../components/document-preview";
import { ErpShell } from "../../../components/erp-shell";
import { InspectionReminderPanel } from "../../../components/inspection-reminder-panel";
import { InspectionRescheduleModal } from "../../../components/inspection-reschedule-modal";
import { InspectionRoundSummary } from "../../../components/inspection-round-summary";
import { InspectionTaskChecklist } from "../../../components/inspection-task-checklist";
import { MissingFieldPanel } from "../../../components/missing-field-panel";
import { OwnerReportStatusMatrix } from "../../../components/owner-report-status-matrix";
import { OwnerReportTaskList } from "../../../components/owner-report-task-list";
import { RoundDependencyStatus } from "../../../components/round-dependency-status";
import { WorkScheduleAttachmentPanel } from "../../../components/work-schedule-attachment-panel";
import { WorkSchedulePreview } from "../../../components/work-schedule-preview";
import { loadInspectionRoundDetailData } from "../../../lib/inspection-page-data";

type InspectionRoundPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionRoundPage({ params }: InspectionRoundPageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadInspectionRoundDetailData(inspectionRoundId);
  const reviewItems: Array<{ label: string; reason: string; severity: "required" | "recommended" }> = [];
  if (!pageData.detail.round.actualInspectionDate) {
    reviewItems.push({
      label: "실제 점검일 미입력",
      reason: "점검 후 보고서 생성 전에 실제 점검일을 확정해야 합니다.",
      severity: "required",
    });
  }
  pageData.detail.warnings.forEach((warning) => {
    reviewItems.push({
      label: "선행조건 확인",
      reason: warning,
      severity: "recommended",
    });
  });
  return (
    <ErpShell
      title={`Inspection Round: ${pageData.detail.round.roundNo}회`}
      subtitle="InspectionRound는 Checklist, Findings, PhotoLedger, SafetyCostUsage, OwnerReportTask의 상위 aggregate입니다."
    >
      <section className="feature-split">
        <div className="section-stack">
          <InspectionRoundSummary detail={pageData.detail} />
          {reviewItems.length > 0 ? <MissingFieldPanel title="회차 검토 / 종료 전 확인" items={reviewItems} /> : null}
          <RoundDependencyStatus detail={pageData.detail} />
          <InspectionTaskChecklist items={pageData.detail.tasks} />
          <OwnerReportStatusMatrix items={pageData.detail.ownerReportTasks} />
          <OwnerReportTaskList items={pageData.detail.ownerReportTasks} />
          <WorkScheduleAttachmentPanel inspectionRoundId={inspectionRoundId} items={pageData.detail.attachments} />
        </div>
        <div className="section-stack">
          <InspectionReminderPanel items={pageData.detail.tasks} />
          <DocumentPreview
            title="발주처 제출 패킷 미리보기"
            statusLabel={pageData.detail.ownerReportTasks.every((task) => task.status === "submitted" || task.status === "confirmed") ? "제출 정리" : "제출 전 검토"}
            statusTone={pageData.detail.ownerReportTasks.every((task) => task.status === "submitted" || task.status === "confirmed") ? "submitted" : "warning"}
            previewTitle={`${pageData.detail.round.roundNo}회 발주처 제출 패킷`}
            rows={pageData.detail.ownerReportTasks.map((task) => ({
              label: task.ownerPartyId.replace("project-party-owner-", "발주처 "),
              status: task.status,
              note: task.documentInstanceId ?? "문서 연결 필요",
            }))}
            noteBadges={["점검회차 기준", "발주처별 문서 분기", "최종 제출 전 검토"]}
          />
          <WorkSchedulePreview item={pageData.detail.attachments[0] ?? null} />
          <InspectionRescheduleModal inspectionRoundId={inspectionRoundId} logs={pageData.detail.rescheduleLogs} />
          <section className="card">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Inspection Links</p>
                <h3>하위 기능 진입</h3>
              </div>
            </div>
            <div className="link-list">
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/edit`}>
                회차 수정
              </Link>
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/tasks`}>
                업무
              </Link>
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/owner-reports`}>
                발주처별 보고서
              </Link>
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/attachments`}>
                공사일정 첨부
              </Link>
              <Link className="inline-link" href={`/inspections/${inspectionRoundId}/checklist`}>
                체크리스트
              </Link>
            </div>
          </section>
        </div>
      </section>
    </ErpShell>
  );
}
