import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    mail_repository,
    project_repository,
    safety_report_repository,
    webhard_repository,
)
from server.app.main import app


class MailRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        safety_report_repository.__init__(project_repository, inspection_repository)
        webhard_repository.__init__(project_repository)
        mail_repository.__init__(project_repository)
        self.client = TestClient(app)

    def test_mail_account_guest_create(self) -> None:
        response = self.client.post("/api/v1/mail/accounts/guest", json={"projectId": "project-sample-001"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["account"]["mode"], "guest_draft_mode")

    def test_mail_oauth_start_returns_auth_url(self) -> None:
        response = self.client.post("/api/v1/mail/oauth/google/start")

        self.assertEqual(response.status_code, 200)
        self.assertIn("accounts.google.com", response.json()["authUrl"])

    def test_mail_sync_creates_threads_and_messages(self) -> None:
        response = self.client.post("/api/v1/mail/accounts/mail-account-google-001/sync")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["threads"]), 1)
        self.assertEqual(len(response.json()["messages"]), 1)
        self.assertEqual(response.json()["auditLog"]["action"], "mail.sync")

    def test_mail_sync_dedupes_provider_records(self) -> None:
        self.client.post("/api/v1/mail/accounts/mail-account-google-001/sync")
        response = self.client.post("/api/v1/mail/accounts/mail-account-google-001/sync")

        self.assertEqual(response.status_code, 200)
        thread_ids = [item.id for item in mail_repository.list_threads(project_id="project-sample-001")]
        self.assertEqual(thread_ids.count(response.json()["threads"][0]["id"]), 1)

    def test_mail_project_classification_by_subject(self) -> None:
        response = self.client.post("/api/v1/mail/messages/mail-message-sample-001/classify")

        self.assertEqual(response.status_code, 200)
        entity_types = [item["entityType"] for item in response.json()["links"]]
        self.assertIn("document_instance", entity_types)

    def test_mail_project_classification_by_contact_email(self) -> None:
        response = self.client.post("/api/v1/mail/messages/mail-message-sample-002/classify")

        self.assertEqual(response.status_code, 200)
        relation_types = [item["relationType"] for item in response.json()["links"]]
        self.assertIn("contact_match", relation_types)

    def test_mail_draft_create_report_submission(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        response = self.client.post("/api/v1/documents/doc-sample-001/submission-mail/draft", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["draft"]["draftType"], "submission_mail")

    def test_mail_draft_report_submission_requires_exported_file(self) -> None:
        response = self.client.post("/api/v1/documents/doc-sample-001/submission-mail/draft", json={})

        self.assertEqual(response.status_code, 400)
        self.assertIn("exportedFileId", response.json()["detail"])

    def test_mail_draft_submission_validate_owner_mismatch_warning(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        draft = self.client.post("/api/v1/documents/doc-sample-001/submission-mail/draft", json={}).json()
        self.client.patch(
            f"/api/v1/mail/drafts/{draft['draft']['id']}",
            json={"toAddresses": ["owner2@example.com"]},
        )
        response = self.client.post(f"/api/v1/mail/drafts/{draft['draft']['id']}/validate")

        self.assertEqual(response.status_code, 200)
        self.assertIn("owner_mismatch", response.json()["warnings"])

    def test_mail_draft_action_request_requires_findings(self) -> None:
        create = self.client.post(
            "/api/v1/mail/drafts",
            json={"draftType": "action_request", "projectId": "project-sample-001", "toAddresses": ["contractor@example.com"]},
        ).json()
        response = self.client.post(f"/api/v1/mail/drafts/{create['draft']['id']}/validate")

        self.assertEqual(response.status_code, 200)
        self.assertIn("findingIds_required", response.json()["warnings"])

    def test_mail_draft_validate_recipients(self) -> None:
        create = self.client.post(
            "/api/v1/mail/drafts",
            json={
                "draftType": "general",
                "projectId": "project-sample-001",
                "toAddresses": ["invalid-recipient"],
                "subject": "테스트",
                "body": "본문",
            },
        ).json()
        response = self.client.post(f"/api/v1/mail/drafts/{create['draft']['id']}/validate")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["recipientsValid"])

    def test_mail_send_connected_mode_success(self) -> None:
        create = self.client.post(
            "/api/v1/mail/drafts",
            json={
                "draftType": "general",
                "mode": "connected_oauth_mode",
                "projectId": "project-sample-001",
                "toAddresses": ["owner1@example.com"],
                "subject": "현장 협의",
                "body": "본문",
            },
        ).json()
        response = self.client.post(f"/api/v1/mail/drafts/{create['draft']['id']}/send", json={})

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["mailThread"])
        self.assertIsNotNone(response.json()["message"])

    def test_mail_send_guest_mode_blocked_or_copy_only(self) -> None:
        create = self.client.post(
            "/api/v1/mail/drafts",
            json={
                "draftType": "general",
                "mode": "guest_draft_mode",
                "projectId": "project-sample-001",
                "toAddresses": ["owner1@example.com"],
                "subject": "draft only",
                "body": "본문",
            },
        ).json()
        response = self.client.post(f"/api/v1/mail/drafts/{create['draft']['id']}/send", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sendMode"], "copy_only")

    def test_mail_attachment_save_to_webhard(self) -> None:
        response = self.client.post("/api/v1/mail/attachments/mail-attachment-sample-002/save-to-webhard")

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["attachment"]["savedFileId"])
        self.assertEqual(response.json()["auditLog"]["action"], "mail.attachment_saved")

    def test_mail_attachment_duplicate_creates_file_version(self) -> None:
        self.client.post("/api/v1/mail/attachments/mail-attachment-sample-001/save-to-webhard")
        response = self.client.post("/api/v1/mail/attachments/mail-attachment-sample-001/save-to-webhard")

        self.assertEqual(response.status_code, 200)
        self.assertIn("version", response.json())

    def test_report_submission_mail_creates_submission(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        draft = self.client.post("/api/v1/documents/doc-sample-001/submission-mail/draft", json={}).json()
        response = self.client.post(f"/api/v1/mail/drafts/{draft['draft']['id']}/send", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["documentId"], "doc-sample-001")

    def test_report_submission_mail_updates_document_status(self) -> None:
        self.client.post("/api/v1/safety-reports/doc-sample-001/export", json={"exportedBy": "user-engineer-001"})
        draft = self.client.post("/api/v1/documents/doc-sample-001/submission-mail/draft", json={}).json()
        response = self.client.post(f"/api/v1/mail/drafts/{draft['draft']['id']}/send", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["document"]["status"], "submitted")
        self.assertEqual(response.json()["auditLog"]["action"], "mail.sent")

    def test_action_request_mail_updates_finding_status(self) -> None:
        draft = self.client.post(
            "/api/v1/mail/drafts",
            json={
                "draftType": "action_request",
                "mode": "connected_oauth_mode",
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-001",
                "findingIds": ["finding-sample-001"],
                "toAddresses": ["contractor@example.com"],
                "subject": "조치 요청",
                "body": "본문",
            },
        ).json()
        response = self.client.post(f"/api/v1/mail/drafts/{draft['draft']['id']}/send", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(finding_repository.get_finding("finding-sample-001").status, "action_requested")

    def test_mail_message_link_entity_confirmed(self) -> None:
        response = self.client.post(
            "/api/v1/mail/messages/mail-message-sample-002/link-entity",
            json={
                "projectId": "project-sample-001",
                "entityType": "finding",
                "entityId": "finding-sample-001",
                "relationType": "action_request",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["link"]["confirmed"])
        self.assertEqual(response.json()["auditLog"]["action"], "mail.link_entity")

    def test_mail_schedule_coordination_draft_route(self) -> None:
        response = self.client.post("/api/v1/inspection-rounds/round-sample-001/schedule-coordination-mail/draft")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["draft"]["draftType"], "schedule_coordination")
        self.assertEqual(response.json()["draft"]["inspectionRoundId"], "round-sample-001")

    def test_mail_contract_send_draft_route(self) -> None:
        response = self.client.post("/api/v1/contracts/contract-sample-001/send-mail/draft")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["draft"]["draftType"], "contract_send")
        self.assertEqual(response.json()["draft"]["contractId"], "contract-sample-001")

    def test_mail_action_request_draft_includes_evidence_attachments(self) -> None:
        response = self.client.post(
            "/api/v1/findings/action-request-mail/draft",
            json={
                "projectId": "project-sample-001",
                "inspectionRoundId": "round-sample-001",
                "findingIds": ["finding-sample-001"],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()["mailDraft"]["attachmentFileIds"]), 0)

    def test_mail_audit_logs_persisted_for_mailbox_flows(self) -> None:
        sync_response = self.client.post("/api/v1/mail/accounts/mail-account-google-001/sync")
        link_response = self.client.post(
            "/api/v1/mail/messages/mail-message-sample-002/link-entity",
            json={
                "projectId": "project-sample-001",
                "entityType": "finding",
                "entityId": "finding-sample-001",
                "relationType": "action_request",
            },
        )
        save_response = self.client.post("/api/v1/mail/attachments/mail-attachment-sample-002/save-to-webhard")

        self.assertTrue(mail_repository.list_audit_logs("mail_account", "mail-account-google-001"))
        self.assertTrue(mail_repository.list_audit_logs("mail_message", "mail-message-sample-002"))
        self.assertTrue(mail_repository.list_audit_logs("mail_attachment", "mail-attachment-sample-002"))
        self.assertEqual(sync_response.json()["auditLog"]["action"], "mail.sync")
        self.assertEqual(link_response.json()["auditLog"]["action"], "mail.link_entity")
        self.assertEqual(save_response.json()["auditLog"]["action"], "mail.attachment_saved")

    def test_mail_template_variable_mapping(self) -> None:
        response = self.client.get("/api/v1/mail/templates")

        self.assertEqual(response.status_code, 200)
        submission = next(item for item in response.json() if item["templateType"] == "submission")
        self.assertIn("documentTitle", submission["variables"])


if __name__ == "__main__":
    unittest.main()
