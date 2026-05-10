from dataclasses import asdict
from uuid import uuid4

from server.app.domain.models import (
    AlertRule,
    DashboardAlert,
    DashboardInsightRun,
    DashboardMetric,
    DashboardSnapshot,
    DashboardWidget,
    FindingAgingBucket,
    OwnerReportStatusSummary,
    ProjectHealthMetric,
    StatisticsMetric,
)
from server.app.repositories.approval_repository import ApprovalRepository
from server.app.repositories.dashboard_repository import DashboardRepository
from server.app.repositories.finding_repository import FindingRepository
from server.app.repositories.inspection_repository import InspectionRepository
from server.app.repositories.mail_repository import MailRepository
from server.app.repositories.project_repository import ProjectRepository
from server.app.repositories.safety_cost_repository import SafetyCostRepository
from server.app.repositories.safety_report_repository import SafetyReportRepository
from server.app.repositories.webhard_repository import WebhardRepository


class DashboardNotFoundError(Exception):
    pass


class DashboardValidationError(Exception):
    pass


class DashboardService:
    def __init__(
        self,
        repository: DashboardRepository,
        project_repository: ProjectRepository,
        inspection_repository: InspectionRepository,
        finding_repository: FindingRepository,
        safety_cost_repository: SafetyCostRepository,
        safety_report_repository: SafetyReportRepository,
        approval_repository: ApprovalRepository,
        mail_repository: MailRepository,
        webhard_repository: WebhardRepository,
    ) -> None:
        self.repository = repository
        self.project_repository = project_repository
        self.inspection_repository = inspection_repository
        self.finding_repository = finding_repository
        self.safety_cost_repository = safety_cost_repository
        self.safety_report_repository = safety_report_repository
        self.approval_repository = approval_repository
        self.mail_repository = mail_repository
        self.webhard_repository = webhard_repository

    def _now(self) -> str:
        return "2026-05-10T16:30:00+09:00"

    def _today(self) -> str:
        return "2026-05-10"

    def _next_id(self, prefix: str) -> str:
        return f"{prefix}-{uuid4().hex[:8]}"

    def _stats_meta(
        self,
        series_key: str,
        source_models: list[str],
        calculation_note: str,
        period_start: str = "2026-01-01",
        period_end: str | None = None,
    ) -> dict:
        return {
            "seriesKey": series_key,
            "basisDate": self._today(),
            "periodStart": period_start,
            "periodEnd": period_end or self._today(),
            "calculationNote": calculation_note,
            "sourceModels": source_models,
        }

    def _accessible_project_ids(self, project_ids: list[str] | None = None) -> list[str]:
        seeded_ids = [item.project.id for item in self.project_repository.list_project_aggregates()]
        if not project_ids:
            return seeded_ids
        allowed = set(seeded_ids)
        return [item for item in project_ids if item in allowed]

    def _project_aggregates(self, project_ids: list[str] | None = None):
        allowed = set(self._accessible_project_ids(project_ids))
        return [item for item in self.project_repository.list_project_aggregates() if item.project.id in allowed]

    def _project(self, project_id: str):
        project = self.project_repository.get_project(project_id)
        if not project:
            raise DashboardNotFoundError(f"Project not found: {project_id}")
        return project

    def _round_report_summaries(self, project_ids: list[str] | None = None) -> list[OwnerReportStatusSummary]:
        rows: list[OwnerReportStatusSummary] = []
        for aggregate in self._project_aggregates(project_ids):
            for round_item in self.inspection_repository.list_rounds(aggregate.project.id):
                for task in self.inspection_repository.list_owner_report_tasks(round_item.id):
                    rows.append(
                        OwnerReportStatusSummary(
                            id=f"owner-report-summary-{task.id}",
                            projectId=task.projectId,
                            inspectionRoundId=task.inspectionRoundId,
                            ownerPartyId=task.ownerPartyId,
                            ownerDisplayName=task.ownerDisplayName or task.ownerPartyId,
                            status=task.status,
                            documentId=task.documentInstanceId,
                            submissionId=task.submissionId,
                            mailThreadId=task.mailThreadId,
                            dueDate=round_item.reportDueDate or round_item.plannedDate,
                            submittedAt=task.submittedAt,
                        )
                    )
        return rows

    def _pending_approvals(self, project_ids: list[str] | None = None) -> list[dict]:
        rows: list[dict] = []
        allowed = set(self._accessible_project_ids(project_ids))
        for workflow in self.approval_repository.list_workflows():
            if workflow.projectId not in allowed:
                continue
            steps = self.approval_repository.list_steps(workflow.id)
            current_step = next((item for item in steps if item.status == "current"), None)
            document = self.approval_repository.get_document(workflow.documentId)
            signature_tasks = self.approval_repository.list_signature_tasks(workflow.documentId)
            missing_signature_tasks = [
                asdict(item)
                for item in signature_tasks
                if item.status not in {"completed", "waived"}
            ]
            rows.append(
                {
                    "workflow": asdict(workflow),
                    "document": asdict(document) if document else None,
                    "currentStep": asdict(current_step) if current_step else None,
                    "signatureTasks": [asdict(item) for item in signature_tasks],
                    "missingSignatureTasks": missing_signature_tasks,
                    "missingRequiredSignatureCount": len([item for item in signature_tasks if item.required and item.status not in {"completed", "waived"}]),
                    "pendingRequiredCount": len(
                        [item for item in steps if item.required and item.status not in {"approved", "skipped"}]
                    ),
                }
            )
        return rows

    def _open_findings(self, project_ids: list[str] | None = None) -> list[dict]:
        rows: list[dict] = []
        for aggregate in self._project_aggregates(project_ids):
            for finding in self.finding_repository.list_project_findings(aggregate.project.id):
                if finding.status in {"verified", "closed", "cancelled"}:
                    continue
                rows.append(
                    {
                        "finding": asdict(finding),
                        "actions": [asdict(item) for item in self.finding_repository.list_corrective_actions(finding.id)],
                        "photos": [asdict(item) for item in self.finding_repository.list_finding_photos(finding.id)],
                    }
                )
        rows.sort(key=lambda item: item["finding"]["dueDate"] or "9999-12-31")
        return rows

    def _finding_aging_buckets(self, project_ids: list[str] | None = None) -> list[FindingAgingBucket]:
        buckets = {
            "0_3": FindingAgingBucket(
                id="finding-aging-0-3",
                projectId="global",
                bucketKey="0_3",
                label="0-3일",
                count=0,
            ),
            "4_7": FindingAgingBucket(
                id="finding-aging-4-7",
                projectId="global",
                bucketKey="4_7",
                label="4-7일",
                count=0,
            ),
            "8_plus": FindingAgingBucket(
                id="finding-aging-8-plus",
                projectId="global",
                bucketKey="8_plus",
                label="8일 이상",
                count=0,
            ),
        }
        for row in self._open_findings(project_ids):
            finding = row["finding"]
            created_date = (finding.get("createdAt") or self._today())[:10]
            age = self._day_delta(created_date, self._today())
            key = "0_3" if age <= 3 else "4_7" if age <= 7 else "8_plus"
            buckets[key].count += 1
            buckets[key].findingIds.append(finding["id"])
        return [buckets["0_3"], buckets["4_7"], buckets["8_plus"]]

    def _safety_cost_warnings(self, project_ids: list[str] | None = None) -> list[dict]:
        warnings: list[dict] = []
        for aggregate in self._project_aggregates(project_ids):
            for usage in self.safety_cost_repository.list_project_usages(aggregate.project.id):
                evidence = self.safety_cost_repository.list_evidence(usage.id)
                issues: list[str] = []
                if not evidence:
                    issues.append("evidence_missing")
                if usage.status != "confirmed":
                    issues.append("not_confirmed")
                entered = usage.userEnteredRate or 0
                calculated = usage.usedRateCalculated or 0
                if abs(entered - calculated) >= 0.2:
                    issues.append("rate_mismatch")
                if not issues:
                    continue
                warnings.append(
                    {
                        "usage": asdict(usage),
                        "issues": issues,
                        "evidenceCount": len(evidence),
                    }
                )
        return warnings

    def _mail_file_activity(self, project_ids: list[str] | None = None) -> dict:
        allowed = set(self._accessible_project_ids(project_ids))
        messages = [asdict(item) for item in self.mail_repository.list_messages() if item.projectId in allowed]
        unclassified_messages = [
            asdict(item)
            for item in self.mail_repository.list_messages()
            if item.projectId in allowed and len(self.mail_repository.list_links(message_id=item.id)) == 0
        ]
        files: list[dict] = []
        for project_id in allowed:
            files.extend(asdict(item) for item in self.webhard_repository.list_project_activities(project_id))
        messages.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
        unclassified_messages.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
        files.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
        return {
            "messages": messages[:5],
            "files": files[:5],
            "unclassifiedMailCount": len(unclassified_messages),
            "unclassifiedMessages": unclassified_messages[:5],
        }

    def _project_health_metrics(self, project_ids: list[str] | None = None) -> list[ProjectHealthMetric]:
        metrics: list[ProjectHealthMetric] = []
        report_summaries = self._round_report_summaries(project_ids)
        alerts = self._safety_cost_warnings(project_ids)
        approvals = self._pending_approvals(project_ids)
        for aggregate in self._project_aggregates(project_ids):
            open_findings = [
                item
                for item in self.finding_repository.list_project_findings(aggregate.project.id)
                if item.status not in {"verified", "closed", "cancelled"}
            ]
            overdue_reports = [
                item
                for item in report_summaries
                if item.projectId == aggregate.project.id
                and item.status not in {"submitted", "confirmed"}
                and item.dueDate
                and item.dueDate < self._today()
            ]
            pending_workflows = [
                item
                for item in approvals
                if item["workflow"]["projectId"] == aggregate.project.id
                and item["workflow"]["status"] in {"requested", "in_review"}
            ]
            submission_lag_count = len(
                [
                    item
                    for item in report_summaries
                    if item.projectId == aggregate.project.id and item.status not in {"submitted", "confirmed"}
                ]
            )
            safety_cost_warning_count = len(
                [item for item in alerts if item["usage"]["projectId"] == aggregate.project.id]
            )
            risk_score = min(
                100,
                len(open_findings) * 15
                + len(overdue_reports) * 20
                + len(pending_workflows) * 10
                + safety_cost_warning_count * 10,
            )
            health_status = "healthy"
            if risk_score >= 60:
                health_status = "critical"
            elif risk_score >= 30:
                health_status = "warning"
            metrics.append(
                ProjectHealthMetric(
                    id=f"project-health-{aggregate.project.id}",
                    projectId=aggregate.project.id,
                    projectName=aggregate.project.projectName,
                    riskScore=risk_score,
                    openFindings=len(open_findings),
                    pendingApprovals=len(pending_workflows),
                    overdueReports=len(overdue_reports),
                    submissionLagCount=submission_lag_count,
                    safetyCostWarningCount=safety_cost_warning_count,
                    healthStatus=health_status,
                    updatedAt=self._now(),
                )
            )
        return metrics

    def _statistics_monthly_inspections(self, project_ids: list[str] | None = None) -> list[StatisticsMetric]:
        counter: dict[str, int] = {}
        for aggregate in self._project_aggregates(project_ids):
            for round_item in self.inspection_repository.list_rounds(aggregate.project.id):
                month = round_item.plannedMonth or (round_item.plannedDate or "")[:7] or "unknown"
                counter[month] = counter.get(month, 0) + 1
        return [
            StatisticsMetric(
                id=f"dashboard-stat-inspection-{month}",
                seriesKey="monthly_inspections",
                label="월별 점검회차",
                x=month,
                y=count,
                basisDate=self._today(),
                periodStart="2026-01-01",
                periodEnd=self._today(),
                calculationNote="InspectionRound의 plannedMonth 또는 plannedDate 기준 월별 집계",
                sourceModels=["InspectionRound"],
            )
            for month, count in sorted(counter.items())
        ]

    def _statistics_monthly_submissions(self, project_ids: list[str] | None = None) -> list[StatisticsMetric]:
        counter: dict[str, int] = {}
        for summary in self._round_report_summaries(project_ids):
            if not summary.submittedAt:
                continue
            month = summary.submittedAt[:7]
            counter[month] = counter.get(month, 0) + 1
        return [
            StatisticsMetric(
                id=f"dashboard-stat-submission-{month}",
                seriesKey="monthly_submissions",
                label="월별 제출",
                x=month,
                y=count,
                basisDate=self._today(),
                periodStart="2026-01-01",
                periodEnd=self._today(),
                calculationNote="OwnerReportStatusSummary.submittedAt 기준 월별 제출 집계",
                sourceModels=["InspectionOwnerReportTask", "DocumentInstance", "Submission"],
            )
            for month, count in sorted(counter.items())
        ]

    def _statistics_risk_types(self, project_ids: list[str] | None = None) -> list[StatisticsMetric]:
        counter: dict[str, int] = {}
        for row in self._open_findings(project_ids):
            risk_type = row["finding"]["riskType"]
            counter[risk_type] = counter.get(risk_type, 0) + 1
        return [
            StatisticsMetric(
                id=f"dashboard-stat-risk-{risk_type}",
                seriesKey="risk_types",
                label="위험유형 분포",
                x=risk_type,
                y=count,
                basisDate=self._today(),
                periodStart="2026-01-01",
                periodEnd=self._today(),
                calculationNote="closed/verified 제외 finding의 riskType 분포",
                sourceModels=["Finding", "CorrectiveAction"],
            )
            for risk_type, count in sorted(counter.items())
        ]

    def _statistics_safety_cost_distribution(self, project_ids: list[str] | None = None) -> list[StatisticsMetric]:
        metrics: list[StatisticsMetric] = []
        for aggregate in self._project_aggregates(project_ids):
            for usage in self.safety_cost_repository.list_project_usages(aggregate.project.id):
                metrics.append(
                    StatisticsMetric(
                        id=f"dashboard-stat-safety-cost-{usage.id}",
                        seriesKey="safety_cost_distribution",
                        label="산안비 사용률",
                        x=usage.ownerPartyId,
                        y=usage.usedRateCalculated,
                        projectId=aggregate.project.id,
                        ownerPartyId=usage.ownerPartyId,
                        basisDate=self._today(),
                        periodStart="2026-01-01",
                        periodEnd=self._today(),
                        calculationNote="SafetyCostUsage.usedRateCalculated 기준 발주처별 사용률 집계",
                        sourceModels=["SafetyCostUsage"],
                    )
                )
        return metrics

    def _day_delta(self, from_date: str, to_date: str) -> int:
        try:
            fy, fm, fd = [int(part) for part in from_date.split("-")]
            ty, tm, td = [int(part) for part in to_date.split("-")]
        except ValueError:
            return 0
        from_days = fy * 365 + fm * 30 + fd
        to_days = ty * 365 + tm * 30 + td
        return max(0, to_days - from_days)

    def _build_alerts(self, project_ids: list[str] | None = None) -> list[DashboardAlert]:
        alerts: list[DashboardAlert] = []
        now = self._now()
        enabled_rules = {item.ruleKey: item for item in self.repository.list_alert_rules() if item.enabled}
        if "report_overdue" in enabled_rules:
            for summary in self._round_report_summaries(project_ids):
                if summary.status in {"submitted", "confirmed"} or not summary.dueDate or summary.dueDate >= self._today():
                    continue
                alerts.append(
                    DashboardAlert(
                        id=self._next_id("dashboard-alert"),
                        alertKey="report_overdue",
                        scope="project",
                        severity=enabled_rules["report_overdue"].severity,
                        title="발주처별 보고서 제출 지연",
                        message=f"{summary.ownerDisplayName} 보고서가 제출 상태가 아닙니다.",
                        route="/dashboard/documents",
                        projectId=summary.projectId,
                        ownerPartyId=summary.ownerPartyId,
                        inspectionRoundId=summary.inspectionRoundId,
                        documentId=summary.documentId,
                        submissionId=summary.submissionId,
                        createdAt=now,
                        updatedAt=now,
                    )
                )
        if "finding_aging" in enabled_rules:
            for bucket in self._finding_aging_buckets(project_ids):
                if bucket.bucketKey != "8_plus" or bucket.count == 0:
                    continue
                alerts.append(
                    DashboardAlert(
                        id=self._next_id("dashboard-alert"),
                        alertKey="finding_aging",
                        scope="global",
                        severity=enabled_rules["finding_aging"].severity,
                        title="장기 미조치 지적사항",
                        message=f"{bucket.count}건의 지적사항이 8일 이상 열린 상태입니다.",
                        route="/dashboard/findings",
                        createdAt=now,
                        updatedAt=now,
                    )
                )
        if "safety_cost_warning" in enabled_rules:
            for warning in self._safety_cost_warnings(project_ids):
                alerts.append(
                    DashboardAlert(
                        id=self._next_id("dashboard-alert"),
                        alertKey="safety_cost_warning",
                        scope="project",
                        severity=enabled_rules["safety_cost_warning"].severity,
                        title="산안비 검토 필요",
                        message=f"{warning['usage']['ownerPartyId']} 항목에 {', '.join(warning['issues'])} 이슈가 있습니다.",
                        route="/dashboard/safety-costs",
                        projectId=warning["usage"]["projectId"],
                        ownerPartyId=warning["usage"]["ownerPartyId"],
                        inspectionRoundId=warning["usage"]["inspectionRoundId"],
                        createdAt=now,
                        updatedAt=now,
                    )
                )
        return alerts

    def _metrics_overview(self, project_ids: list[str] | None = None) -> list[DashboardMetric]:
        project_health = self._project_health_metrics(project_ids)
        open_findings = self._open_findings(project_ids)
        pending_approvals = self._pending_approvals(project_ids)
        report_summaries = self._round_report_summaries(project_ids)
        safety_cost_warnings = self._safety_cost_warnings(project_ids)
        mail_file = self._mail_file_activity(project_ids)
        return [
            DashboardMetric(
                id="dashboard-metric-projects",
                metricKey="active_projects",
                label="활성 프로젝트",
                value=len(project_health),
                status="info",
                route="/dashboard/projects",
            ),
            DashboardMetric(
                id="dashboard-metric-overdue-reports",
                metricKey="overdue_reports",
                label="제출 지연 보고서",
                value=len(
                    [item for item in report_summaries if item.status not in {"submitted", "confirmed"} and item.dueDate and item.dueDate < self._today()]
                ),
                status="warning",
                route="/dashboard/documents",
            ),
            DashboardMetric(
                id="dashboard-metric-open-findings",
                metricKey="open_findings",
                label="미조치 지적사항",
                value=len(open_findings),
                status="danger" if len(open_findings) > 0 else "success",
                route="/dashboard/findings",
            ),
            DashboardMetric(
                id="dashboard-metric-pending-approvals",
                metricKey="pending_approvals",
                label="결재 대기",
                value=len(pending_approvals),
                status="review",
                route="/dashboard/approvals",
            ),
            DashboardMetric(
                id="dashboard-metric-safety-cost-warnings",
                metricKey="safety_cost_warnings",
                label="산안비 경고",
                value=len(safety_cost_warnings),
                status="warning",
                route="/dashboard/safety-costs",
            ),
            DashboardMetric(
                id="dashboard-metric-unclassified-mail",
                metricKey="unclassified_mail",
                label="미분류 메일",
                value=mail_file["unclassifiedMailCount"],
                status="review",
                route="/dashboard/files-mails",
            ),
        ]

    def get_overview(self, project_ids: list[str] | None = None) -> dict:
        today_inspections = [
            asdict(item)
            for aggregate in self._project_aggregates(project_ids)
            for item in self.inspection_repository.list_rounds(aggregate.project.id)
            if (item.actualInspectionDate or item.plannedDate) == self._today()
        ]
        upcoming = [
            asdict(item)
            for aggregate in self._project_aggregates(project_ids)
            for item in self.inspection_repository.list_rounds(aggregate.project.id)
            if (item.plannedDate or "9999-12-31") >= self._today()
        ][:5]
        report_summaries = self._round_report_summaries(project_ids)
        pending_approvals = self._pending_approvals(project_ids)
        open_findings = self._open_findings(project_ids)
        safety_cost_warnings = self._safety_cost_warnings(project_ids)
        mail_file = self._mail_file_activity(project_ids)
        widgets = [asdict(item) for item in self.repository.list_widgets()]
        metrics = [asdict(item) for item in self._metrics_overview(project_ids)]
        alerts = [asdict(item) for item in self.repository.list_alerts()]
        snapshot = DashboardSnapshot(
            id=self._next_id("dashboard-snapshot"),
            scope="global",
            snapshotDate=self._today(),
            metrics=metrics,
            alerts=[item["id"] for item in alerts],
            createdAt=self._now(),
        )
        self.repository.save_snapshot(snapshot)
        return {
            "generatedAt": self._now(),
            "metrics": metrics,
            "todayInspections": today_inspections,
            "upcomingInspections": upcoming,
            "reportDueItems": [asdict(item) for item in report_summaries if item.status not in {"submitted", "confirmed"}],
            "openFindings": open_findings[:6],
            "safetyCostWarnings": safety_cost_warnings[:6],
            "pendingApprovals": pending_approvals[:6],
            "submissionStatuses": [asdict(item) for item in report_summaries[:8]],
            "mailFileActivity": mail_file,
            "widgets": widgets,
            "alerts": alerts,
            "snapshot": asdict(snapshot),
        }

    def get_my_work(self, project_ids: list[str] | None = None) -> dict:
        upcoming_tasks = []
        for aggregate in self._project_aggregates(project_ids):
            for round_item in self.inspection_repository.list_rounds(aggregate.project.id):
                for task in self.inspection_repository.list_tasks(round_item.id):
                    if task.status in {"todo", "blocked", "in_progress"}:
                        upcoming_tasks.append(asdict(task))
        upcoming_tasks.sort(key=lambda item: item.get("dueDate") or "9999-12-31")
        return {
            "generatedAt": self._now(),
            "tasks": upcoming_tasks[:10],
            "upcomingInspections": [
                asdict(item)
                for aggregate in self._project_aggregates(project_ids)
                for item in self.inspection_repository.list_rounds(aggregate.project.id)
                if (item.plannedDate or "9999-12-31") >= self._today()
            ][:5],
            "pendingApprovals": self._pending_approvals(project_ids)[:5],
            "openFindings": self._open_findings(project_ids)[:5],
        }

    def get_project_dashboard(self, project_id: str) -> dict:
        project = self._project(project_id)
        health = next(
            (item for item in self._project_health_metrics([project_id]) if item.projectId == project_id),
            None,
        )
        if not health:
            raise DashboardNotFoundError(f"Project dashboard not found: {project_id}")
        return {
            "project": asdict(project),
            "healthMetric": asdict(health),
            "ownerReportMatrix": [asdict(item) for item in self._round_report_summaries([project_id])],
            "findingAging": [asdict(item) for item in self._finding_aging_buckets([project_id])],
            "openFindings": self._open_findings([project_id])[:8],
            "safetyCostWarnings": self._safety_cost_warnings([project_id]),
            "pendingApprovals": self._pending_approvals([project_id]),
            "mailFileActivity": self._mail_file_activity([project_id]),
        }

    def list_widgets(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_widgets()]

    def create_widget(self, payload: dict) -> dict:
        widget = DashboardWidget(
            id=self._next_id("dashboard-widget"),
            title=payload["title"],
            widgetType=payload["widgetType"],
            route=payload["route"],
            scope=payload.get("scope", "global"),
            projectId=payload.get("projectId"),
            ownerPartyId=payload.get("ownerPartyId"),
            displayOrder=payload.get("displayOrder", len(self.repository.list_widgets()) + 1),
            settings=payload.get("settings", {}),
            enabled=payload.get("enabled", True),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"widget": asdict(self.repository.save_widget(widget))}

    def update_widget(self, widget_id: str, payload: dict) -> dict:
        widget = self.repository.get_widget(widget_id)
        if not widget:
            raise DashboardNotFoundError(f"Widget not found: {widget_id}")
        for key, value in payload.items():
            if hasattr(widget, key) and value is not None:
                setattr(widget, key, value)
        widget.updatedAt = self._now()
        return {"widget": asdict(self.repository.save_widget(widget))}

    def delete_widget(self, widget_id: str) -> dict:
        if not self.repository.get_widget(widget_id):
            raise DashboardNotFoundError(f"Widget not found: {widget_id}")
        self.repository.delete_widget(widget_id)
        return {"deleted": True, "widgetId": widget_id}

    def reorder_widgets(self, widget_ids: list[str]) -> list[dict]:
        widgets = []
        for order, widget_id in enumerate(widget_ids, start=1):
            widget = self.repository.get_widget(widget_id)
            if not widget:
                continue
            widget.displayOrder = order
            widget.updatedAt = self._now()
            widgets.append(self.repository.save_widget(widget))
        return [asdict(item) for item in self.repository.list_widgets()]

    def list_project_health_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._project_health_metrics(project_ids)]

    def list_inspection_status_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        rows = []
        for aggregate in self._project_aggregates(project_ids):
            for round_item in self.inspection_repository.list_rounds(aggregate.project.id):
                rows.append(
                    asdict(
                        DashboardMetric(
                            id=f"dashboard-metric-round-{round_item.id}",
                            metricKey="inspection_status",
                            label=round_item.name,
                            value=round_item.roundNo,
                            status="success" if round_item.status in {"checked", "submitted"} else "review",
                            route="/dashboard/inspections",
                            projectId=round_item.projectId,
                            inspectionRoundId=round_item.id,
                            metadata={
                                "roundStatus": round_item.status,
                                "plannedDate": round_item.plannedDate,
                                "actualInspectionDate": round_item.actualInspectionDate,
                                "documentNo": round_item.documentNo,
                            },
                        )
                    )
                )
        return rows

    def list_report_status_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._round_report_summaries(project_ids)]

    def list_finding_aging_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._finding_aging_buckets(project_ids)]

    def list_safety_cost_usage_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        return self._safety_cost_warnings(project_ids)

    def list_approval_queue_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        return self._pending_approvals(project_ids)

    def list_mail_file_activity_metrics(self, project_ids: list[str] | None = None) -> dict:
        return self._mail_file_activity(project_ids)

    def list_submission_status_metrics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._round_report_summaries(project_ids)]

    def list_monthly_inspection_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._statistics_monthly_inspections(project_ids)]

    def list_monthly_submission_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._statistics_monthly_submissions(project_ids)]

    def list_risk_type_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._statistics_risk_types(project_ids)]

    def list_finding_resolution_time_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        stats: list[StatisticsMetric] = []
        for aggregate in self._project_aggregates(project_ids):
            for finding in self.finding_repository.list_project_findings(aggregate.project.id):
                if finding.status != "verified":
                    continue
                age = self._day_delta(finding.createdAt[:10], self._today())
                stats.append(
                    StatisticsMetric(
                        id=f"dashboard-stat-resolution-{finding.id}",
                        seriesKey="finding_resolution_time",
                        label="지적사항 해결 기간",
                        x=finding.id,
                        y=age,
                        projectId=aggregate.project.id,
                        inspectionRoundId=finding.inspectionRoundId,
                        basisDate=self._today(),
                        periodStart=finding.createdAt[:10],
                        periodEnd=self._today(),
                        calculationNote="verified finding의 createdAt 대비 기준일 경과일",
                        sourceModels=["Finding", "CorrectiveAction"],
                    )
                )
        return [asdict(item) for item in stats]

    def list_owner_submission_lag_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        stats: list[StatisticsMetric] = []
        for summary in self._round_report_summaries(project_ids):
            due_date = summary.dueDate or self._today()
            age = self._day_delta(due_date, self._today()) if summary.status not in {"submitted", "confirmed"} else 0
            stats.append(
                StatisticsMetric(
                    id=f"dashboard-stat-owner-lag-{summary.id}",
                    seriesKey="owner_submission_lag",
                    label="발주처별 제출 지연",
                    x=summary.ownerDisplayName,
                    y=age,
                    projectId=summary.projectId,
                    ownerPartyId=summary.ownerPartyId,
                    inspectionRoundId=summary.inspectionRoundId,
                    basisDate=self._today(),
                    periodStart=due_date,
                    periodEnd=self._today(),
                    calculationNote="dueDate 대비 submitted/confirmed 전까지의 경과일",
                    sourceModels=["InspectionOwnerReportTask", "Submission", "DocumentInstance"],
                )
            )
        return [asdict(item) for item in stats]

    def list_safety_cost_distribution_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        return [asdict(item) for item in self._statistics_safety_cost_distribution(project_ids)]

    def list_export_summary_statistics(self, project_ids: list[str] | None = None) -> list[dict]:
        stats: list[StatisticsMetric] = []
        for project_id in self._accessible_project_ids(project_ids):
            files = self.webhard_repository.list_files(project_id=project_id)
            exported = [item for item in files if "generated_document" in item.tags or item.linkedEntityType == "document_instance"]
            stats.append(
                StatisticsMetric(
                    id=f"dashboard-stat-export-{project_id}",
                    seriesKey="export_summary",
                    label="문서 export 요약",
                    x=project_id,
                    y=len(exported),
                    projectId=project_id,
                    basisDate=self._today(),
                    periodStart="2026-01-01",
                    periodEnd=self._today(),
                    calculationNote="generated_document tag 또는 document_instance linkage를 가진 파일 수",
                    sourceModels=["FileAsset", "DocumentInstance"],
                )
            )
        return [asdict(item) for item in stats]

    def list_alerts(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_alerts()]

    def refresh_alerts(self, project_ids: list[str] | None = None) -> dict:
        self.repository.alerts = {}
        alerts = [self.repository.save_alert(item) for item in self._build_alerts(project_ids)]
        return {"alerts": [asdict(item) for item in alerts]}

    def acknowledge_alert(self, alert_id: str) -> dict:
        alert = self.repository.get_alert(alert_id)
        if not alert:
            raise DashboardNotFoundError(f"Alert not found: {alert_id}")
        alert.status = "acknowledged"
        alert.acknowledgedAt = self._now()
        alert.updatedAt = self._now()
        return {"alert": asdict(self.repository.save_alert(alert))}

    def dismiss_alert(self, alert_id: str) -> dict:
        alert = self.repository.get_alert(alert_id)
        if not alert:
            raise DashboardNotFoundError(f"Alert not found: {alert_id}")
        alert.status = "dismissed"
        alert.dismissedAt = self._now()
        alert.updatedAt = self._now()
        return {"alert": asdict(self.repository.save_alert(alert))}

    def list_alert_rules(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_alert_rules()]

    def create_alert_rule(self, payload: dict) -> dict:
        rule = AlertRule(
            id=self._next_id("dashboard-alert-rule"),
            ruleKey=payload["ruleKey"],
            name=payload["name"],
            description=payload["description"],
            severity=payload["severity"],
            enabled=payload.get("enabled", True),
            threshold=payload.get("threshold"),
            scope=payload.get("scope", "global"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"alertRule": asdict(self.repository.save_alert_rule(rule))}

    def update_alert_rule(self, alert_rule_id: str, payload: dict) -> dict:
        rule = self.repository.get_alert_rule(alert_rule_id)
        if not rule:
            raise DashboardNotFoundError(f"Alert rule not found: {alert_rule_id}")
        for key, value in payload.items():
            if hasattr(rule, key) and value is not None:
                setattr(rule, key, value)
        rule.updatedAt = self._now()
        return {"alertRule": asdict(self.repository.save_alert_rule(rule))}

    def create_insight_summary(self, insight_type: str, project_id: str | None = None) -> dict:
        metric_rows = self._metrics_overview([project_id] if project_id else None)
        summary_parts = [
            f"{metric.label} {metric.value}{metric.unit or ''}"
            for metric in metric_rows
        ]
        insight = DashboardInsightRun(
            id=self._next_id("dashboard-insight"),
            insightType=insight_type,
            scope="project" if project_id else "global",
            projectId=project_id,
            title="AI draft briefing",
            summaryText=" / ".join(summary_parts) + " 기반 초안 요약입니다. 수치를 새로 만들지 않았습니다.",
            sourceMetricKeys=[item.metricKey for item in metric_rows],
            warnings=["ai_output_is_draft_only"],
            createdAt=self._now(),
        )
        return {"insightRun": asdict(self.repository.save_insight_run(insight))}
