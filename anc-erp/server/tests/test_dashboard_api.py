import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    admin_repository,
    approval_repository,
    checklist_repository,
    contract_repository,
    dashboard_repository,
    finding_repository,
    inspection_repository,
    mail_repository,
    project_repository,
    safety_cost_repository,
    safety_report_repository,
    webhard_repository,
)
from server.app.main import app


class DashboardRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        safety_cost_repository.__init__(project_repository, inspection_repository)
        safety_report_repository.__init__(project_repository, inspection_repository)
        mail_repository.__init__(project_repository)
        approval_repository.__init__(
            project_repository,
            inspection_repository,
            safety_report_repository,
            mail_repository,
        )
        admin_repository.__init__()
        webhard_repository.__init__(project_repository)
        dashboard_repository.__init__()
        self.client = TestClient(app)

    def test_dashboard_overview_loads(self) -> None:
        response = self.client.get("/api/v1/dashboard/overview")

        self.assertEqual(response.status_code, 200)
        self.assertIn("metrics", response.json())
        self.assertIn("widgets", response.json())

    def test_dashboard_respects_project_permission(self) -> None:
        self.client.post(
            "/api/v1/projects",
            json={
                "projectName": "두번째 현장",
                "siteName": "별도 현장",
                "siteAddress": "부산시 해운대구",
                "constructionType": "리모델링",
                "status": "active",
            },
        )

        response = self.client.get("/api/v1/dashboard/metrics/project-health?project_ids=project-sample-001")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["projectId"], "project-sample-001")

    def test_dashboard_my_work_loads(self) -> None:
        response = self.client.get("/api/v1/dashboard/my-work")

        self.assertEqual(response.status_code, 200)
        self.assertIn("tasks", response.json())
        self.assertIn("upcomingInspections", response.json())

    def test_project_health_risk_score_calculated(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/project-health")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()[0]["riskScore"], 1)

    def test_report_due_card_filters_owner_reports(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/report-status")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(all("ownerPartyId" in item for item in response.json()))

    def test_finding_aging_excludes_closed_findings(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/finding-aging")

        self.assertEqual(response.status_code, 200)
        total = sum(item["count"] for item in response.json())
        self.assertEqual(total, 4)

    def test_safety_cost_warning_detected(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/safety-cost-usage")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertIn("issues", response.json()[0])

    def test_approval_queue_counts_pending_steps(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/approval-queue")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["pendingRequiredCount"], 2)
        self.assertEqual(response.json()[0]["missingRequiredSignatureCount"], 1)

    def test_inspection_status_metrics_load(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/inspection-status")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertIn("metadata", response.json()[0])

    def test_mail_file_activity_counts_recent_items(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/mail-file-activity")

        self.assertEqual(response.status_code, 200)
        self.assertIn("messages", response.json())
        self.assertIn("files", response.json())
        self.assertIn("unclassifiedMessages", response.json())

    def test_submission_status_metrics_load(self) -> None:
        response = self.client.get("/api/v1/dashboard/metrics/submission-status")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertIn("ownerPartyId", response.json()[0])

    def test_dashboard_alert_refresh_creates_report_overdue_alert(self) -> None:
        response = self.client.post("/api/v1/dashboard/alerts/refresh")

        self.assertEqual(response.status_code, 200)
        alert_keys = [item["alertKey"] for item in response.json()["alerts"]]
        self.assertIn("report_overdue", alert_keys)

    def test_dashboard_alert_acknowledge(self) -> None:
        refresh = self.client.post("/api/v1/dashboard/alerts/refresh").json()
        alert_id = refresh["alerts"][0]["id"]

        response = self.client.patch(f"/api/v1/dashboard/alerts/{alert_id}/acknowledge")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["alert"]["status"], "acknowledged")

    def test_dashboard_alert_dismiss(self) -> None:
        refresh = self.client.post("/api/v1/dashboard/alerts/refresh").json()
        alert_id = refresh["alerts"][0]["id"]

        response = self.client.patch(f"/api/v1/dashboard/alerts/{alert_id}/dismiss")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["alert"]["status"], "dismissed")

    def test_dashboard_widgets_crud(self) -> None:
        list_response = self.client.get("/api/v1/dashboard/widgets")
        self.assertEqual(list_response.status_code, 200)
        self.assertGreaterEqual(len(list_response.json()), 1)

        create_response = self.client.post(
            "/api/v1/dashboard/widgets",
            json={
                "title": "신규 KPI 카드",
                "widgetType": "custom_metric",
                "route": "/dashboard",
            },
        )
        self.assertEqual(create_response.status_code, 200)
        widget_id = create_response.json()["widget"]["id"]

        update_response = self.client.patch(
            f"/api/v1/dashboard/widgets/{widget_id}",
            json={"enabled": False},
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertFalse(update_response.json()["widget"]["enabled"])

        delete_response = self.client.delete(f"/api/v1/dashboard/widgets/{widget_id}")
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.json()["deleted"])

    def test_dashboard_alert_rules_crud(self) -> None:
        list_response = self.client.get("/api/v1/dashboard/alert-rules")
        self.assertEqual(list_response.status_code, 200)
        self.assertGreaterEqual(len(list_response.json()), 1)

        create_response = self.client.post(
            "/api/v1/dashboard/alert-rules",
            json={
                "ruleKey": "custom_watch",
                "name": "사용자 경고",
                "description": "운영자 추가 경고",
                "severity": "warning",
            },
        )
        self.assertEqual(create_response.status_code, 200)
        rule_id = create_response.json()["alertRule"]["id"]

        update_response = self.client.patch(
            f"/api/v1/dashboard/alert-rules/{rule_id}",
            json={"enabled": False},
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertFalse(update_response.json()["alertRule"]["enabled"])

    def test_statistics_monthly_inspections(self) -> None:
        response = self.client.get("/api/v1/dashboard/statistics/monthly-inspections")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertIn("basisDate", response.json()[0])

    def test_statistics_risk_type_distribution(self) -> None:
        response = self.client.get("/api/v1/dashboard/statistics/risk-types")

        self.assertEqual(response.status_code, 200)
        risk_types = [item["x"] for item in response.json()]
        self.assertIn("electric", risk_types)

    def test_statistics_finding_resolution_time(self) -> None:
        response = self.client.get("/api/v1/dashboard/statistics/finding-resolution-time")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_statistics_owner_submission_lag(self) -> None:
        response = self.client.get("/api/v1/dashboard/statistics/owner-submission-lag")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertIn("calculationNote", response.json()[0])

    def test_statistics_export_summary(self) -> None:
        response = self.client.get("/api/v1/dashboard/statistics/export-summary")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)
        self.assertIn("sourceModels", response.json()[0])

    def test_dashboard_insight_does_not_invent_metrics(self) -> None:
        response = self.client.post("/api/v1/dashboard/insights/summary", json={})

        self.assertEqual(response.status_code, 200)
        summary = response.json()["insightRun"]["summaryText"]
        self.assertIn("활성 프로젝트", summary)
        self.assertIn("수치를 새로 만들지 않았습니다", summary)

    def test_dashboard_project_risk_insight_loads(self) -> None:
        response = self.client.post("/api/v1/dashboard/insights/project-risk", json={"projectId": "project-sample-001"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["insightRun"]["scope"], "project")

    def test_project_dashboard_owner_report_matrix(self) -> None:
        response = self.client.get("/api/v1/projects/project-sample-001/dashboard")

        self.assertEqual(response.status_code, 200)
        self.assertIn("ownerReportMatrix", response.json())
        self.assertGreaterEqual(len(response.json()["ownerReportMatrix"]), 1)
        self.assertIn("openFindings", response.json())
