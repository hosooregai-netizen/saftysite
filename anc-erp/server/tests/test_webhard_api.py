import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import project_repository, webhard_repository
from server.app.main import app


class WebhardRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        webhard_repository.__init__(project_repository)
        self.client = TestClient(app)

    def test_project_folder_bootstrap_creates_default_tree(self) -> None:
        response = self.client.post("/api/v1/projects/project-sample-001/folders/bootstrap")

        self.assertEqual(response.status_code, 200)
        paths = [item["path"] for item in response.json()["folders"]]
        self.assertIn("/리움미술관 승강기 교체공사/00_계약_견적", paths)
        self.assertIn("/리움미술관 승강기 교체공사/04_현장점검/제10회", paths)

    def test_folder_system_folder_delete_blocked(self) -> None:
        folder_id = self._folder_id("/리움미술관 승강기 교체공사/00_계약_견적")
        response = self.client.delete(f"/api/v1/folders/{folder_id}")

        self.assertEqual(response.status_code, 400)
        self.assertIn("system", response.json()["detail"])

    def test_file_upload_creates_asset_and_version(self) -> None:
        response = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/99_기타"),
                "fileName": "임시메모.txt",
                "mimeType": "text/plain",
                "sizeBytes": 128,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["currentVersion"]["versionNo"], 1)

    def test_file_upload_records_activity(self) -> None:
        upload = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/99_기타"),
                "fileName": "활동로그확인.txt",
                "mimeType": "text/plain",
                "sizeBytes": 128,
            },
        ).json()

        response = self.client.get(f"/api/v1/files/{upload['file']['id']}/activities")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["activityType"], "uploaded")

    def test_file_classification_contract_folder(self) -> None:
        upload = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/99_기타"),
                "fileName": "기술용역계약서.pdf",
                "mimeType": "application/pdf",
                "sizeBytes": 1024,
            },
        ).json()

        response = self.client.post(f"/api/v1/files/{upload['file']['id']}/classify")

        self.assertEqual(response.status_code, 200)
        self.assertIn("00_계약_견적", response.json()["suggestion"]["recommendedFolderPath"])

    def test_file_classification_site_photo_folder(self) -> None:
        upload = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/99_기타"),
                "fileName": "현장전경_분류.jpg",
                "mimeType": "image/jpeg",
                "sizeBytes": 45000,
                "source": "photo_capture",
            },
        ).json()

        response = self.client.post(f"/api/v1/files/{upload['file']['id']}/classify")

        self.assertEqual(response.status_code, 200)
        self.assertIn("05_현장사진/원본", response.json()["suggestion"]["recommendedFolderPath"])

    def test_generated_document_saved_to_final_folder(self) -> None:
        response = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/08_최종본"),
                "fileName": "발주처제출본.pdf",
                "mimeType": "application/pdf",
                "sizeBytes": 2000,
                "source": "generated_document",
                "linkedEntityType": "document_instance",
                "linkedEntityId": "doc-sample-001",
                "tags": ["final_report"],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("/08_최종본/", response.json()["file"]["storagePath"])

    def test_mail_attachment_save_links_mail_message(self) -> None:
        response = self.client.post(
            "/api/v1/mail/messages/mail-message-test-001/attachments/save-to-webhard",
            json={
                "projectId": "project-sample-001",
                "fileName": "메일첨부_산안비.pdf",
                "mimeType": "application/pdf",
                "sizeBytes": 3400,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["link"]["entityType"], "mail_message")

    def test_mail_attachment_save_suggestions_returns_mail_message_linkage(self) -> None:
        response = self.client.get(
            "/api/v1/mail/messages/mail-message-test-001/attachments/save-suggestions?project_id=project-sample-001"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["linkedEntityType"], "mail_message")

    def test_file_version_add_success(self) -> None:
        response = self.client.post(
            "/api/v1/files/file-asset-webhard-sample-002/versions",
            json={"versionKind": "review", "changeSummary": "검토본 추가", "sizeBytes": 100},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["version"]["versionNo"], 2)

    def test_file_move_updates_folder(self) -> None:
        upload = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/99_기타"),
                "fileName": "이동대상.txt",
                "mimeType": "text/plain",
                "sizeBytes": 10,
            },
        ).json()

        response = self.client.post(
            f"/api/v1/files/{upload['file']['id']}/move",
            json={"folderId": self._folder_id("/리움미술관 승강기 교체공사/00_계약_견적")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("00_계약_견적", response.json()["file"]["storagePath"])

    def test_locked_file_cannot_be_deleted(self) -> None:
        response = self.client.delete("/api/v1/files/file-asset-webhard-sample-001")

        self.assertEqual(response.status_code, 400)
        self.assertIn("locked", response.json()["detail"])

    def test_final_report_delete_blocked(self) -> None:
        upload = self.client.post(
            "/api/v1/files/upload",
            json={
                "projectId": "project-sample-001",
                "folderId": self._folder_id("/리움미술관 승강기 교체공사/08_최종본"),
                "fileName": "최종본삭제제한.pdf",
                "mimeType": "application/pdf",
                "sizeBytes": 111,
                "tags": ["final_report"],
                "linkedEntityType": "document_instance",
                "linkedEntityId": "doc-sample-001",
                "source": "generated_document",
            },
        ).json()

        response = self.client.delete(f"/api/v1/files/{upload['file']['id']}")

        self.assertEqual(response.status_code, 400)
        self.assertIn("locked", response.json()["detail"])

    def test_share_link_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/share-links",
            json={
                "fileId": "file-asset-webhard-sample-002",
                "projectId": "project-sample-001",
                "title": "현장사진 공유",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("/share/", response.json()["publicUrl"])

    def test_share_link_revoke_blocks_access(self) -> None:
        create = self.client.post(
            "/api/v1/share-links",
            json={"fileId": "file-asset-webhard-sample-002", "projectId": "project-sample-001"},
        ).json()
        share_link_id = create["shareLink"]["id"]
        token = create["shareLink"]["tokenHash"]
        self.client.post(f"/api/v1/share-links/{share_link_id}/revoke")

        response = self.client.get(f"/api/v1/public/share/{token}")

        self.assertEqual(response.status_code, 400)

    def test_share_link_expired_blocks_access(self) -> None:
        create = self.client.post(
            "/api/v1/share-links",
            json={
                "fileId": "file-asset-webhard-sample-002",
                "projectId": "project-sample-001",
                "expiresAt": "2026-05-01T00:00:00+09:00",
            },
        ).json()

        response = self.client.get(f"/api/v1/public/share/{create['shareLink']['tokenHash']}")

        self.assertEqual(response.status_code, 400)
        self.assertIn("expired", response.json()["detail"])

    def test_share_link_access_log_created(self) -> None:
        response = self.client.get("/api/v1/public/share/share-token-sample-001")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["accessLog"]["action"], "view")

    def test_file_entity_link_document_instance(self) -> None:
        response = self.client.post(
            "/api/v1/files/file-asset-webhard-sample-002/links",
            json={
                "entityType": "document_instance",
                "entityId": "doc-sample-001",
                "relationType": "attachment",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["link"]["entityType"], "document_instance")

    def test_webhard_search_by_tag_and_project(self) -> None:
        response = self.client.get("/api/v1/webhard/search?project_id=project-sample-001&tag=site_photo")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["totalCount"], 1)

    def test_trash_restore_file(self) -> None:
        response = self.client.post("/api/v1/files/file-asset-webhard-sample-004/restore")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["file"]["status"], "active")

    def _folder_id(self, path: str) -> str:
        response = self.client.get("/api/v1/folders?project_id=project-sample-001")
        folder = next(item for item in response.json() if item["path"] == path)
        return folder["id"]


if __name__ == "__main__":
    unittest.main()
