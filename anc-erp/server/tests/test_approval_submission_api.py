import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    approval_repository,
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    mail_repository,
    project_repository,
    safety_cost_repository,
    safety_report_repository,
)
from server.app.main import app


class ApprovalSubmissionRoutesTestCase(unittest.TestCase):
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
        self.client = TestClient(app)

    def test_document_approval_request_success(self) -> None:
        response = self.client.post(
            "/api/v1/documents/doc-sample-001/approval/request",
            json={"requestedBy": "user-engineer-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["workflow"]["documentId"], "doc-sample-001")

    def test_approval_workflow_requires_document_project_match(self) -> None:
        response = self.client.post(
            "/api/v1/approval-workflows",
            json={"documentId": "doc-sample-001", "projectId": "project-mismatch"},
        )

        self.assertEqual(response.status_code, 400)

    def test_approval_step_approve_moves_next_step(self) -> None:
        response = self.client.post(
            "/api/v1/approval-steps/approval-step-sample-001/approve",
            json={"actedBy": "user-chief-001", "comment": "1차 검토 완료"},
        )

        self.assertEqual(response.status_code, 200)
        step_statuses = {item["id"]: item["status"] for item in response.json()["steps"]}
        self.assertEqual(step_statuses["approval-step-sample-001"], "approved")
        self.assertEqual(step_statuses["approval-step-sample-002"], "current")

    def test_approval_request_changes_updates_document_status(self) -> None:
        response = self.client.post(
            "/api/v1/approval-steps/approval-step-sample-001/request-changes",
            json={"actedBy": "user-chief-001", "comment": "문서 수정 필요"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["workflow"]["status"], "changes_requested")
        self.assertEqual(response.json()["document"]["status"], "changes_requested")

    def test_approval_workflow_completed_when_required_steps_approved(self) -> None:
        self.client.post("/api/v1/approval-steps/approval-step-sample-001/approve", json={"actedBy": "user-001"})
        response = self.client.post("/api/v1/approval-steps/approval-step-sample-002/approve", json={"actedBy": "user-002"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["workflow"]["status"], "approved")
        self.assertEqual(response.json()["document"]["status"], "approved")

    def test_approval_step_reject_blocks_submission(self) -> None:
        response = self.client.post(
            "/api/v1/approval-steps/approval-step-sample-001/reject",
            json={"actedBy": "user-chief-001", "comment": "보완 필요"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["workflow"]["status"], "rejected")
        document_response = self.client.get("/api/v1/documents/doc-sample-001/submission-readiness")
        warning_codes = [item["code"] for item in document_response.json()["warnings"]]
        self.assertIn("approval_missing", warning_codes)

    def test_signature_task_complete_requires_signed_file_when_upload_type(self) -> None:
        response = self.client.post("/api/v1/signature-tasks/signature-task-sample-002/complete", json={})

        self.assertEqual(response.status_code, 400)
        self.assertIn("signedFileId", response.json()["detail"])

    def test_signature_task_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/documents/doc-sample-001/signature-tasks",
            json={"taskType": "seal_review", "title": "날인 확인", "required": False},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["task"]["documentId"], "doc-sample-001")

    def test_signature_task_waive_requires_reason(self) -> None:
        response = self.client.post("/api/v1/signature-tasks/signature-task-sample-002/waive", json={})

        self.assertEqual(response.status_code, 422)

    def test_submission_readiness_detects_missing_signature(self) -> None:
        response = self.client.get("/api/v1/documents/doc-sample-001/submission-readiness")

        self.assertEqual(response.status_code, 200)
        warning_codes = [item["code"] for item in response.json()["warnings"]]
        self.assertIn("signature_missing", warning_codes)

    def test_submission_readiness_detects_missing_approval(self) -> None:
        response = self.client.get("/api/v1/documents/doc-sample-001/submission-readiness")

        self.assertEqual(response.status_code, 200)
        warning_codes = [item["code"] for item in response.json()["warnings"]]
        self.assertIn("approval_missing", warning_codes)

    def test_submission_package_validate_requires_main_file(self) -> None:
        response = self.client.post("/api/v1/documents/doc-sample-001/submission-packages", json={})

        self.assertEqual(response.status_code, 400)
        self.assertIn("mainFileId", response.json()["detail"])

    def test_submission_package_create_success(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        response = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["package"]["documentId"], "doc-sample-001")

    def test_submission_mail_send_updates_document_status(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        self.client.post("/api/v1/approval-steps/approval-step-sample-001/approve", json={"actedBy": "user-001"})
        self.client.post("/api/v1/approval-steps/approval-step-sample-002/approve", json={"actedBy": "user-002"})
        upload = self.client.post(
            "/api/v1/documents/doc-sample-001/signed-files/upload",
            json={"fileName": "signed-report.pdf", "fileType": "application/pdf"},
        )
        self.assertEqual(upload.status_code, 200)
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": upload.json()["fileAsset"]["id"], "signedFileId": upload.json()["fileAsset"]["id"]},
        )
        self.assertEqual(package.status_code, 200)
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={
                "documentId": "doc-sample-001",
                "packageId": package.json()["package"]["id"],
                "recipientEmails": ["owner1@example.com"],
            },
        )
        self.assertEqual(submission.status_code, 200)
        response = self.client.post(
            f"/api/v1/submissions/{submission.json()['submission']['id']}/send-mail",
            json={"sentAt": "2026-05-10T13:10:00+09:00"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["status"], "submitted")
        self.assertEqual(response.json()["document"]["status"], "submitted")
        self.assertEqual(response.json()["auditLog"]["action"], "submission.mail_sent")

    def test_submission_mail_send_creates_mail_message(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        self.client.post("/api/v1/approval-steps/approval-step-sample-001/approve", json={"actedBy": "user-001"})
        self.client.post("/api/v1/approval-steps/approval-step-sample-002/approve", json={"actedBy": "user-002"})
        upload = self.client.post(
            "/api/v1/documents/doc-sample-001/signed-files/upload",
            json={"fileName": "signed-report.pdf", "fileType": "application/pdf"},
        )
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": upload.json()["fileAsset"]["id"], "signedFileId": upload.json()["fileAsset"]["id"]},
        )
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={"documentId": "doc-sample-001", "packageId": package.json()["package"]["id"], "recipientEmails": ["owner1@example.com"]},
        )
        response = self.client.post(f"/api/v1/submissions/{submission.json()['submission']['id']}/send-mail", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mailMessage"]["submissionId"], submission.json()["submission"]["id"])

    def test_submission_manual_submit_success(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={"documentId": "doc-sample-001", "packageId": package.json()["package"]["id"]},
        )
        response = self.client.post(
            f"/api/v1/submissions/{submission.json()['submission']['id']}/mark-manual-submitted",
            json={"memo": "수동 접수", "submittedAt": "2026-05-10T13:30:00+09:00"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["status"], "manual_submitted")
        self.assertEqual(response.json()["document"]["status"], "manual_submitted")
        self.assertEqual(response.json()["auditLog"]["action"], "submission.manual_submitted")

    def test_submission_owner_party_must_be_owner(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )
        response = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={
                "documentId": "doc-sample-001",
                "packageId": package.json()["package"]["id"],
                "ownerPartyId": "owner-mismatch",
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_submission_confirm_owner_receipt(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={"documentId": "doc-sample-001", "packageId": package.json()["package"]["id"]},
        )
        response = self.client.post(f"/api/v1/submissions/{submission.json()['submission']['id']}/confirm-owner-receipt")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["status"], "received")
        self.assertEqual(response.json()["auditLog"]["action"], "submission.receipt_confirmed")

    def test_submission_revision_request_updates_status(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={"documentId": "doc-sample-001", "packageId": package.json()["package"]["id"]},
        )
        response = self.client.post(
            f"/api/v1/submissions/{submission.json()['submission']['id']}/request-revision",
            json={"memo": "첨부 보완"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["status"], "revision_requested")
        self.assertEqual(response.json()["auditLog"]["action"], "submission.revision_requested")

    def test_submission_archives_final_package(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={"documentId": "doc-sample-001", "packageId": package.json()["package"]["id"]},
        )
        response = self.client.post(f"/api/v1/submissions/{submission.json()['submission']['id']}/archive")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["status"], "archived")
        self.assertEqual(response.json()["package"]["status"], "archived")

    def test_submission_creates_audit_log(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        package = self.client.post(
            "/api/v1/documents/doc-sample-001/submission-packages",
            json={"mainFileId": safety_report_repository.get_document("doc-sample-001").exportedFileId},
        )
        submission = self.client.post(
            "/api/v1/projects/project-sample-001/submissions",
            json={"documentId": "doc-sample-001", "packageId": package.json()["package"]["id"]},
        )
        response = self.client.post(
            f"/api/v1/submissions/{submission.json()['submission']['id']}/mark-manual-submitted",
            json={"memo": "수동 제출"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["auditLogs"]), 1)


if __name__ == "__main__":
    unittest.main()
