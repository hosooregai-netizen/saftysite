import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import project_repository
from server.app.main import app


SAMPLE_PROJECT_ID = "project-sample-001"


EXTRACTION_TEXT = """
사업명: 계약서 기반 신규 현장
현장명: 계약서 기반 신규 현장
현장주소: 서울시 마포구 월드컵북로 1
공사종류: 승강기 교체공사
공사금액: 9,130,000,000원
공사기간: 2025-10-01 ~ 2028-02-29
실착공일: 2025-11-03
공정율: 3.9%
점검주기: 3개월 이내 1회
총 점검회차: 10
발주처: 삼성문화재단, 삼성생명공익재단
시공사: 현대엘리베이터(주)
엔지니어링사: A&C기술사사무소
담당자: 김문서 | 소속: 삼성문화재단 | 이메일: owner3@example.com | 전화: 010-9999-0000
"""


class ProjectExtractionTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        self.client = TestClient(app)

    def test_project_extraction_preview_does_not_apply_without_confirmation(self) -> None:
        before = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}").json()

        response = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": EXTRACTION_TEXT},
        )

        after = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}").json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(before["contacts"], after["contacts"])

    def test_project_apply_extracted_info_creates_parties_and_contacts(self) -> None:
        create_project_response = self.client.post(
            "/api/v1/projects",
            json={"projectName": "추출 반영 대상"},
        ).json()
        project_id = create_project_response["project"]["id"]

        preview = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": EXTRACTION_TEXT},
        ).json()

        response = self.client.post(
            f"/api/v1/projects/{project_id}/apply-extracted-info",
            json=preview,
        )
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(payload["projectParties"]), 3)
        self.assertGreaterEqual(len(payload["contacts"]), 1)

    def test_extract_project_from_contract(self) -> None:
        response = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": EXTRACTION_TEXT},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["project"]["projectName"], "계약서 기반 신규 현장")

    def test_extract_multiple_owners(self) -> None:
        response = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": EXTRACTION_TEXT},
        )

        owners = [item for item in response.json()["projectParties"] if item["role"] == "owner"]
        self.assertEqual(len(owners), 2)

    def test_extract_contacts(self) -> None:
        response = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": EXTRACTION_TEXT},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contacts"][0]["name"], "김문서")

    def test_missing_unknown_fields_are_null(self) -> None:
        response = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": "발주처: 삼성문화재단"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsNone(payload["project"]["projectName"])
        self.assertIsNone(payload["project"]["siteAddress"])

    def test_extraction_preview_does_not_persist(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/validate-extracted-info",
            json={
                "project": {"projectName": "preview-only"},
                "organizations": [],
                "projectParties": [],
                "contacts": [],
                "warnings": [],
            },
        )
        project_after = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}").json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(project_after["project"]["projectName"], "리움미술관 승강기 교체공사")

    def test_validate_extracted_info_warnings(self) -> None:
        preview = self.client.post(
            "/api/v1/projects/extract-from-document",
            json={"sourceText": EXTRACTION_TEXT},
        ).json()

        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/validate-extracted-info",
            json=preview,
        )

        self.assertEqual(response.status_code, 200)
        warnings = response.json()["warnings"]
        self.assertIn("ownerSeparateReportSettingUnknown", warnings)
        self.assertIn("ownerReportRecipientSettingUnknown", warnings)
        self.assertEqual(warnings.count("ownerSeparateReportSettingUnknown"), 1)
        self.assertEqual(warnings.count("ownerReportRecipientSettingUnknown"), 1)
