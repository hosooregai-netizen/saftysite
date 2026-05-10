import type {
  AuditLog,
  InspectionCalendarRoundsResponse,
  InspectionCalendarTasksResponse,
  InspectionOwnerReportTask,
  InspectionRescheduleLog,
  InspectionRound,
  InspectionRoundDetailResponse,
  InspectionRoundListItem,
  InspectionRoundMilestone,
  InspectionSchedule,
  InspectionSchedulePreviewResponse,
  InspectionTask,
  Project,
  WorkScheduleAttachment,
} from "../../packages/contracts/src";
import { sampleOrganizations, sampleProject, sampleProjectParties } from "./project-demo-data";

export const sampleInspectionSchedule: InspectionSchedule = {
  id: "inspection-schedule-sample-001",
  projectId: sampleProject.id,
  contractId: "contract-sample-001",
  scheduleName: "리움미술관 승강기 교체공사 공사안전보건대장 이행점검",
  basisType: "contract_period",
  cycleText: "3개월 이내 1회",
  totalRounds: 10,
  startDate: "2025-10-01",
  endDate: "2028-02-29",
  status: "active",
  createdAt: "2026-05-10T09:00:00+09:00",
  updatedAt: "2026-05-10T09:00:00+09:00",
};

export const sampleInspectionRounds: InspectionRound[] = [
  ["round-sample-001", 1, "2026-01", "2026-01-23", "2026-01-23", "제2026-01호", null, "checked"],
  ["round-sample-002", 2, "2026-04", null, null, "제2026-02호", null, "planned"],
  ["round-sample-003", 3, "2026-07", null, null, "제2026-03호", null, "planned"],
  ["round-sample-004", 4, "2026-10", null, null, "제2026-04호", "1차기성", "planned"],
  ["round-sample-005", 5, "2027-01", null, null, "제2027-05호", null, "planned"],
  ["round-sample-006", 6, "2027-04", null, null, "제2027-06호", null, "planned"],
  ["round-sample-007", 7, "2027-07", null, null, "제2027-07호", null, "planned"],
  ["round-sample-008", 8, "2027-10", null, null, "제2027-08호", null, "planned"],
  ["round-sample-009", 9, "2028-01", null, null, "제2028-09호", null, "planned"],
  ["round-sample-010", 10, "2028-02", null, null, "제2028-10호", "준공금", "planned"],
].map(([id, roundNo, plannedMonth, plannedDate, actualInspectionDate, documentNo, milestoneLabel, status]) => ({
  id: String(id),
  projectId: sampleProject.id,
  scheduleId: sampleInspectionSchedule.id,
  roundNo: Number(roundNo),
  name: `${roundNo}회 점검`,
  documentNo: documentNo ? String(documentNo) : null,
  plannedMonth: plannedMonth ? String(plannedMonth) : null,
  plannedDate: plannedDate ? String(plannedDate) : null,
  actualInspectionDate: actualInspectionDate ? String(actualInspectionDate) : null,
  reportDueDate: null,
  milestoneLabel: milestoneLabel ? String(milestoneLabel) : null,
  status: status as InspectionRound["status"],
  createdAt: "2026-05-10T09:00:00+09:00",
  updatedAt: "2026-05-10T09:00:00+09:00",
  nextInspectionDate: plannedDate ? String(plannedDate) : `${plannedMonth}-01`,
  documentInstances: [],
}));

export const sampleOwnerReportTasks: InspectionOwnerReportTask[] = sampleInspectionRounds.flatMap((round) =>
  sampleProjectParties
    .filter((party) => party.role === "owner" && party.requiresSeparateReport && party.ownerPartyId)
    .map((party, index) => ({
      id: `owner-report-task-${round.roundNo}-${index + 1}`,
      projectId: sampleProject.id,
      inspectionRoundId: round.id,
      ownerPartyId: party.ownerPartyId ?? "",
      ownerDisplayName:
        sampleOrganizations.find((organization) => organization.id === party.organizationId)?.name ?? party.organizationId,
      status: round.roundNo === 1 ? "drafting" : "not_started",
      createdAt: "2026-05-10T09:00:00+09:00",
      updatedAt: "2026-05-10T09:00:00+09:00",
    })),
);

export const sampleInspectionTasks: InspectionTask[] = sampleInspectionRounds.flatMap((round) =>
  [
    ["schedule_confirm", "점검 일정 확인"],
    ["owner_coordination", "발주처 일정 협의"],
    ["contractor_coordination", "시공사 일정 협의"],
    ["prepare_materials", "점검 준비자료 확인"],
    ["site_inspection", "현장점검"],
    ["checklist_input", "체크리스트 입력 완료"],
    ["finding_summary", "지적사항 정리"],
    ["photo_ledger", "사진대지 정리"],
    ["report_draft", "보고서 초안 작성"],
    ["internal_review", "내부 검토"],
    ["owner_submission", "발주처별 보고서 제출"],
  ].map(([taskType, title], index) => ({
    id: `inspection-task-${round.roundNo}-${index + 1}`,
    projectId: sampleProject.id,
    inspectionRoundId: round.id,
    taskType: taskType as InspectionTask["taskType"],
    title: String(title),
    dueDate: round.plannedDate ?? null,
    assigneeId: null,
    status: round.roundNo === 1 && index < 3 ? "done" : "todo",
    linkedEntityType: null,
    linkedEntityId: null,
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  })),
);

