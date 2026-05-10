import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    project_repository,
    safety_cost_repository,
)
from server.app.main import app


SAMPLE_PROJECT_ID = "project-sample-001"
SAMPLE_ROUND_ID = "round-sample-001"
NEW_ROUND_ID = "round-sample-002"


class SafetyCostRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        safety_cost_repository.__init__(project_repository, inspection_repository)
        self.client = TestClient(app)

    def test_safety_cost_create_success(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
                "basisMonth": "2월말",
                "basisDocumentText": "산업안전보건관리비 사용내역서",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["usage"]["inspectionRoundId"], NEW_ROUND_ID)

    def test_safety_cost_requires_project_round_owner(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/safety-cost-usages",
            json={"calculatedAmount": 100000000, "usedAmount": 30000000},
        )

        self.assertEqual(response.status_code, 422)

    def test_safety_cost_owner_party_must_be_owner(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "project-party-contractor-001",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("owner", response.json()["detail"])

    def test_safety_cost_calculates_used_rate(self) -> None:
        response = self.client.post("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/calculate-rate")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["usedRateCalculated"], 38.2)

    def test_safety_cost_rate_mismatch_warning(self) -> None:
        create_response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
                "userEnteredRate": 10,
                "basisMonth": "2월말",
                "basisDocumentText": "산업안전보건관리비 사용내역서",
            },
        )
        usage_id = create_response.json()["usage"]["id"]
        response = self.client.post(f"/api/v1/safety-cost-usages/{usage_id}/validate")

        self.assertEqual(response.status_code, 200)
        warning_types = [item["type"] for item in response.json()["warnings"]]
        self.assertIn("rate_mismatch", warning_types)

    def test_safety_cost_used_amount_exceeds_calculated_amount_warning(self) -> None:
        create_response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 130000000,
                "basisMonth": "2월말",
                "basisDocumentText": "산업안전보건관리비 사용내역서",
            },
        )
        usage_id = create_response.json()["usage"]["id"]
        response = self.client.post(f"/api/v1/safety-cost-usages/{usage_id}/validate")

        self.assertEqual(response.status_code, 200)
        warning = next(item for item in response.json()["warnings"] if item["type"] == "used_amount_exceeds_calculated")
        self.assertEqual(warning["severity"], "danger")

    def test_safety_cost_requires_basis_for_confirm(self) -> None:
        create_response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
            },
        )
        response = self.client.post(
            f"/api/v1/safety-cost-usages/{create_response.json()['usage']['id']}/confirm",
            json={"confirmedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("basis", response.json()["detail"])

    def test_safety_cost_evidence_upload_link_file(self) -> None:
        response = self.client.post(
            "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/evidence/upload",
            json={
                "fileId": "file-upload-001",
                "evidenceType": "receipt",
                "fileName": "receipt.pdf",
                "storagePath": "/uploads/receipt.pdf",
            },
        )
        listed = self.client.get("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/evidence")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(listed.json()), 2)

    def test_safety_cost_generate_comment(self) -> None:
        response = self.client.post("/api/v1/safety-cost-usages/safety-cost-usage-sample-002/generate-comment")

        self.assertEqual(response.status_code, 200)
        self.assertIn("판단", response.json()["review"]["reviewComment"])

    def test_safety_cost_review_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/safety-cost-usages/safety-cost-usage-sample-002/review",
            json={
                "reviewerId": "user-engineer-001",
                "reviewComment": "추가 증빙은 확인되었으며 적정 사용으로 판단합니다.",
                "appropriatenessStatus": "appropriate",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["review"]["appropriatenessStatus"], "appropriate")

    def test_safety_cost_confirm_success(self) -> None:
        create_response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
                "basisMonth": "2월말",
                "basisDocumentText": "산업안전보건관리비 사용내역서",
            },
        )
        usage_id = create_response.json()["usage"]["id"]
        self.client.post(
            f"/api/v1/safety-cost-usages/{usage_id}/evidence/upload",
            json={
                "fileId": "file-upload-confirm-001",
                "evidenceType": "receipt",
                "fileName": "receipt.pdf",
                "storagePath": "/uploads/receipt.pdf",
            },
        )
        response = self.client.post(
            f"/api/v1/safety-cost-usages/{usage_id}/confirm",
            json={"confirmedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["usage"]["status"], "confirmed")

    def test_safety_cost_confirm_blocked_without_evidence(self) -> None:
        create_response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
                "basisMonth": "2월말",
                "basisDocumentText": "산업안전보건관리비 사용내역서",
            },
        )
        response = self.client.post(
            f"/api/v1/safety-cost-usages/{create_response.json()['usage']['id']}/confirm",
            json={"confirmedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("evidence", response.json()["detail"])

    def test_safety_cost_sync_to_report_updates_sections(self) -> None:
        response = self.client.post(
            "/api/v1/safety-cost-usages/safety-cost-usage-sample-001/sync-to-report",
            json={"documentId": "doc-sample-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sectionKey"], "safety_cost_usage")
        self.assertIn("documentVersion", response.json())

    def test_safety_cost_history_created_on_amount_update(self) -> None:
        self.client.patch(
            "/api/v1/safety-cost-usages/safety-cost-usage-sample-001",
            json={"usedAmount": 39000000},
        )
        response = self.client.get("/api/v1/safety-cost-usages/safety-cost-usage-sample-001/history")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 2)

    def test_safety_cost_owner_matrix_returns_all_owners(self) -> None:
        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/safety-cost-usages/owner-matrix")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["rows"]), 2)

    def test_safety_cost_report_export_missing_warning(self) -> None:
        create_response = self.client.post(
            f"/api/v1/inspection-rounds/{NEW_ROUND_ID}/safety-cost-usages",
            json={
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "calculatedAmount": 100000000,
                "usedAmount": 30000000,
            },
        )
        usage_id = create_response.json()["usage"]["id"]
        response = self.client.post(f"/api/v1/safety-cost-usages/{usage_id}/validate")

        self.assertEqual(response.status_code, 200)
        warning_types = [item["type"] for item in response.json()["warnings"]]
        self.assertIn("missing_evidence", warning_types)

    def test_get_document_safety_cost_usage(self) -> None:
        response = self.client.get("/api/v1/documents/doc-sample-001/safety-cost-usage")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["documentId"], "doc-sample-001")
        self.assertEqual(response.json()["section"]["sectionKey"], "safety_cost_usage")

    def test_refresh_document_safety_cost_usage(self) -> None:
        response = self.client.post("/api/v1/documents/doc-sample-001/safety-cost-usage/refresh")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["documentId"], "doc-sample-001")
        self.assertEqual(response.json()["sectionKey"], "safety_cost_usage")


if __name__ == "__main__":
    unittest.main()
