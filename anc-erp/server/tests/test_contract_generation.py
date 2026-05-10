import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import contract_repository, project_repository
from server.app.main import app


SAMPLE_CONTRACT_ID = "contract-sample-001"


class ContractGenerationTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        self.client = TestClient(app)

    def test_contract_generate_draft(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/generate")

        self.assertEqual(response.status_code, 200)
        self.assertIn("계약서 초안", response.json()["version"]["draftText"])

    def test_contract_multiple_clients_prompt_output(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/preview")

        self.assertEqual(response.status_code, 200)
        self.assertIn("삼성문화재단", response.json()["draftText"])
        self.assertIn("삼성생명공익재단", response.json()["draftText"])

    def test_contract_payment_split_prompt_output(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/preview")

        self.assertEqual(response.status_code, 200)
        self.assertIn("지급조건", response.json()["draftText"])
        self.assertIn("1차기성", response.json()["draftText"])

    def test_contract_missing_fields_are_separated(self) -> None:
        created = self.client.post(
            "/api/v1/projects/project-sample-001/contracts",
            json={
                "contractTitle": "누락 필드 테스트",
                "serviceName": "누락 필드 용역",
                "serviceScope": "",
                "contractAmount": 1000000,
                "vatIncluded": True,
            },
        ).json()

        preview = self.client.post(f"/api/v1/contracts/{created['contract']['id']}/preview")

        self.assertEqual(preview.status_code, 200)
        self.assertIn("serviceScope", preview.json()["missingFields"])
        self.assertIn("inspectionCount", preview.json()["missingFields"])

    def test_contract_does_not_invent_legal_terms(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/preview")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("민법", response.json()["draftText"])
        self.assertIn("법률문구", response.json()["draftText"])
