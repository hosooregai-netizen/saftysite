import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    project_repository,
    safety_cost_repository,
    safety_health_ledger_repository,
    safety_management_plan_repository,
)
from server.app.main import app


class SafetyHealthLedgerRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        safety_cost_repository.__init__(project_repository, inspection_repository)
        safety_management_plan_repository.__init__(project_repository)
        safety_health_ledger_repository.__init__(
            project_repository,
            safety_management_plan_repository,
            inspection_repository,
            checklist_repository,
            finding_repository,
            safety_cost_repository,
        )
        self.client = TestClient(app)

    def test_safety_health_ledger_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-health-ledgers",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-health-ledger-v2",
                "includeInspectionHistory": True,
                "includeFindingHistory": True,
                "includeSafetyCostHistory": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ledger"]["projectId"], "project-sample-001")

    def test_safety_health_ledger_prevents_duplicate_active_ledger(self) -> None:
        response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-health-ledgers",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-health-ledger-v1",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("duplicate", response.json()["detail"])

    def test_safety_health_ledger_imports_risks_from_safety_management_plan(self) -> None:
        create_response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-health-ledgers",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-health-ledger-v1",
                "sourcePlanId": "safety-management-plan-sample-001",
                "revisionReason": "초기 수입 테스트",
            },
        )

        self.assertEqual(create_response.status_code, 200)
        self.assertGreaterEqual(len(create_response.json()["snapshot"]["riskItems"]), 1)

    def test_ledger_risk_requires_hazard_description(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/risks",
            json={"hazardDescription": ""},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("hazardDescription", response.json()["detail"])

    def test_ledger_syncs_inspection_history(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/inspection-history/sync"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["createdCount"], 1)

    def test_ledger_syncs_finding_action_history(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/finding-history/sync"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["createdCount"], 1)

    def test_ledger_syncs_safety_cost_history(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/safety-cost-history/sync"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["createdCount"], 1)

    def test_ledger_detects_repeated_risks(self) -> None:
        self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/risks",
            json={
                "workType": "양중 작업",
                "hazardDescription": "승강로 개구부 추락",
                "riskType": "추락",
                "riskLevel": "high",
            },
        )
        self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/risks",
            json={
                "workType": "양중 작업",
                "hazardDescription": "승강로 개구부 추락",
                "riskType": "추락",
                "riskLevel": "high",
            },
        )

        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/risks/detect-recurrence"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["repeatedCount"], 1)

    def test_ledger_version_created_on_sync(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/inspection-history/sync"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["version"]["versionNo"], 2)

    def test_ledger_export_blocked_when_required_missing(self) -> None:
        create_response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-health-ledgers",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-health-ledger-v3",
                "includeInspectionHistory": False,
                "includeFindingHistory": False,
                "includeSafetyCostHistory": False,
            },
        )
        ledger_id = create_response.json()["ledger"]["id"]

        response = self.client.post(
            f"/api/v1/safety-health-ledgers/{ledger_id}/export",
            json={},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.json()["detail"])

    def test_ledger_export_uses_latest_saved_snapshot(self) -> None:
        save_response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/sections/basic_info/save",
            json={
                "sectionKey": "basic_info",
                "content": {"summary": "최신 누적 대장 저장본"},
                "status": "edited",
            },
        )
        export_response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/export",
            json={},
        )

        self.assertEqual(save_response.status_code, 200)
        self.assertEqual(export_response.status_code, 200)
        self.assertEqual(export_response.json()["version"]["versionNo"], 2)

    def test_ledger_export_creates_file_asset(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/export",
            json={},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["fileAsset"]["linkedEntityId"], "safety-health-ledger-sample-001")

    def test_ledger_attachment_links_file_asset(self) -> None:
        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/attachments",
            json={
                "fileId": "file-asset-ledger-001",
                "fileName": "ledger-support.pdf",
                "storagePath": "/project/09_ledger/ledger-support.pdf",
                "attachmentType": "supporting",
                "sourceEntityType": "webhard",
                "sourceEntityId": "folder-001",
                "sourceLabel": "보조자료",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["attachment"]["fileId"], "file-asset-ledger-001")

    def test_ledger_stale_source_warning_created(self) -> None:
        self.client.patch(
            "/api/v1/projects/project-sample-001",
            json={"projectName": "리움미술관 승강기 교체공사 변경"},
        )

        response = self.client.post(
            "/api/v1/safety-health-ledgers/safety-health-ledger-sample-001/validate"
        )

        self.assertEqual(response.status_code, 200)
        warning_types = [item["type"] for item in response.json()["warnings"]]
        self.assertIn("stale_source_warning", warning_types)


if __name__ == "__main__":
    unittest.main()
