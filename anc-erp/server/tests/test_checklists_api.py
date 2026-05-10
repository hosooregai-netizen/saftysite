import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    inspection_repository,
    project_repository,
)
from server.app.main import app


SAMPLE_ROUND_ID = "round-sample-001"
SAMPLE_SESSION_ID = "checklist-session-sample-001"
SAMPLE_TEMPLATE_ID = "checklist-template-sample-001"
SAMPLE_RESULT_ID = "checklist-result-003"


class ChecklistRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        self.client = TestClient(app)

    def test_checklist_template_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/checklist-templates",
            json={"name": "신규 체크리스트 템플릿"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["template"]["name"], "신규 체크리스트 템플릿")

    def test_checklist_session_create_from_template(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/checklist-sessions",
            json={"templateId": SAMPLE_TEMPLATE_ID},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["session"]["inspectionRoundId"], SAMPLE_ROUND_ID)

    def test_checklist_session_initializes_results(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/checklist-sessions",
            json={"templateId": SAMPLE_TEMPLATE_ID},
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["results"]), 4)

    def test_checklist_session_generates_risk_reduction_items(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/checklist-sessions",
            json={"templateId": SAMPLE_TEMPLATE_ID},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["riskReductionItems"]), 20)

    def test_checklist_result_save_good(self) -> None:
        response = self.client.patch(
            "/api/v1/checklist-results/checklist-result-001",
            json={"result": "good"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["result"]["result"], "good")

    def test_checklist_result_caution_creates_finding_candidate(self) -> None:
        created = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/checklist-sessions",
            json={"templateId": SAMPLE_TEMPLATE_ID},
        ).json()
        result_id = next(
            item["id"] for item in created["results"] if item["checklistItemId"].startswith("checklist-item")
        )
        response = self.client.patch(
            f"/api/v1/checklist-results/{result_id}",
            json={"result": "caution", "comment": "보완 필요"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["result"]["findingCandidateId"])

    def test_checklist_result_bad_creates_finding_candidate(self) -> None:
        created = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/checklist-sessions",
            json={"templateId": SAMPLE_TEMPLATE_ID},
        ).json()
        result_id = created["results"][1]["id"]
        response = self.client.patch(
            f"/api/v1/checklist-results/{result_id}",
            json={"result": "bad", "comment": "즉시 조치 필요"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["result"]["findingCandidateId"])

    def test_checklist_locked_session_prevents_update(self) -> None:
        self.client.post(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/lock")
        response = self.client.patch(
            f"/api/v1/checklist-results/{SAMPLE_RESULT_ID}",
            json={"result": "good"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("locked", response.json()["detail"])

    def test_additional_hazard_create_success(self) -> None:
        response = self.client.post(
            f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/additional-hazards",
            json={
                "hazardDescription": "임시 적치물 전도 위험",
                "checkPoint": "자재 적치 구역 정리 상태 확인",
                "implementationStatus": "not_checked",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["additionalHazard"]["hazardDescription"], "임시 적치물 전도 위험")

    def test_checklist_photo_upload_links_result(self) -> None:
        response = self.client.post(
            f"/api/v1/checklist-results/{SAMPLE_RESULT_ID}/photos/upload",
            json={
                "fileId": "file-upload-001",
                "fileName": "upload.jpg",
                "storagePath": "/uploads/upload.jpg",
                "caption": "현장 사진",
            },
        )
        listed = self.client.get(f"/api/v1/checklist-results/{SAMPLE_RESULT_ID}/photos")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(listed.json()), 2)

    def test_checklist_complete_requires_required_items(self) -> None:
        response = self.client.post(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/complete")

        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.json()["detail"])

    def test_checklist_summary_generates_report_mapping(self) -> None:
        response = self.client.post(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/summarize")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["reportMappings"]), 1)

    def test_checklist_result_changes_mark_report_mapping_stale(self) -> None:
        self.client.post(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/summarize")
        response = self.client.patch(
            "/api/v1/checklist-results/checklist-result-001",
            json={"result": "bad", "comment": "재검토 필요"},
        )
        mapping_response = self.client.get(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/report-mapping")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(mapping_response.json()["reportMappings"][0]["stale"])

    def test_checklist_mobile_draft_commit(self) -> None:
        created = self.client.post(
            f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/mobile-drafts",
            json={"clientVersion": 1, "draftVersion": 1, "payload": {"offline": True}},
        ).json()
        response = self.client.post(
            f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/mobile-drafts/{created['mobileDraft']['id']}/commit",
            json={"clientVersion": 2, "draftVersion": 2, "payload": {"offline": False}},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mobileDraft"]["draftVersion"], 2)

    def test_checklist_report_sync_to_safety_report(self) -> None:
        self.client.post(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/summarize")
        response = self.client.post(f"/api/v1/checklist-sessions/{SAMPLE_SESSION_ID}/sync-to-report")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reportMappings"][0]["documentId"], "doc-sample-001")


if __name__ == "__main__":
    unittest.main()