export const sampleWorkScheduleAttachments: WorkScheduleAttachment[] = [
  {
    id: "inspection-attachment-sample-001",
    projectId: sampleProject.id,
    inspectionRoundId: "round-sample-001",
    fileId: "file-asset-sample-schedule-001",
    fileName: "2026_공사일정표.pdf",
    storagePath: "/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
    attachmentType: "master_schedule",
    sourceLabel: "프로젝트 전체 공정표",
    createdAt: "2026-05-10T09:00:00+09:00",
    updatedAt: "2026-05-10T09:00:00+09:00",
  },
];

export const sampleInspectionRescheduleLogs: InspectionRescheduleLog[] = [];

export const sampleInspectionAuditLogs: AuditLog[] = [
  {
    id: "inspection-audit-sample-001",
    entityType: "inspection_round",
    entityId: "round-sample-001",
    action: "inspection-round.created",
    summary: "1회 점검회차가 생성되었습니다.",
    fieldNames: ["roundNo", "plannedMonth", "documentNo"],
    createdAt: "2026-05-10T09:00:00+09:00",
  },
];

export const sampleInspectionMilestones: InspectionRoundMilestone[] = [
  {
    id: "inspection-milestone-sample-004",
    projectId: sampleProject.id,
    inspectionRoundId: "round-sample-004",
    label: "1차기성",
    linkedContractId: "contract-sample-001",
    createdAt: "2026-05-10T09:00:00+09:00",
  },
  {
    id: "inspection-milestone-sample-010",
    projectId: sampleProject.id,
    inspectionRoundId: "round-sample-010",
    label: "준공금",
    linkedContractId: "contract-sample-001",
    createdAt: "2026-05-10T09:00:00+09:00",
  },
];

export const sampleInspectionSchedulePreview: InspectionSchedulePreviewResponse = {
  projectId: sampleProject.id,
  scheduleDraft: {
    scheduleName: sampleInspectionSchedule.scheduleName,
    basisType: sampleInspectionSchedule.basisType,
    cycleText: sampleInspectionSchedule.cycleText,
    totalRounds: sampleInspectionSchedule.totalRounds,
    contractId: sampleInspectionSchedule.contractId,
  },
  rounds: sampleInspectionRounds.map((round) => ({
    roundNo: round.roundNo ?? 0,
    name: round.name,
    plannedMonth: round.plannedMonth,
    plannedDate: round.plannedDate,
    actualInspectionDate: round.actualInspectionDate,
    documentNo: round.documentNo ?? "",
    milestoneLabel: round.milestoneLabel,
    reportDueDate: round.reportDueDate,
    status: round.status,
  })),
  ownerReportTasks: sampleOwnerReportTasks.map((task) => ({
    roundNo:
      sampleInspectionRounds.find((round) => round.id === task.inspectionRoundId)?.roundNo ?? 0,
    ownerPartyId: task.ownerPartyId,
    status: task.status,
  })),
  warnings: [],
  isDraft: true,
};

export const sampleInspectionCalendarRounds: InspectionCalendarRoundsResponse = {
  dateFrom: "2026-01-01",
  dateTo: "2028-12-31",
  rounds: sampleInspectionRounds.map((round) => ({
    round,
    ownerReportTasks: sampleOwnerReportTasks.filter((task) => task.inspectionRoundId === round.id),
    openTaskCount: sampleInspectionTasks.filter((task) => task.inspectionRoundId === round.id && task.status !== "done").length,
    reportTargetCount: sampleOwnerReportTasks.filter((task) => task.inspectionRoundId === round.id).length,
    warnings: [],
  })),
};

export const sampleInspectionCalendarTasks: InspectionCalendarTasksResponse = {
  dateFrom: "2026-01-01",
  dateTo: "2028-12-31",
  tasks: sampleInspectionTasks,
};

export function getSampleInspectionRoundDetail(inspectionRoundId: string): InspectionRoundDetailResponse {
  const round =
    sampleInspectionRounds.find((item) => item.id === inspectionRoundId) ?? sampleInspectionRounds[0];
  return {
    round,
    project: sampleProject as Project,
    schedule: sampleInspectionSchedule,
    ownerReportTasks: sampleOwnerReportTasks.filter((item) => item.inspectionRoundId === round.id),
    tasks: sampleInspectionTasks.filter((item) => item.inspectionRoundId === round.id),
    attachments: sampleWorkScheduleAttachments.filter((item) => item.inspectionRoundId === round.id),
    rescheduleLogs: sampleInspectionRescheduleLogs,
    auditLogs: sampleInspectionAuditLogs.filter((item) => item.entityId === round.id || item.entityId === "round-sample-001"),
    milestone: sampleInspectionMilestones.find((item) => item.inspectionRoundId === round.id) ?? null,
    warnings: [],
  };
}

export function getSampleInspectionRoundList(projectId: string): InspectionRoundListItem[] {
  return sampleInspectionRounds.map((round) => ({
    round: { ...round, projectId },
    ownerReportTasks: sampleOwnerReportTasks.filter((task) => task.inspectionRoundId === round.id),
    openTaskCount: sampleInspectionTasks.filter((task) => task.inspectionRoundId === round.id && task.status !== "done").length,
    reportTargetCount: sampleOwnerReportTasks.filter((task) => task.inspectionRoundId === round.id).length,
    warnings: [],
  }));
}
