import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    project_repository,
    safety_cost_repository,
    safety_report_repository,
)
from server.app.main import app


class SafetyReportRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        safety_cost_repository.__init__(project_repository, inspection_repository)
        safety_report_repository.__init__(project_repository, inspection_repository)
        self.client = TestClient(app)

    def test_safety_report_draft_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-002",
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "templateId": "template-safety-report-v1",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["document"]["inspectionRoundId"], "round-sample-002")

    def test_safety_report_get_detail_success(self) -> None:
        response = self.client.get("/api/v1/safety-reports/doc-sample-001")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["document"]["id"], "doc-sample-001")
        self.assertEqual(response.json()["snapshot"]["meta"]["ownerPartyId"], "owner-samsung-cultural-foundation")

    def test_safety_report_get_variables_success(self) -> None:
        response = self.client.get("/api/v1/safety-reports/doc-sample-001/variables")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["documentId"], "doc-sample-001")
        self.assertIn("projectName", response.json()["variables"])

    def test_safety_report_requires_project_round_owner(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-001",
                "ownerPartyId": "project-party-contractor-001",
                "templateId": "template-safety-report-v1",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("owner", response.json()["detail"])

    def test_safety_report_prevents_duplicate_active_owner_report(self) -> None:
        payload = {
            "projectId": "project-sample-001",
            "inspectionRoundId": "round-sample-002",
            "ownerPartyId": "owner-samsung-cultural-foundation",
            "templateId": "template-safety-report-v1",
        }
        self.client.post("/api/v1/safety-reports/draft", json=payload)
        response = self.client.post("/api/v1/safety-reports/draft", json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn("duplicate", response.json()["detail"])

    def test_safety_report_generates_owner_specific_document(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-002",
                "ownerPartyId": "owner-samsung-life-foundation",
                "templateId": "template-safety-report-v1",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["snapshot"]["meta"]["ownerDisplayName"],
            "삼성생명공익재단",
        )

    def test_safety_report_missing_required_fields(self) -> None:
        create = self.client.post(
            "/api/v1/safety-reports/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-002",
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "templateId": "template-safety-report-v1",
            },
        )
        document_id = create.json()["document"]["id"]
        response = self.client.get(f"/api/v1/safety-reports/{document_id}/missing-fields")

        self.assertEqual(response.status_code, 200)
        fields = [item["field"] for item in response.json()]
        self.assertIn("inspectionDate", fields)
        self.assertIn("checklistResults", fields)

    def test_safety_report_clone_for_owner_replaces_owner_specific_values(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/clone-for-owner",
            json={"ownerPartyId": "owner-samsung-life-foundation"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["document"]["ownerPartyId"], "owner-samsung-life-foundation")
        self.assertEqual(
            response.json()["snapshot"]["meta"]["ownerDisplayName"],
            "삼성생명공익재단",
        )

    def test_safety_report_checklist_results_mapped(self) -> None:
        response = self.client.get("/api/v1/safety-reports/doc-sample-001/checklist-results")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["items"]), 1)

    def test_safety_report_finding_photo_ledger_mapped(self) -> None:
        findings = self.client.get("/api/v1/safety-reports/doc-sample-001/findings")
        photo_ledger = self.client.get("/api/v1/safety-reports/doc-sample-001/photo-ledger")

        self.assertEqual(findings.status_code, 200)
        self.assertEqual(photo_ledger.status_code, 200)
        self.assertGreaterEqual(len(findings.json()["items"]), 1)
        self.assertGreaterEqual(len(photo_ledger.json()["items"]), 1)

    def test_safety_report_safety_cost_rate_calculated(self) -> None:
        response = self.client.get("/api/v1/safety-reports/doc-sample-001/safety-cost")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["usedRateCalculated"], 38.2)

    def test_safety_report_export_blocked_when_required_missing(self) -> None:
        create = self.client.post(
            "/api/v1/safety-reports/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-002",
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "templateId": "template-safety-report-v1",
            },
        )
        document_id = create.json()["document"]["id"]
        response = self.client.post(
            f"/api/v1/safety-reports/{document_id}/export",
            json={"exportedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.json()["detail"])

    def test_safety_report_export_uses_latest_saved_snapshot(self) -> None:
        save_response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/save-section",
            json={
                "sectionKey": "cover",
                "content": {"summary": "최신 저장본"},
                "status": "edited",
            },
        )
        export_response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/export",
            json={"exportedBy": "user-engineer-001"},
        )

        self.assertEqual(save_response.status_code, 200)
        self.assertEqual(export_response.status_code, 200)
        self.assertEqual(export_response.json()["version"]["versionNo"], 2)

    def test_safety_report_regenerate_section_success(self) -> None:
        response = self.client.post("/api/v1/safety-reports/doc-sample-001/sections/cover/regenerate")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["version"]["versionNo"], 2)

    def test_safety_report_confirm_success(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/confirm",
            json={"confirmedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["document"]["status"], "confirmed")

    def test_safety_report_export_creates_file_asset(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/export",
            json={"exportedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["fileAsset"]["linkedEntityId"], "doc-sample-001")

    def test_safety_report_links_owner_report_task(self) -> None:
        create = self.client.post(
            "/api/v1/safety-reports/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-002",
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "templateId": "template-safety-report-v1",
            },
        )
        document_id = create.json()["document"]["id"]
        response = self.client.post(
            f"/api/v1/safety-reports/{document_id}/link-owner-report-task",
            json={"ownerReportTaskId": "owner-report-task-002-01"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ownerReportTask"]["documentInstanceId"], document_id)

    def test_safety_report_mark_submitted_updates_owner_report_task(self) -> None:
        self.client.post(
            "/api/v1/safety-reports/doc-sample-001/export",
            json={"exportedBy": "user-engineer-001"},
        )
        response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/mark-submitted",
            json={},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["document"]["status"], "submitted")
        self.assertEqual(response.json()["ownerReportTask"]["status"], "submitted")
        self.assertEqual(response.json()["submission"]["documentId"], "doc-sample-001")
        self.assertEqual(response.json()["mailThread"]["id"], "mail-thread-doc-sample-001")

    def test_safety_report_mark_submitted_requires_exported_file(self) -> None:
        response = self.client.post(
            "/api/v1/safety-reports/doc-sample-001/mark-submitted",
            json={},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("exportedFileId", response.json()["detail"])

    def test_safety_report_refresh_linked_data_detects_stale_source(self) -> None:
        self.client.patch(
            "/api/v1/safety-cost-usages/safety-cost-usage-sample-001",
            json={"usedAmount": 39000000},
        )
        response = self.client.post("/api/v1/safety-reports/doc-sample-001/refresh-linked-data")

        self.assertEqual(response.status_code, 200)
        warning_types = [item["type"] for item in response.json()["warnings"]]
        self.assertIn("stale_linked_data", warning_types)


if __name__ == "__main__":
    unittest.main()
