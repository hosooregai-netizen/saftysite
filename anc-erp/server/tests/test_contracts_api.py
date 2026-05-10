import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import contract_repository, project_repository
from server.app.main import app


SAMPLE_PROJECT_ID = "project-sample-001"
SAMPLE_CONTRACT_ID = "contract-sample-001"
SAMPLE_ESTIMATE_ID = "estimate-sample-001"


class ContractRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        self.client = TestClient(app)

    def test_contract_create_success(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contracts",
            json={
                "contractTitle": "신규 기술용역계약서",
                "serviceName": "신규 용역",
                "serviceScope": "점검 및 보고서 작성",
                "contractAmount": 1000000,
                "vatIncluded": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contract"]["projectId"], SAMPLE_PROJECT_ID)

    def test_contract_amount_must_be_positive(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contracts",
            json={
                "contractTitle": "금액오류",
                "serviceName": "신규 용역",
                "serviceScope": "점검",
                "contractAmount": 0,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("contractAmount", response.json()["detail"])

    def test_contract_date_range_validation(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contracts",
            json={
                "contractTitle": "기간 오류 계약",
                "serviceName": "신규 용역",
                "serviceScope": "점검",
                "contractAmount": 1000000,
                "contractStartDate": "2026-12-31",
                "contractEndDate": "2026-01-01",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("contractStartDate", response.json()["detail"])

    def test_contract_inspection_count_non_negative(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/contracts",
            json={
                "contractTitle": "회차 오류 계약",
                "serviceName": "신규 용역",
                "serviceScope": "점검",
                "contractAmount": 1000000,
                "inspectionCount": -1,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("inspectionCount", response.json()["detail"])

    def test_contract_apply_project_parties(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/parties/apply-project-parties")

        self.assertEqual(response.status_code, 200)
        roles = [item["role"] for item in response.json()]
        self.assertIn("client_1", roles)
        self.assertIn("client_2", roles)
        self.assertIn("service_provider", roles)

    def test_contract_multiple_clients_supported(self) -> None:
        response = self.client.get(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/parties")

        self.assertEqual(response.status_code, 200)
        clients = [item for item in response.json() if item["role"].startswith("client")]
        self.assertEqual(len(clients), 2)

    def test_contract_share_ratio_calculation(self) -> None:
        response = self.client.get(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}")

        self.assertEqual(response.status_code, 200)
        parties = [item for item in response.json()["parties"] if item["role"].startswith("client")]
        self.assertEqual(sum(item["shareRatio"] for item in parties), 100)
        self.assertEqual(sum(item["shareAmount"] for item in parties), 11000000)

    def test_payment_term_split_by_ratio(self) -> None:
        response = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/payment-terms/calculate-split",
            json={"amount": 4400000},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["splitItems"][0]["amount"], 2640000)
        self.assertEqual(response.json()["splitItems"][1]["amount"], 1760000)

    def test_payment_term_split_sum_matches_amount(self) -> None:
        response = self.client.get(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/payment-terms")

        self.assertEqual(response.status_code, 200)
        first_term = response.json()[0]
        self.assertEqual(sum(item["amount"] for item in first_term["splitItems"]), first_term["amount"])

    def test_contract_generate_creates_version(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/generate")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["version"]["templateKey"], "contract-draft-generation")
        detail = self.client.get(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}").json()
        self.assertGreaterEqual(len(detail["versions"]), 2)

    def test_contract_export_uses_latest_version(self) -> None:
        generated = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/generate").json()
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/export")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["latestVersionId"], generated["version"]["id"])
        self.assertEqual(response.json()["usedLatestVersion"], True)

    def test_contract_mark_signed_requires_signed_file(self) -> None:
        response = self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/mark-signed")

        self.assertEqual(response.status_code, 400)
        self.assertIn("signedFileId", response.json()["detail"])

    def test_contract_patch_signed_status_requires_signed_file(self) -> None:
        response = self.client.patch(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}",
            json={"status": "signed"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("signedFileId", response.json()["detail"])

    def test_payment_term_paid_requires_paid_date(self) -> None:
        response = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/payment-terms",
            json={
                "label": "입금완료 테스트",
                "triggerText": "입금 확인",
                "amount": 1000000,
                "status": "paid",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("paidDate", response.json()["detail"])

    def test_estimate_create_and_convert_to_contract(self) -> None:
        created = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/estimates",
            json={
                "title": "전환용 견적",
                "serviceName": "신규 용역",
                "supplyAmount": 1000000,
                "vatAmount": 100000,
                "totalAmount": 1100000,
                "items": [
                    {
                        "label": "정기점검",
                        "quantity": 1,
                        "unitPrice": 1000000,
                        "supplyAmount": 1000000,
                        "vatAmount": 100000,
                        "totalAmount": 1100000,
                    }
                ],
            },
        ).json()

        response = self.client.post(f"/api/v1/estimates/{created['estimate']['id']}/convert-to-contract")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estimate"]["status"], "converted")
        self.assertEqual(response.json()["contract"]["projectId"], SAMPLE_PROJECT_ID)

    def test_estimate_total_must_match_items(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/estimates",
            json={
                "title": "합계 오류 견적",
                "serviceName": "신규 용역",
                "supplyAmount": 1000000,
                "vatAmount": 100000,
                "totalAmount": 1200000,
                "items": [
                    {
                        "label": "정기점검",
                        "quantity": 1,
                        "unitPrice": 1000000,
                        "supplyAmount": 1000000,
                        "vatAmount": 100000,
                        "totalAmount": 1100000,
                    }
                ],
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("estimate total", response.json()["detail"])

    def test_estimate_export_requires_item(self) -> None:
        created = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/estimates",
            json={
                "title": "빈 견적",
                "serviceName": "신규 용역",
                "supplyAmount": 0,
                "vatAmount": 0,
                "totalAmount": 0,
                "items": [],
            },
        ).json()

        updated = self.client.patch(
            f"/api/v1/estimates/{created['estimate']['id']}",
            json={"status": "sent"},
        )
        self.assertEqual(updated.status_code, 400)
        self.assertIn("at least one item", updated.json()["detail"])

    def test_contract_file_saved_to_webhard_contract_folder(self) -> None:
        response = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/files/upload",
            json={"fileName": "signed-contract.pdf", "fileType": "application/pdf"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("/00_계약_견적/", response.json()["file"]["storagePath"])

    def test_set_final_contract_file(self) -> None:
        uploaded = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/files/upload",
            json={"fileName": "final-contract.pdf", "fileType": "application/pdf"},
        ).json()

        response = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/files/{uploaded['file']['id']}/set-final",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contract"]["finalFileId"], uploaded["file"]["id"])

    def test_set_signed_contract_file(self) -> None:
        uploaded = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/files/upload",
            json={"fileName": "signed-contract.pdf", "fileType": "application/pdf"},
        ).json()

        response = self.client.post(
            f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/files/{uploaded['file']['id']}/set-signed",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["contract"]["signedFileId"], uploaded["file"]["id"])

    def test_contract_status_change_creates_audit_log(self) -> None:
        self.client.post(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}/mark-sent")
        detail = self.client.get(f"/api/v1/contracts/{SAMPLE_CONTRACT_ID}").json()

        actions = [item["action"] for item in detail["auditLogs"]]
        self.assertIn("contract.sent", actions)
