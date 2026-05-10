import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    project_repository,
)
from server.app.main import app


SAMPLE_PROJECT_ID = "project-sample-001"
SAMPLE_ROUND_ID = "round-sample-001"


class FindingRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        self.client = TestClient(app)

    def test_finding_create_success(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/findings",
            json={"title": "임시 안전통로 정리 미비", "detail": "자재 적치물로 인해 보행 통로가 협소합니다."},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["finding"]["inspectionRoundId"], SAMPLE_ROUND_ID)

    def test_finding_requires_project_and_round(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/findings",
            json={"title": "회차 누락", "detail": "inspectionRoundId 없이 생성 시도"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("inspectionRoundId", response.json()["detail"])

    def test_finding_owner_party_must_be_owner(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/findings",
            json={
                "title": "잘못된 발주처 연결",
                "detail": "시공사 party를 ownerPartyId로 전달",
                "ownerPartyId": "project-party-contractor-001",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("owner", response.json()["detail"])

    def test_finding_from_checklist_candidate(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/findings",
            json={
                "title": "전기 안전관리 보완 필요",
                "detail": "가설전선 피복 보완 필요",
                "sourceType": "checklist_candidate",
                "sourceId": "finding-candidate-sample-001",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["finding"]["sourceId"], "finding-candidate-sample-001")
        detail = self.client.get("/api/v1/checklist-sessions/checklist-session-sample-001").json()
        candidate = next(item for item in detail["findingCandidates"] if item["id"] == "finding-candidate-sample-001")
        self.assertEqual(candidate["status"], "converted")

    def test_finding_prevent_duplicate_source(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/findings",
            json={
                "title": "중복 지적사항",
                "detail": "기존 manual source 사용",
                "sourceType": "manual",
                "sourceId": "manual-source-001",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("duplicate", response.json()["detail"])

    def test_finding_request_action_changes_status(self) -> None:
        response = self.client.post(
            "/api/v1/findings/finding-sample-004/request-action",
            json={"requiredAction": "전기용 절연테이프로 즉시 보완", "dueDate": "2026-05-20"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["finding"]["status"], "action_requested")

    def test_corrective_action_submit_success(self) -> None:
        response = self.client.post(
            "/api/v1/corrective-actions/action-sample-005/submit",
            json={"actionDetail": "케이블 릴 전선 2줄 이상 감김 상태 유지 조치", "submittedBy": "contact-contractor-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["correctiveAction"]["status"], "submitted")

    def test_corrective_action_verify_success(self) -> None:
        response = self.client.post(
            "/api/v1/corrective-actions/action-sample-002/verify",
            json={"verifiedBy": "user-engineer-001", "verifiedAt": "2026-05-12T10:00:00+09:00"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["correctiveAction"]["status"], "verified")

    def test_corrective_action_reject_requires_reason(self) -> None:
        response = self.client.post(
            "/api/v1/corrective-actions/action-sample-003/reject",
            json={"rejectedReason": ""},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("rejectedReason", response.json()["detail"])

    def test_finding_close_requires_verified_action(self) -> None:
        response = self.client.post("/api/v1/findings/finding-sample-002/close")

        self.assertEqual(response.status_code, 400)
        self.assertIn("verified", response.json()["detail"])

    def test_evidence_photo_upload_link_finding(self) -> None:
        response = self.client.post(
            "/api/v1/findings/finding-sample-002/photos/upload",
            json={
                "fileId": "file-upload-001",
                "fileName": "distribution_after.jpg",
                "storagePath": "/uploads/distribution_after.jpg",
                "photoType": "action",
                "caption": "책임자 표지 부착 후",
            },
        )
        listed = self.client.get("/api/v1/findings/finding-sample-002/photos")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(listed.json()), 2)

    def test_evidence_photo_markup_saved(self) -> None:
        response = self.client.post(
            "/api/v1/evidence-photos/photo-sample-003/markup",
            json={
                "shapes": [
                    {
                        "id": "shape-sample-001",
                        "shapeType": "ellipse",
                        "x": 0.2,
                        "y": 0.4,
                        "width": 0.3,
                        "height": 0.2,
                    }
                ]
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["photo"]["markupInfo"]["shapes"][0]["shapeType"], "ellipse")

    def test_photo_ledger_create_success(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/photo-ledgers",
            json={"ownerPartyId": "owner-samsung-cultural-foundation", "title": "신규 문화재단 사진대지"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["photoLedger"]["inspectionRoundId"], SAMPLE_ROUND_ID)

    def test_photo_ledger_generate_entries_from_findings(self) -> None:
        response = self.client.post("/api/v1/photo-ledgers/photo-ledger-sample-002/generate-entries")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["entries"]), 2)

    def test_photo_ledger_warns_missing_action_photo(self) -> None:
        response = self.client.post("/api/v1/photo-ledgers/photo-ledger-sample-001/validate")

        self.assertEqual(response.status_code, 200)
        codes = [item["code"] for item in response.json()["warnings"]]
        self.assertIn("missing_action_photo", codes)

    def test_photo_ledger_warns_unverified_action(self) -> None:
        response = self.client.post("/api/v1/photo-ledgers/photo-ledger-sample-001/validate")

        self.assertEqual(response.status_code, 200)
        codes = [item["code"] for item in response.json()["warnings"]]
        self.assertIn("unverified_action", codes)

    def test_photo_ledger_owner_mismatch_is_danger(self) -> None:
        self.client.post(
            "/api/v1/photo-ledgers/photo-ledger-sample-001/entries",
            json={"findingId": "finding-sample-003"},
        )

        response = self.client.post("/api/v1/photo-ledgers/photo-ledger-sample-001/validate")

        self.assertEqual(response.status_code, 200)
        owner_mismatch = next(item for item in response.json()["warnings"] if item["code"] == "owner_mismatch")
        self.assertEqual(owner_mismatch["severity"], "danger")

    def test_photo_ledger_owner_filter(self) -> None:
        response = self.client.get("/api/v1/photo-ledgers/photo-ledger-sample-001")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            all(item["ownerPartyId"] == "owner-samsung-cultural-foundation" for item in response.json()["findings"])
        )

    def test_photo_ledger_reorder_entries(self) -> None:
        response = self.client.post(
            "/api/v1/photo-ledgers/photo-ledger-sample-001/reorder",
            json={"entryIds": ["photo-ledger-entry-sample-002", "photo-ledger-entry-sample-001"]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["displayOrder"], 1)
        self.assertEqual(response.json()[0]["id"], "photo-ledger-entry-sample-002")

    def test_photo_ledger_export_uses_confirmed_entries(self) -> None:
        response = self.client.post("/api/v1/photo-ledgers/photo-ledger-sample-001/export")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["usedConfirmedEntries"])

    def test_photo_ledger_sync_to_safety_report(self) -> None:
        response = self.client.post(
            "/api/v1/photo-ledgers/photo-ledger-sample-001/sync-to-report",
            json={"documentId": "doc-sample-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sectionKey"], "photo_ledger")
        self.assertIn("documentVersion", response.json())
        self.assertEqual(
            finding_repository.documentVersions[response.json()["documentVersionId"]].sourcePhotoLedgerId,
            "photo-ledger-sample-001",
        )

    def test_get_document_photo_ledger_section(self) -> None:
        sync_response = self.client.post(
            "/api/v1/photo-ledgers/photo-ledger-sample-001/sync-to-report",
            json={"documentId": "doc-sample-001"},
        )
        response = self.client.get("/api/v1/documents/doc-sample-001/photo-ledger-section")

        self.assertEqual(sync_response.status_code, 200)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["section"]["sectionKey"], "photo_ledger")
        self.assertEqual(response.json()["documentVersion"]["id"], sync_response.json()["documentVersionId"])

    def test_action_request_mail_draft_includes_findings(self) -> None:
        response = self.client.post(
            "/api/v1/findings/action-request-mail/draft",
            json={
                "projectId": SAMPLE_PROJECT_ID,
                "inspectionRoundId": SAMPLE_ROUND_ID,
                "findingIds": ["finding-sample-002", "finding-sample-003"],
                "ownerPartyId": "owner-samsung-cultural-foundation",
                "contractorContactId": "contact-contractor-001",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("조치", response.json()["mailDraft"]["body"])

    def test_action_request_mail_send_creates_mail_thread(self) -> None:
        draft_response = self.client.post(
            "/api/v1/findings/action-request-mail/draft",
            json={
                "projectId": SAMPLE_PROJECT_ID,
                "inspectionRoundId": SAMPLE_ROUND_ID,
                "findingIds": ["finding-sample-002"],
                "contractorContactId": "contact-contractor-001",
            },
        )
        response = self.client.post(
            "/api/v1/findings/action-request-mail/send",
            json={"mailDraftId": draft_response.json()["mailDraft"]["id"]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("mailThread", response.json())
        self.assertTrue(response.json()["mailDraft"]["mailThreadId"])
        self.assertIn(response.json()["mailDraft"]["mailThreadId"], finding_repository.mailThreads)


if __name__ == "__main__":
    unittest.main()
