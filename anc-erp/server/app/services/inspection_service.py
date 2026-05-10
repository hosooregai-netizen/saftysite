from dataclasses import asdict
from datetime import datetime
from uuid import uuid4

from server.app.domain.models import (
    AuditLog,
    Contract,
    DocumentInstance,
    InspectionOwnerReportTask,
    InspectionRescheduleLog,
    InspectionRound,
    InspectionRoundMilestone,
    InspectionSchedule,
    InspectionTask,
    Project,
    WorkScheduleAttachment,
)
from server.app.repositories.contract_repository import ContractRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.project_repository import ProjectRepository


class InspectionNotFoundError(Exception):
    pass


class InspectionValidationError(Exception):
    pass


class InspectionService:
    def __init__(
        self,
        repository: InspectionRepository,
        project_repository: ProjectRepository,
        contract_repository: ContractRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.contract_repository = contract_repository

    def list_schedules(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [asdict(item) for item in self.repository.list_schedules(project_id)]

    def create_schedule(self, project_id: str, payload: dict) -> dict:
        self._require_project(project_id)
        self._validate_schedule_payload(payload)
        schedule = self._build_schedule(project_id, payload)
        created = self.repository.create_schedule(schedule)
        return {"schedule": asdict(created), "warnings": []}

    def get_schedule(self, schedule_id: str) -> dict:
        schedule = self.repository.get_schedule(schedule_id)
        if not schedule:
            raise InspectionNotFoundError("inspection schedule not found")
        rounds = [
            asdict(item)
            for item in self.repository.list_rounds(schedule.projectId)
            if item.scheduleId == schedule.id
        ]
        return {
            "schedule": asdict(schedule),
            "rounds": rounds,
        }

    def update_schedule(self, schedule_id: str, payload: dict) -> dict:
        schedule = self.repository.get_schedule(schedule_id)
        if not schedule:
            raise InspectionNotFoundError("inspection schedule not found")
        merged = {**asdict(schedule), **payload}
        self._validate_schedule_payload(merged)
        for key, value in payload.items():
            if hasattr(schedule, key):
                setattr(schedule, key, value)
        schedule.updatedAt = self._now()
        updated = self.repository.update_schedule(schedule_id, schedule)
        return {"schedule": asdict(updated), "warnings": []}

    def delete_schedule(self, schedule_id: str) -> dict:
        schedule = self.repository.get_schedule(schedule_id)
        if not schedule:
            raise InspectionNotFoundError("inspection schedule not found")
        self.repository.delete_schedule(schedule_id)
        return {"deleted": True}

    def preview_schedule(self, project_id: str, payload: dict) -> dict:
        project = self._require_project(project_id)
        self._validate_schedule_payload(payload)
        contract = self._resolve_contract(project_id, payload.get("contractId"))
        rounds = self._build_round_drafts(project, contract, payload)
        owner_report_tasks = self._build_owner_report_task_drafts(project_id, rounds)
        warnings = []
        if not payload.get("startDate") and not payload.get("rounds") and not project.startDate:
            warnings.append("scheduleDatesMissing")
        return {
            "projectId": project_id,
            "scheduleDraft": {
                "scheduleName": payload.get("scheduleName") or f"{project.projectName} 점검일정",
                "basisType": payload["basisType"],
                "cycleText": payload["cycleText"],
                "totalRounds": payload["totalRounds"],
                "contractId": payload.get("contractId"),
            },
            "rounds": rounds,
            "ownerReportTasks": owner_report_tasks,
            "warnings": warnings,
            "isDraft": True,
        }

    def generate_schedule(self, project_id: str, payload: dict) -> dict:
        project = self._require_project(project_id)
        self._validate_schedule_payload(payload)
        contract = self._resolve_contract(project_id, payload.get("contractId"))
        round_drafts = self._build_round_drafts(project, contract, payload)
        self._ensure_round_nos_unique(project_id, [item["roundNo"] for item in round_drafts])

        schedule = self._build_schedule(project_id, payload)
        created_schedule = self.repository.create_schedule(schedule)
        created_rounds: list[InspectionRound] = []
        created_tasks: list[InspectionTask] = []
        created_owner_tasks: list[InspectionOwnerReportTask] = []
        for draft in round_drafts:
            round_item = InspectionRound(
                id=f"inspection-round-{uuid4().hex[:8]}",
                projectId=project_id,
                scheduleId=created_schedule.id,
                roundNo=draft["roundNo"],
                name=draft["name"],
                documentNo=draft["documentNo"],
                plannedMonth=draft.get("plannedMonth"),
                plannedDate=draft.get("plannedDate"),
                actualInspectionDate=draft.get("actualInspectionDate"),
                status=draft["status"],
                milestoneLabel=draft.get("milestoneLabel"),
                reportDueDate=draft.get("reportDueDate"),
                nextInspectionDate=draft.get("plannedDate") or (f"{draft['plannedMonth']}-01" if draft.get("plannedMonth") else None),
                createdAt=self._now(),
                updatedAt=self._now(),
            )
            self.repository.create_round(round_item)
            created_rounds.append(round_item)
            if round_item.milestoneLabel:
                self.repository.save_milestone(
                    InspectionRoundMilestone(
                        id=f"inspection-milestone-{uuid4().hex[:8]}",
                        projectId=project_id,
                        inspectionRoundId=round_item.id,
                        label=round_item.milestoneLabel,
                        linkedContractId=contract.id if contract else None,
                        createdAt=self._now(),
                    )
                )
            created_owner_tasks.extend(self._persist_owner_report_tasks(project_id, round_item))
            created_tasks.extend(self._create_default_tasks(round_item))
            self.repository.add_audit_log(
                AuditLog(
                    id=f"audit-{uuid4().hex[:8]}",
                    entityType="inspection_round",
                    entityId=round_item.id,
                    action="inspection-round.created",
                    summary=f"{round_item.roundNo}회 점검회차가 생성되었습니다.",
                    fieldNames=["roundNo", "plannedMonth", "documentNo"],
                    createdAt=self._now(),
                )
            )
        return {
            "schedule": asdict(created_schedule),
            "rounds": [asdict(item) for item in created_rounds],
            "ownerReportTasks": [asdict(item) for item in created_owner_tasks],
            "tasks": [asdict(item) for item in created_tasks],
            "warnings": [],
            "isDraft": False,
        }

    def list_rounds(self, project_id: str) -> list[dict]:
        self._require_project(project_id)
        return [self._serialize_round_list_item(item) for item in self.repository.list_rounds(project_id)]

    def create_round(self, project_id: str, payload: dict) -> dict:
        self._require_project(project_id)
        if payload.get("roundNo") is None:
            raise InspectionValidationError("roundNo is required")
        self._ensure_round_nos_unique(project_id, [payload["roundNo"]])
        round_item = InspectionRound(
            id=f"inspection-round-{uuid4().hex[:8]}",
            projectId=project_id,
            scheduleId=payload.get("scheduleId"),
            roundNo=payload["roundNo"],
            name=payload.get("name") or f"{payload['roundNo']}회 점검",
            documentNo=payload.get("documentNo") or self._default_document_no(payload["roundNo"], payload.get("plannedMonth"), payload.get("plannedDate")),
            plannedMonth=payload.get("plannedMonth"),
            plannedDate=payload.get("plannedDate"),
            actualInspectionDate=payload.get("actualInspectionDate"),
            inspectorUserId=payload.get("inspectorUserId"),
            confirmerContactId=payload.get("confirmerContactId"),
            contractorContactId=payload.get("contractorContactId"),
            reportDueDate=payload.get("reportDueDate"),
            milestoneLabel=payload.get("milestoneLabel"),
            memo=payload.get("memo"),
            status=payload.get("status", "planned"),
            nextInspectionDate=payload.get("plannedDate") or (f"{payload['plannedMonth']}-01" if payload.get("plannedMonth") else None),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.create_round(round_item)
        return {"round": asdict(created), "warnings": []}

    def get_round(self, inspection_round_id: str) -> dict:
        round_item = self._require_round(inspection_round_id)
        project = self._require_project(round_item.projectId)
        schedule = self.repository.get_schedule(round_item.scheduleId) if round_item.scheduleId else None
        owner_tasks = self.repository.list_owner_report_tasks(inspection_round_id)
        tasks = self.repository.list_tasks(inspection_round_id)
        attachments = self.repository.list_attachments(inspection_round_id)
        milestone = self.repository.get_milestone(inspection_round_id)
        return {
            "round": asdict(round_item),
            "project": asdict(project),
            "schedule": asdict(schedule) if schedule else None,
            "ownerReportTasks": [asdict(item) for item in owner_tasks],
            "tasks": [asdict(item) for item in tasks],
            "attachments": [asdict(item) for item in attachments],
            "rescheduleLogs": [asdict(item) for item in self.repository.list_reschedule_logs(inspection_round_id)],
            "auditLogs": [asdict(item) for item in self.repository.list_audit_logs(inspection_round_id)],
            "milestone": asdict(milestone) if milestone else None,
            "warnings": self._round_dependency_warnings(round_item, owner_tasks, tasks),
        }

    def update_round(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        if payload.get("roundNo") and payload["roundNo"] != round_item.roundNo:
            self._ensure_round_nos_unique(round_item.projectId, [payload["roundNo"]])
        if payload.get("status") == "submitted":
            self._require_owner_reports_submitted(inspection_round_id)
        for key, value in payload.items():
            if hasattr(round_item, key):
                setattr(round_item, key, value)
        round_item.updatedAt = self._now()
        round_item.nextInspectionDate = round_item.plannedDate or (f"{round_item.plannedMonth}-01" if round_item.plannedMonth else None)
        updated = self.repository.update_round(inspection_round_id, round_item)
        audit = self.repository.add_audit_log(
            AuditLog(
                id=f"audit-{uuid4().hex[:8]}",
                entityType="inspection_round",
                entityId=inspection_round_id,
                action="inspection-round.updated",
                summary="점검회차 정보가 수정되었습니다.",
                fieldNames=list(payload.keys()),
                createdAt=self._now(),
            )
        )
        return {"round": asdict(updated), "auditLog": asdict(audit), "warnings": []}

    def delete_round(self, inspection_round_id: str) -> dict:
        self._require_round(inspection_round_id)
        self.repository.delete_round(inspection_round_id)
        return {"deleted": True}

    def confirm_round_date(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        round_item.plannedDate = payload.get("plannedDate") or round_item.plannedDate
        round_item.actualInspectionDate = payload.get("actualInspectionDate") or round_item.actualInspectionDate
        round_item.inspectorUserId = payload.get("inspectorUserId") or round_item.inspectorUserId
        round_item.confirmerContactId = payload.get("confirmerContactId") or round_item.confirmerContactId
        round_item.contractorContactId = payload.get("contractorContactId") or round_item.contractorContactId
        round_item.status = "scheduled"
        round_item.updatedAt = self._now()
        round_item.nextInspectionDate = round_item.plannedDate
        updated = self.repository.update_round(inspection_round_id, round_item)
        return {"round": asdict(updated), "warnings": []}

    def reschedule_round(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        reason = (payload.get("reason") or "").strip()
        if not reason:
            raise InspectionValidationError("reason is required")
        log = InspectionRescheduleLog(
            id=f"inspection-reschedule-{uuid4().hex[:8]}",
            projectId=round_item.projectId,
            inspectionRoundId=inspection_round_id,
            previousPlannedDate=round_item.plannedDate,
            nextPlannedDate=payload.get("plannedDate"),
            previousActualInspectionDate=round_item.actualInspectionDate,
            nextActualInspectionDate=payload.get("actualInspectionDate"),
            reason=reason,
            requestedBy=payload.get("requestedBy"),
            approvedBy=payload.get("approvedBy"),
            mailThreadId=payload.get("mailThreadId"),
            fileId=payload.get("fileId"),
            createdAt=self._now(),
        )
        round_item.plannedDate = payload.get("plannedDate") or round_item.plannedDate
        round_item.actualInspectionDate = payload.get("actualInspectionDate") or round_item.actualInspectionDate
        round_item.updatedAt = self._now()
        round_item.status = "scheduled"
        round_item.nextInspectionDate = round_item.plannedDate
        updated = self.repository.update_round(inspection_round_id, round_item)
        stored_log = self.repository.add_reschedule_log(log)
        return {
            "round": asdict(updated),
            "rescheduleLog": asdict(stored_log),
            "warnings": [],
        }

    def close_round(self, inspection_round_id: str) -> dict:
        round_item = self._require_round(inspection_round_id)
        warnings = self._round_dependency_warnings(
            round_item,
            self.repository.list_owner_report_tasks(inspection_round_id),
            self.repository.list_tasks(inspection_round_id),
        )
        if warnings:
            raise InspectionValidationError("close requires dependency check")
        round_item.status = "closed"
        round_item.updatedAt = self._now()
        updated = self.repository.update_round(inspection_round_id, round_item)
        return {"round": asdict(updated), "warnings": []}

    def list_owner_report_tasks(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        return [asdict(item) for item in self.repository.list_owner_report_tasks(inspection_round_id)]

    def generate_owner_report_tasks(self, inspection_round_id: str) -> dict:
        round_item = self._require_round(inspection_round_id)
        tasks = self._persist_owner_report_tasks(round_item.projectId, round_item, force=True)
        return {"ownerReportTasks": [asdict(item) for item in tasks], "warnings": []}

    def update_owner_report_task(self, task_id: str, payload: dict) -> dict:
        task = self._require_owner_report_task(task_id)
        if payload.get("status") == "submitted" and not (payload.get("submittedAt") or payload.get("mailThreadId") or task.submittedAt or task.mailThreadId):
            raise InspectionValidationError("mark-submitted requires submittedAt or mailThreadId")
        for key, value in payload.items():
            if hasattr(task, key):
                setattr(task, key, value)
        task.updatedAt = self._now()
        updated = self.repository.save_owner_report_task(task)
        return {"ownerReportTask": asdict(updated), "warnings": []}

    def link_document(self, task_id: str, document_instance_id: str) -> dict:
        task = self._require_owner_report_task(task_id)
        task.documentInstanceId = document_instance_id
        task.updatedAt = self._now()
        updated = self.repository.save_owner_report_task(task)
        return {"ownerReportTask": asdict(updated), "warnings": []}

    def mark_exported(self, task_id: str, exported_file_id: str) -> dict:
        task = self._require_owner_report_task(task_id)
        task.exportedFileId = exported_file_id
        task.status = "exported"
        task.updatedAt = self._now()
        updated = self.repository.save_owner_report_task(task)
        return {"ownerReportTask": asdict(updated), "warnings": []}

    def mark_submitted(
        self,
        task_id: str,
        submitted_at: str | None,
        mail_thread_id: str | None,
        submission_id: str | None,
    ) -> dict:
        if not submitted_at and not mail_thread_id:
            raise InspectionValidationError("mark-submitted requires submittedAt or mailThreadId")
        task = self._require_owner_report_task(task_id)
        task.submittedAt = submitted_at or self._now()
        task.mailThreadId = mail_thread_id or task.mailThreadId
        task.submissionId = submission_id or task.submissionId
        task.status = "submitted"
        task.updatedAt = self._now()
        updated = self.repository.save_owner_report_task(task)
        return {"ownerReportTask": asdict(updated), "warnings": []}

    def list_tasks(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        return [asdict(item) for item in self.repository.list_tasks(inspection_round_id)]

    def create_task(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        task = InspectionTask(
            id=f"inspection-task-{uuid4().hex[:8]}",
            projectId=round_item.projectId,
            inspectionRoundId=inspection_round_id,
            taskType=payload["taskType"],
            title=payload["title"],
            dueDate=payload.get("dueDate"),
            assigneeId=payload.get("assigneeId"),
            status=payload.get("status", "todo"),
            linkedEntityType=payload.get("linkedEntityType"),
            linkedEntityId=payload.get("linkedEntityId"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.save_task(task)
        return {"task": asdict(created), "warnings": []}

    def update_task(self, task_id: str, payload: dict) -> dict:
        task = self.repository.get_task(task_id)
        if not task:
            raise InspectionNotFoundError("inspection task not found")
        for key, value in payload.items():
            if hasattr(task, key):
                setattr(task, key, value)
        task.updatedAt = self._now()
        updated = self.repository.save_task(task)
        return {"task": asdict(updated), "warnings": []}

    def generate_default_tasks(self, inspection_round_id: str) -> dict:
        round_item = self._require_round(inspection_round_id)
        created = self._create_default_tasks(round_item)
        return {"tasks": [asdict(item) for item in created], "warnings": []}

    def _create_default_tasks(self, round_item: InspectionRound) -> list[InspectionTask]:
        existing_types = {item.taskType for item in self.repository.list_tasks(round_item.id)}
        created: list[InspectionTask] = []
        for task in self.repository._build_default_tasks(round_item, self._now()):  # type: ignore[attr-defined]
            if task.taskType in existing_types:
                continue
            created.append(self.repository.save_task(task))
        return created

    def list_attachments(self, inspection_round_id: str) -> list[dict]:
        self._require_round(inspection_round_id)
        return [asdict(item) for item in self.repository.list_attachments(inspection_round_id)]

    def create_attachment(self, inspection_round_id: str, payload: dict) -> dict:
        round_item = self._require_round(inspection_round_id)
        attachment = WorkScheduleAttachment(
            id=f"inspection-attachment-{uuid4().hex[:8]}",
            projectId=round_item.projectId,
            inspectionRoundId=inspection_round_id,
            fileId=payload["fileId"],
            fileName=payload["fileName"],
            storagePath=payload["storagePath"],
            attachmentType=payload["attachmentType"],
            sourceLabel=payload.get("sourceLabel"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        created = self.repository.save_attachment(attachment)
        return {"attachment": asdict(created), "warnings": []}

    def update_attachment(self, attachment_id: str, payload: dict) -> dict:
        attachment = self.repository.get_attachment(attachment_id)
        if not attachment:
            raise InspectionNotFoundError("work schedule attachment not found")
        for key, value in payload.items():
            if hasattr(attachment, key):
                setattr(attachment, key, value)
        attachment.updatedAt = self._now()
        updated = self.repository.save_attachment(attachment)
        return {"attachment": asdict(updated), "warnings": []}

    def delete_attachment(self, attachment_id: str) -> dict:
        attachment = self.repository.get_attachment(attachment_id)
        if not attachment:
            raise InspectionNotFoundError("work schedule attachment not found")
        self.repository.delete_attachment(attachment_id)
        return {"deleted": True}

    def get_calendar_rounds(self, date_from: str | None = None, date_to: str | None = None) -> dict:
        rounds = [item for item in self.repository.rounds.values()]
        filtered = [item for item in rounds if self._date_in_range(item.plannedDate or self._month_to_date(item.plannedMonth), date_from, date_to)]
        return {
            "dateFrom": date_from,
            "dateTo": date_to,
            "rounds": [self._serialize_round_list_item(item) for item in sorted(filtered, key=lambda item: item.roundNo)],
        }

    def get_calendar_tasks(self, date_from: str | None = None, date_to: str | None = None) -> dict:
        tasks = [item for item in self.repository.tasks.values()]
        filtered = [item for item in tasks if self._date_in_range(item.dueDate, date_from, date_to)]
        return {
            "dateFrom": date_from,
            "dateTo": date_to,
            "tasks": [asdict(item) for item in filtered],
        }

    def _build_schedule(self, project_id: str, payload: dict) -> InspectionSchedule:
        return InspectionSchedule(
            id=f"inspection-schedule-{uuid4().hex[:8]}",
            projectId=project_id,
            contractId=payload.get("contractId"),
            scheduleName=payload["scheduleName"],
            basisType=payload["basisType"],
            cycleText=payload["cycleText"],
            totalRounds=payload["totalRounds"],
            startDate=payload.get("startDate"),
            endDate=payload.get("endDate"),
            status=payload.get("status", "draft"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )

    def _build_round_drafts(self, project: Project, contract: Contract | None, payload: dict) -> list[dict]:
        explicit_rounds = payload.get("rounds") or []
        if explicit_rounds:
            return [
                {
                    "roundNo": item["roundNo"],
                    "name": f"{item['roundNo']}회 점검",
                    "plannedMonth": item.get("plannedMonth"),
                    "plannedDate": item.get("plannedDate"),
                    "actualInspectionDate": item.get("actualInspectionDate"),
                    "documentNo": item.get("documentNo") or self._default_document_no(item["roundNo"], item.get("plannedMonth"), item.get("plannedDate")),
                    "milestoneLabel": item.get("milestoneLabel"),
                    "reportDueDate": None,
                    "status": "scheduled" if item.get("plannedDate") else "planned",
                }
                for item in explicit_rounds
            ]
        if project.id == "project-sample-001" and payload.get("totalRounds") == 10:
            return [
                {
                    "roundNo": 1,
                    "name": "1회 점검",
                    "plannedMonth": "2026-01",
                    "plannedDate": "2026-01-23",
                    "actualInspectionDate": "2026-01-23",
                    "documentNo": "제2026-01호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "checked",
                },
                {
                    "roundNo": 2,
                    "name": "2회 점검",
                    "plannedMonth": "2026-04",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2026-02호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 3,
                    "name": "3회 점검",
                    "plannedMonth": "2026-07",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2026-03호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 4,
                    "name": "4회 점검",
                    "plannedMonth": "2026-10",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2026-04호",
                    "milestoneLabel": "1차기성",
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 5,
                    "name": "5회 점검",
                    "plannedMonth": "2027-01",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2027-05호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 6,
                    "name": "6회 점검",
                    "plannedMonth": "2027-04",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2027-06호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 7,
                    "name": "7회 점검",
                    "plannedMonth": "2027-07",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2027-07호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 8,
                    "name": "8회 점검",
                    "plannedMonth": "2027-10",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2027-08호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 9,
                    "name": "9회 점검",
                    "plannedMonth": "2028-01",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2028-09호",
                    "milestoneLabel": None,
                    "reportDueDate": None,
                    "status": "planned",
                },
                {
                    "roundNo": 10,
                    "name": "10회 점검",
                    "plannedMonth": "2028-02",
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": "제2028-10호",
                    "milestoneLabel": "준공금",
                    "reportDueDate": None,
                    "status": "planned",
                },
            ]
        rounds: list[dict] = []
        total_rounds = payload["totalRounds"]
        start_month = payload.get("startDate") or contract.contractStartDate if contract else payload.get("startDate") or project.startDate
        for round_no in range(1, total_rounds + 1):
            planned_month = None
            if start_month:
                planned_month = self._shift_month(start_month, (round_no - 1) * 3)
            rounds.append(
                {
                    "roundNo": round_no,
                    "name": f"{round_no}회 점검",
                    "plannedMonth": planned_month[:7] if planned_month else None,
                    "plannedDate": None,
                    "actualInspectionDate": None,
                    "documentNo": self._default_document_no(round_no, planned_month[:7] if planned_month else None, None),
                    "milestoneLabel": self._infer_milestone_label(round_no, total_rounds),
                    "reportDueDate": None,
                    "status": "planned",
                }
            )
        return rounds

    def _build_owner_report_task_drafts(self, project_id: str, rounds: list[dict]) -> list[dict]:
        owners = [
            party
            for party in self.project_repository.list_project_parties(project_id)
            if party.role == "owner" and party.requiresSeparateReport and party.ownerPartyId
        ]
        organizations = {organization.id: organization.name for organization in self.project_repository.list_organizations()}
        drafts: list[dict] = []
        for round_item in rounds:
            for owner in owners:
                drafts.append(
                    {
                        "roundNo": round_item["roundNo"],
                        "ownerPartyId": owner.ownerPartyId,
                        "ownerDisplayName": organizations.get(owner.organizationId, owner.organizationId),
                        "status": "not_started",
                    }
                )
        return drafts

    def _persist_owner_report_tasks(self, project_id: str, round_item: InspectionRound, force: bool = False) -> list[InspectionOwnerReportTask]:
        owners = [
            party
            for party in self.project_repository.list_project_parties(project_id)
            if party.role == "owner" and party.requiresSeparateReport and party.ownerPartyId
        ]
        organizations = {organization.id: organization.name for organization in self.project_repository.list_organizations()}
        existing = self.repository.list_owner_report_tasks(round_item.id)
        existing_owner_ids = {item.ownerPartyId for item in existing}
        created: list[InspectionOwnerReportTask] = []
        for owner in owners:
            if not force and owner.ownerPartyId in existing_owner_ids:
                continue
            task = InspectionOwnerReportTask(
                id=f"owner-report-task-{uuid4().hex[:8]}",
                projectId=project_id,
                inspectionRoundId=round_item.id,
                ownerPartyId=owner.ownerPartyId or "",
                ownerDisplayName=organizations.get(owner.organizationId, owner.organizationId),
                status="not_started",
                createdAt=self._now(),
                updatedAt=self._now(),
            )
            created.append(self.repository.save_owner_report_task(task))
        return existing + created if force else created

    def _serialize_round_list_item(self, round_item: InspectionRound) -> dict:
        owner_tasks = self.repository.list_owner_report_tasks(round_item.id)
        tasks = self.repository.list_tasks(round_item.id)
        return {
            "round": asdict(round_item),
            "ownerReportTasks": [asdict(item) for item in owner_tasks],
            "openTaskCount": len([item for item in tasks if item.status != "done"]),
            "reportTargetCount": len(owner_tasks),
            "warnings": self._round_dependency_warnings(round_item, owner_tasks, tasks),
        }

    def _round_dependency_warnings(
        self,
        round_item: InspectionRound,
        owner_tasks: list[InspectionOwnerReportTask],
        tasks: list[InspectionTask],
    ) -> list[str]:
        warnings: list[str] = []
        if round_item.plannedDate and not round_item.actualInspectionDate and round_item.status in {"scheduled", "in_progress"}:
            warnings.append("actualInspectionDateMissing")
        if any(item.status not in {"submitted", "confirmed"} for item in owner_tasks):
            warnings.append("ownerReportsNotSubmitted")
        if any(item.status != "done" for item in tasks if item.taskType in {"checklist_input", "photo_ledger", "report_draft"}):
            warnings.append("roundDependenciesIncomplete")
        return warnings

    def _require_owner_reports_submitted(self, inspection_round_id: str) -> None:
        owner_tasks = self.repository.list_owner_report_tasks(inspection_round_id)
        if any(item.status not in {"submitted", "confirmed"} for item in owner_tasks):
            raise InspectionValidationError("round submitted requires all owner reports submitted")

    def _validate_schedule_payload(self, payload: dict) -> None:
        if payload.get("totalRounds") is None or payload["totalRounds"] <= 0:
            raise InspectionValidationError("totalRounds must be greater than 0")
        if not payload.get("basisType"):
            raise InspectionValidationError("basisType is required")
        if not payload.get("cycleText"):
            raise InspectionValidationError("cycleText is required")
        if payload.get("startDate") and payload.get("endDate") and payload["startDate"] > payload["endDate"]:
            raise InspectionValidationError("startDate must be earlier than endDate")

    def _ensure_round_nos_unique(self, project_id: str, round_nos: list[int]) -> None:
        existing = {item.roundNo for item in self.repository.list_rounds(project_id)}
        for round_no in round_nos:
            if round_no in existing:
                raise InspectionValidationError("roundNo must be unique per project")

    def _require_project(self, project_id: str) -> Project:
        project = self.project_repository.get_project(project_id)
        if not project:
            raise InspectionNotFoundError("project not found")
        return project

    def _resolve_contract(self, project_id: str, contract_id: str | None) -> Contract | None:
        if contract_id:
            contract = self.contract_repository.get_contract(contract_id)
            if contract and contract.projectId == project_id:
                return contract
        contracts = self.contract_repository.list_contracts(project_id)
        return contracts[0] if contracts else None

    def _require_round(self, inspection_round_id: str) -> InspectionRound:
        round_item = self.repository.get_round(inspection_round_id)
        if not round_item:
            raise InspectionNotFoundError("inspection round not found")
        return round_item

    def _require_owner_report_task(self, task_id: str) -> InspectionOwnerReportTask:
        task = self.repository.get_owner_report_task(task_id)
        if not task:
            raise InspectionNotFoundError("owner report task not found")
        return task

    def _default_document_no(self, round_no: int, planned_month: str | None, planned_date: str | None) -> str:
        year = "2026"
        if planned_date:
            year = planned_date[:4]
        elif planned_month:
            year = planned_month[:4]
        return f"제{year}-{round_no:02d}호"

    def _infer_milestone_label(self, round_no: int, total_rounds: int) -> str | None:
        if round_no == 4:
            return "1차기성"
        if round_no == total_rounds:
            return "준공금"
        return None

    def _month_to_date(self, planned_month: str | None) -> str | None:
        if not planned_month:
            return None
        return f"{planned_month}-01"

    def _date_in_range(self, target: str | None, date_from: str | None, date_to: str | None) -> bool:
        if not target:
            return False
        if date_from and target < date_from:
            return False
        if date_to and target > date_to:
            return False
        return True

    def _shift_month(self, start_date: str, month_delta: int) -> str:
        start = datetime.strptime(start_date[:10], "%Y-%m-%d")
        year = start.year + (start.month - 1 + month_delta) // 12
        month = (start.month - 1 + month_delta) % 12 + 1
        return f"{year:04d}-{month:02d}-01"

    def _now(self) -> str:
        return "2026-05-10T09:00:00+09:00"
