import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import project_repository
from server.app.main import app


SAMPLE_PROJECT_ID = "project-sample-001"


class ProjectRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        self.client = TestClient(app)

    def test_project_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json={
                "projectName": "신규 현장",
                "siteName": "신규 현장",
                "siteAddress": "서울시 강남구",
                "constructionType": "리모델링",
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project"]["projectName"], "신규 현장")
        self.assertIn("project.defaultWebhardFolder.requested", payload["pendingEvents"])

    def test_project_requires_project_name(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json={"projectName": " ", "siteName": "현장"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("projectName is required", response.json()["detail"])

    def test_project_update_success(self) -> None:
        response = self.client.patch(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}",
            json={"progressRate": 8.2},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["project"]["progressRate"], 8.2)

    def test_project_progress_rate_range(self) -> None:
        response = self.client.patch(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}",
            json={"progressRate": 130},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("progressRate", response.json()["detail"])

    def test_project_date_range_validation(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json={
                "projectName": "날짜 검증",
                "startDate": "2026-12-31",
                "endDate": "2026-01-01",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("startDate", response.json()["detail"])

    def test_project_total_inspection_rounds_non_negative(self) -> None:
        response = self.client.post(
            "/api/v1/projects",
            json={"projectName": "회차 검증", "totalInspectionRounds": -1},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("totalInspectionRounds", response.json()["detail"])

    def test_project_soft_archive_when_related_documents_exist(self) -> None:
        response = self.client.delete(f"/api/v1/projects/{SAMPLE_PROJECT_ID}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project"]["status"], "archived")
        self.assertEqual(payload["archivedBecause"], "related-documents-exist")

    def test_organization_duplicate_warning(self) -> None:
        response = self.client.post(
            "/api/v1/organizations",
            json={"name": "삼성문화재단", "type": "owner"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["warnings"], ["organization_duplicate"])

    def test_project_party_multiple_owners(self) -> None:
        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/parties")

        self.assertEqual(response.status_code, 200)
        owners = [item for item in response.json() if item["role"] == "owner"]
        self.assertGreaterEqual(len(owners), 2)

    def test_project_party_owner_requires_separate_report(self) -> None:
        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/parties")
        owners = [item for item in response.json() if item["role"] == "owner"]

        self.assertTrue(all(item["requiresSeparateReport"] for item in owners))
        self.assertTrue(all(item["ownerPartyId"] for item in owners))

    def test_project_party_share_ratio_warning(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/parties/calculate-share",
            json={
                "totalAmount": 100,
                "parties": [
                    {"shareRatio": 60, "shareAmount": 60},
                    {"shareRatio": 50, "shareAmount": 40},
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("shareRatioSumOver100", response.json()["warnings"])

    def test_project_party_share_amount_warning(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/parties/calculate-share",
            json={
                "totalAmount": 100,
                "parties": [
                    {"shareRatio": 50, "shareAmount": 40},
                    {"shareRatio": 50, "shareAmount": 40},
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("shareAmountMismatchAgainstTotalAmount", response.json()["warnings"])

    def test_contact_create_success(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contacts",
            json={
                "organizationId": "org-engineer-001",
                "name": "정엔지",
                "email": "engineer@example.com",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contact"]["name"], "정엔지")

    def test_contact_report_recipient_requires_email_warning(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contacts",
            json={
                "organizationId": "org-owner-001",
                "name": "이메일없음",
                "receivesReport": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("reportRecipientRequiresEmail", response.json()["warnings"])

    def test_project_requirements_for_safety_report(self) -> None:
        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/requirements")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["projectId"], SAMPLE_PROJECT_ID)
        self.assertEqual(payload["forSafetyReport"], [])

    def test_project_related_counts(self) -> None:
        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/related-counts")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["documents"], 1)

    def test_project_activity_log_created_on_update(self) -> None:
        self.client.patch(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}",
            json={"memo": "변경 이력 테스트"},
        )

        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/history")
        actions = [item["action"] for item in response.json()]

        self.assertIn("project.updated", actions)

    def test_contact_set_primary(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contacts/set-primary",
            json={"contactId": "contact-owner-002"},
        )

        self.assertEqual(response.status_code, 200)
        contacts = response.json()
        primary_contacts = [item for item in contacts if item["isPrimary"]]
        self.assertEqual(len(primary_contacts), 1)
        self.assertEqual(primary_contacts[0]["id"], "contact-owner-002")

    def test_project_parties_reorder(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/parties/reorder",
            json={
                "partyIds": [
                    "project-party-engineer-001",
                    "project-party-contractor-001",
                    "project-party-owner-001",
                    "project-party-owner-002",
                ]
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["id"], "project-party-engineer-001")
        self.assertEqual(response.json()[0]["displayOrder"], 1)

    def test_project_delete_without_related_documents_returns_deleted(self) -> None:
        created = self.client.post(
            "/api/v1/projects",
            json={"projectName": "삭제 테스트용"},
        ).json()
        project_id = created["project"]["id"]

        response = self.client.delete(f"/api/v1/projects/{project_id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["deleted"], True)
        self.assertEqual(response.json()["deletedBecause"], "no-related-documents")
