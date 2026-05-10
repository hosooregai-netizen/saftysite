from copy import deepcopy

from server.app.domain.models import (
    AlertRule,
    DashboardAlert,
    DashboardInsightRun,
    DashboardSnapshot,
    DashboardWidget,
)


class DashboardRepository:
    def __init__(self) -> None:
        self.widgets: dict[str, DashboardWidget] = {}
        self.snapshots: dict[str, DashboardSnapshot] = {}
        self.alerts: dict[str, DashboardAlert] = {}
        self.alertRules: dict[str, AlertRule] = {}
        self.insightRuns: dict[str, DashboardInsightRun] = {}
        self._seed()

    def _seed(self) -> None:
        now = "2026-05-10T16:00:00+09:00"
        seeded_widgets = [
            DashboardWidget(
                id="dashboard-widget-001",
                title="오늘 점검",
                widgetType="today_inspections",
                route="/dashboard",
                displayOrder=1,
                createdAt=now,
                updatedAt=now,
            ),
            DashboardWidget(
                id="dashboard-widget-002",
                title="보고서 제출 상태",
                widgetType="submission_status",
                route="/dashboard/documents",
                displayOrder=2,
                createdAt=now,
                updatedAt=now,
            ),
            DashboardWidget(
                id="dashboard-widget-003",
                title="지적사항 경과",
                widgetType="finding_aging",
                route="/dashboard/findings",
                displayOrder=3,
                createdAt=now,
                updatedAt=now,
            ),
        ]
        for widget in seeded_widgets:
            self.widgets[widget.id] = deepcopy(widget)

        seeded_rules = [
            AlertRule(
                id="dashboard-alert-rule-001",
                ruleKey="report_overdue",
                name="보고서 제출 지연",
                description="제출기한이 지났는데 제출 상태가 아닌 발주처별 보고서를 경고합니다.",
                severity="warning",
                threshold=0,
                createdAt=now,
                updatedAt=now,
            ),
            AlertRule(
                id="dashboard-alert-rule-002",
                ruleKey="finding_aging",
                name="장기 미조치 지적사항",
                description="일정 기간 이상 열린 지적사항을 경고합니다.",
                severity="danger",
                threshold=7,
                createdAt=now,
                updatedAt=now,
            ),
            AlertRule(
                id="dashboard-alert-rule-003",
                ruleKey="safety_cost_warning",
                name="산안비 검토 경고",
                description="증빙 누락 또는 사용률 불일치가 있는 산안비 항목을 경고합니다.",
                severity="warning",
                threshold=0,
                createdAt=now,
                updatedAt=now,
            ),
        ]
        for rule in seeded_rules:
            self.alertRules[rule.id] = deepcopy(rule)

    def list_widgets(self) -> list[DashboardWidget]:
        return sorted(
            [deepcopy(item) for item in self.widgets.values()],
            key=lambda item: item.displayOrder,
        )

    def get_widget(self, widget_id: str) -> DashboardWidget | None:
        item = self.widgets.get(widget_id)
        return deepcopy(item) if item else None

    def save_widget(self, widget: DashboardWidget) -> DashboardWidget:
        self.widgets[widget.id] = deepcopy(widget)
        return deepcopy(widget)

    def delete_widget(self, widget_id: str) -> None:
        self.widgets.pop(widget_id, None)

    def save_snapshot(self, snapshot: DashboardSnapshot) -> DashboardSnapshot:
        self.snapshots[snapshot.id] = deepcopy(snapshot)
        return deepcopy(snapshot)

    def get_snapshot(self, snapshot_id: str) -> DashboardSnapshot | None:
        item = self.snapshots.get(snapshot_id)
        return deepcopy(item) if item else None

    def list_alerts(self) -> list[DashboardAlert]:
        return sorted(
            [deepcopy(item) for item in self.alerts.values()],
            key=lambda item: (item.status != "open", item.createdAt),
        )

    def get_alert(self, alert_id: str) -> DashboardAlert | None:
        item = self.alerts.get(alert_id)
        return deepcopy(item) if item else None

    def save_alert(self, alert: DashboardAlert) -> DashboardAlert:
        self.alerts[alert.id] = deepcopy(alert)
        return deepcopy(alert)

    def delete_alert(self, alert_id: str) -> None:
        self.alerts.pop(alert_id, None)

    def list_alert_rules(self) -> list[AlertRule]:
        return [deepcopy(item) for item in self.alertRules.values()]

    def get_alert_rule(self, alert_rule_id: str) -> AlertRule | None:
        item = self.alertRules.get(alert_rule_id)
        return deepcopy(item) if item else None

    def save_alert_rule(self, rule: AlertRule) -> AlertRule:
        self.alertRules[rule.id] = deepcopy(rule)
        return deepcopy(rule)

    def save_insight_run(self, insight_run: DashboardInsightRun) -> DashboardInsightRun:
        self.insightRuns[insight_run.id] = deepcopy(insight_run)
        return deepcopy(insight_run)

    def list_insight_runs(self) -> list[DashboardInsightRun]:
        return [deepcopy(item) for item in self.insightRuns.values()]
