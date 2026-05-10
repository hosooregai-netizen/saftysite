from copy import deepcopy

from server.app.domain.models import (
    AuditLog,
    InspectionOwnerReportTask,
    InspectionRescheduleLog,
    InspectionRound,
    InspectionRoundMilestone,
    InspectionSchedule,
    InspectionTask,
    ProjectRelatedCounts,
    WorkScheduleAttachment,
)
from server.app.repositories.contract_repository import ContractRepository
from server.app.repositories.project_repository import ProjectRepository


class InspectionRepository:
    def __init__(self, project_repository: ProjectRepository, contract_repository: ContractRepository) -> None:
        self.project_repository = project_repository
        self.contract_repository = contract_repository
        self.schedules: dict[str, InspectionSchedule] = {}
        self.rounds: dict[str, InspectionRound] = {}
        self.ownerReportTasks: dict[str, InspectionOwnerReportTask] = {}
        self.tasks: dict[str, InspectionTask] = {}
        self.attachments: dict[str, WorkScheduleAttachment] = {}
        self.rescheduleLogs: dict[str, list[InspectionRescheduleLog]] = {}
        self.auditLogs: dict[str, list[AuditLog]] = {}
        self.milestones: dict[str, InspectionRoundMilestone] = {}
        self._seed()

    def _seed(self) -> None:
        project_id = "project-sample-001"
        contract_id = "contract-sample-001"
        created_at = "2026-05-10T09:00:00+09:00"
        seed_aggregate = self.project_repository.get_project_aggregate(project_id)
        seed_documents_by_round = {
            round_item.id: round_item.documentInstances
            for round_item in (seed_aggregate.inspectionRounds if seed_aggregate else [])
        }
        schedule = InspectionSchedule(
            id="inspection-schedule-sample-001",
            projectId=project_id,
            contractId=contract_id,
            scheduleName="리움미술관 승강기 교체공사 공사안전보건대장 이행점검",
            basisType="contract_period",
            cycleText="3개월 이내 1회",
            totalRounds=10,
            startDate="2025-10-01",
            endDate="2028-02-29",
            status="active",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.schedules[schedule.id] = deepcopy(schedule)

        rounds: list[InspectionRound] = []
        schedule_rows = [
            (1, "2026-01", "2026-01-23", "2026-01-23", "제2026-01호", None, "checked"),
            (2, "2026-04", None, None, "제2026-02호", None, "planned"),
            (3, "2026-07", None, None, "제2026-03호", None, "planned"),
            (4, "2026-10", None, None, "제2026-04호", "1차기성", "planned"),
            (5, "2027-01", None, None, "제2027-05호", None, "planned"),
            (6, "2027-04", None, None, "제2027-06호", None, "planned"),
            (7, "2027-07", None, None, "제2027-07호", None, "planned"),
            (8, "2027-10", None, None, "제2027-08호", None, "planned"),
            (9, "2028-01", None, None, "제2028-09호", None, "planned"),
            (10, "2028-02", None, None, "제2028-10호", "준공금", "planned"),
        ]
        for round_no, planned_month, planned_date, actual_date, document_no, milestone, status in schedule_rows:
            round_id = f"round-sample-{round_no:03d}"
            round_item = InspectionRound(
                id=round_id,
                projectId=project_id,
                scheduleId=schedule.id,
                roundNo=round_no,
                name=f"{round_no}회 점검",
                documentNo=document_no,
                plannedMonth=planned_month,
                plannedDate=planned_date,
                actualInspectionDate=actual_date,
                reportDueDate=None,
                milestoneLabel=milestone,
                status=status,
                createdAt=created_at,
                updatedAt=created_at,
                nextInspectionDate=planned_date or f"{planned_month}-01",
                documentInstances=deepcopy(seed_documents_by_round.get(round_id, [])),
            )
            rounds.append(round_item)
            self.rounds[round_id] = deepcopy(round_item)
            if milestone:
                self.milestones[round_id] = InspectionRoundMilestone(
                    id=f"inspection-milestone-{round_no:03d}",
                    projectId=project_id,
                    inspectionRoundId=round_id,
                    label=milestone,
                    linkedContractId=contract_id,
                    createdAt=created_at,
                )
            self.auditLogs[round_id] = [
                AuditLog(
                    id=f"inspection-audit-{round_no:03d}",
                    entityType="inspection_round",
                    entityId=round_id,
                    action="inspection-round.created",
                    summary=f"{round_no}회 점검회차가 생성되었습니다.",
                    fieldNames=["roundNo", "plannedMonth", "documentNo"],
                    createdAt=created_at,
                )
            ]

        owner_parties = [
            party
            for party in self.project_repository.list_project_parties(project_id)
            if party.role == "owner" and party.requiresSeparateReport and party.ownerPartyId
        ]
        for round_item in rounds:
            for owner_index, owner_party in enumerate(owner_parties, start=1):
                task = InspectionOwnerReportTask(
                    id=f"owner-report-task-{round_item.roundNo:03d}-{owner_index:02d}",
                    projectId=project_id,
                    inspectionRoundId=round_item.id,
                    ownerPartyId=owner_party.ownerPartyId or "",
                    ownerDisplayName=next(
                        (
                            organization.name
                            for organization in self.project_repository.list_organizations()
                            if organization.id == owner_party.organizationId
                        ),
                        owner_party.organizationId,
                    ),
                    status="drafting" if round_item.roundNo == 1 else "not_started",
                    createdAt=created_at,
                    updatedAt=created_at,
                )
                self.ownerReportTasks[task.id] = deepcopy(task)
            for task in self._build_default_tasks(round_item, created_at):
                self.tasks[task.id] = deepcopy(task)

        attachment = WorkScheduleAttachment(
            id="inspection-attachment-sample-001",
            projectId=project_id,
            inspectionRoundId="round-sample-001",
            fileId="file-asset-sample-schedule-001",
            fileName="2026_공사일정표.pdf",
            storagePath="/리움미술관 승강기 교체공사/01_점검회차/2026_공사일정표.pdf",
            attachmentType="master_schedule",
            sourceLabel="프로젝트 전체 공정표",
            createdAt=created_at,
            updatedAt=created_at,
        )
        self.attachments[attachment.id] = deepcopy(attachment)
        self.rescheduleLogs["round-sample-001"] = []
        self._sync_project(project_id)

    def _build_default_tasks(self, round_item: InspectionRound, created_at: str) -> list[InspectionTask]:
        title_pairs = [
            ("schedule_confirm", "점검 일정 확인"),
            ("owner_coordination", "발주처 일정 협의"),
            ("contractor_coordination", "시공사 일정 협의"),
            ("prepare_materials", "점검 준비자료 확인"),
            ("site_inspection", "현장점검"),
            ("checklist_input", "체크리스트 입력 완료"),
            ("finding_summary", "지적사항 정리"),
            ("photo_ledger", "사진대지 정리"),
            ("report_draft", "보고서 초안 작성"),
            ("internal_review", "내부 검토"),
            ("owner_submission", "발주처별 보고서 제출"),
        ]
        tasks: list[InspectionTask] = []
        for index, (task_type, title) in enumerate(title_pairs, start=1):
            tasks.append(
                InspectionTask(
                    id=f"inspection-task-{round_item.roundNo:03d}-{index:02d}",
                    projectId=round_item.projectId,
                    inspectionRoundId=round_item.id,
                    taskType=task_type,
                    title=title,
                    dueDate=round_item.plannedDate,
                    status="done" if round_item.roundNo == 1 and index <= 3 else "todo",
                    createdAt=created_at,
                    updatedAt=created_at,
                )
            )
        return tasks

    def _sync_project(self, project_id: str) -> None:
        rounds = self.list_rounds(project_id)
        self.project_repository.set_inspection_rounds(project_id, rounds)
        counts = self.project_repository.get_related_counts(project_id)
        counts.inspectionRounds = len(rounds)
        self.project_repository.set_related_counts(project_id, counts)

    def list_schedules(self, project_id: str) -> list[InspectionSchedule]:
        return [deepcopy(item) for item in self.schedules.values() if item.projectId == project_id]

    def get_schedule(self, schedule_id: str) -> InspectionSchedule | None:
        item = self.schedules.get(schedule_id)
        return deepcopy(item) if item else None

    def create_schedule(self, schedule: InspectionSchedule) -> InspectionSchedule:
        self.schedules[schedule.id] = deepcopy(schedule)
        return deepcopy(schedule)

    def update_schedule(self, schedule_id: str, schedule: InspectionSchedule) -> InspectionSchedule:
        self.schedules[schedule_id] = deepcopy(schedule)
        return deepcopy(schedule)

    def delete_schedule(self, schedule_id: str) -> None:
        self.schedules.pop(schedule_id, None)

    def list_rounds(self, project_id: str) -> list[InspectionRound]:
        return sorted(
            [deepcopy(item) for item in self.rounds.values() if item.projectId == project_id],
            key=lambda item: item.roundNo,
        )

    def get_round(self, inspection_round_id: str) -> InspectionRound | None:
        item = self.rounds.get(inspection_round_id)
        return deepcopy(item) if item else None

    def create_round(self, round_item: InspectionRound) -> InspectionRound:
        self.rounds[round_item.id] = deepcopy(round_item)
        self._sync_project(round_item.projectId)
        return deepcopy(round_item)

    def update_round(self, inspection_round_id: str, round_item: InspectionRound) -> InspectionRound:
        self.rounds[inspection_round_id] = deepcopy(round_item)
        self._sync_project(round_item.projectId)
        return deepcopy(round_item)

    def delete_round(self, inspection_round_id: str) -> None:
        round_item = self.rounds.pop(inspection_round_id, None)
        if not round_item:
            return
        for task_id in [item.id for item in self.list_tasks(inspection_round_id)]:
            self.tasks.pop(task_id, None)
        for task_id in [item.id for item in self.list_owner_report_tasks(inspection_round_id)]:
            self.ownerReportTasks.pop(task_id, None)
        for attachment_id in [item.id for item in self.list_attachments(inspection_round_id)]:
            self.attachments.pop(attachment_id, None)
        self.rescheduleLogs.pop(inspection_round_id, None)
        self.auditLogs.pop(inspection_round_id, None)
        self.milestones.pop(inspection_round_id, None)
        self._sync_project(round_item.projectId)

    def list_owner_report_tasks(self, inspection_round_id: str) -> list[InspectionOwnerReportTask]:
        return [
            deepcopy(item)
            for item in self.ownerReportTasks.values()
            if item.inspectionRoundId == inspection_round_id
        ]

    def get_owner_report_task(self, task_id: str) -> InspectionOwnerReportTask | None:
        item = self.ownerReportTasks.get(task_id)
        return deepcopy(item) if item else None

    def save_owner_report_task(self, task: InspectionOwnerReportTask) -> InspectionOwnerReportTask:
        self.ownerReportTasks[task.id] = deepcopy(task)
        return deepcopy(task)

    def list_tasks(self, inspection_round_id: str) -> list[InspectionTask]:
        return [
            deepcopy(item)
            for item in self.tasks.values()
            if item.inspectionRoundId == inspection_round_id
        ]

    def get_task(self, task_id: str) -> InspectionTask | None:
        item = self.tasks.get(task_id)
        return deepcopy(item) if item else None

    def save_task(self, task: InspectionTask) -> InspectionTask:
        self.tasks[task.id] = deepcopy(task)
        return deepcopy(task)

    def list_attachments(self, inspection_round_id: str) -> list[WorkScheduleAttachment]:
        return [
            deepcopy(item)
            for item in self.attachments.values()
            if item.inspectionRoundId == inspection_round_id
        ]

    def get_attachment(self, attachment_id: str) -> WorkScheduleAttachment | None:
        item = self.attachments.get(attachment_id)
        return deepcopy(item) if item else None

    def save_attachment(self, attachment: WorkScheduleAttachment) -> WorkScheduleAttachment:
        self.attachments[attachment.id] = deepcopy(attachment)
        return deepcopy(attachment)

    def delete_attachment(self, attachment_id: str) -> None:
        self.attachments.pop(attachment_id, None)

    def list_reschedule_logs(self, inspection_round_id: str) -> list[InspectionRescheduleLog]:
        return deepcopy(self.rescheduleLogs.get(inspection_round_id, []))

    def add_reschedule_log(self, log: InspectionRescheduleLog) -> InspectionRescheduleLog:
        self.rescheduleLogs.setdefault(log.inspectionRoundId, []).append(deepcopy(log))
        return deepcopy(log)

    def list_audit_logs(self, inspection_round_id: str) -> list[AuditLog]:
        return deepcopy(self.auditLogs.get(inspection_round_id, []))

    def add_audit_log(self, log: AuditLog) -> AuditLog:
        self.auditLogs.setdefault(log.entityId, []).append(deepcopy(log))
        return deepcopy(log)

    def get_milestone(self, inspection_round_id: str) -> InspectionRoundMilestone | None:
        item = self.milestones.get(inspection_round_id)
        return deepcopy(item) if item else None

    def save_milestone(self, milestone: InspectionRoundMilestone) -> InspectionRoundMilestone:
        self.milestones[milestone.inspectionRoundId] = deepcopy(milestone)
        return deepcopy(milestone)
