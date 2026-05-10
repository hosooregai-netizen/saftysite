import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    checklist_repository,
    contract_repository,
    inspection_repository,
    project_repository,
    safety_management_plan_repository,
)
from server.app.main import app


class SafetyManagementPlanRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        safety_management_plan_repository.__init__(project_repository)
        self.client = TestClient(app)

    def test_safety_management_plan_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-management-plans",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-management-plan-v1",
                "inspectionRoundId": "round-sample-002",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["plan"]["inspectionRoundId"], "round-sample-002")

    def test_safety_management_plan_requires_project_and_template(self) -> None:
        response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-management-plans",
            json={"projectId": "project-sample-001"},
        )

        self.assertEqual(response.status_code, 422)

    def test_safety_management_plan_prevents_duplicate_active_without_revision(self) -> None:
        response = self.client.post(
            "/api/v1/projects/project-sample-001/safety-management-plans",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-management-plan-v1",
                "inspectionRoundId": "round-sample-001",
                "contractId": "contract-sample-001",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("duplicate", response.json()["detail"])

    def test_safety_management_plan_loads_project_snapshot(self) -> None:
        response = self.client.get("/api/v1/safety-management-plans/safety-management-plan-sample-001")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["snapshot"]["projectSnapshot"]["projectName"], "리움미술관 승강기 교체공사")

    def test_safety_management_plan_work_type_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/work-types",
            json={"name": "가설전기 작업", "description": "가설전기 분전반 및 전선 관리"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["workType"]["name"], "가설전기 작업")

    def test_safety_management_plan_risk_item_requires_hazard_and_measure(self) -> None:
        response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/risks",
            json={"hazard": "", "reductionMeasure": ""},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("hazard", response.json()["detail"])

    def test_safety_management_plan_generate_risks_from_work_types(self) -> None:
        self.client.post(
            "/api/v1/projects/project-sample-001/safety-management-plans",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-management-plan-v1",
                "inspectionRoundId": "round-sample-002",
            },
        )
        list_response = self.client.get("/api/v1/projects/project-sample-001/safety-management-plans")
        plan_id = list_response.json()[-1]["plan"]["id"]
        self.client.post(
            f"/api/v1/safety-management-plans/{plan_id}/work-types",
            json={"name": "신규 설치 작업", "description": "장비 반입 및 양중"},
        )
        response = self.client.post(f"/api/v1/safety-management-plans/{plan_id}/risks/generate-from-work-types")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["createdCount"], 1)

    def test_safety_management_plan_import_risks_from_checklist(self) -> None:
        response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/risks/import-from-checklist"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["createdCount"], 1)

    def test_safety_management_plan_missing_required_fields(self) -> None:
        create = self.client.post(
            "/api/v1/projects/project-sample-001/safety-management-plans",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-management-plan-v1",
                "inspectionRoundId": "round-sample-002",
            },
        )
        plan_id = create.json()["plan"]["id"]
        response = self.client.post(f"/api/v1/safety-management-plans/{plan_id}/validate")

        self.assertEqual(response.status_code, 200)
        fields = [item["field"] for item in response.json()["missingFields"]]
        self.assertIn("workTypes", fields)
        self.assertIn("riskItems", fields)

    def test_safety_management_plan_section_regenerate_ai_draft(self) -> None:
        response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/sections/cover/regenerate"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["snapshot"]["sections"][0]["status"], "ai_draft")

    def test_safety_management_plan_confirm_success(self) -> None:
        response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/confirm",
            json={"confirmedBy": "user-reviewer-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["plan"]["status"], "confirmed")

    def test_safety_management_plan_export_blocked_when_required_missing(self) -> None:
        create = self.client.post(
            "/api/v1/projects/project-sample-001/safety-management-plans",
            json={
                "projectId": "project-sample-001",
                "templateId": "template-safety-management-plan-v1",
                "inspectionRoundId": "round-sample-002",
            },
        )
        plan_id = create.json()["plan"]["id"]
        response = self.client.post(f"/api/v1/safety-management-plans/{plan_id}/export", json={})

        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.json()["detail"])

    def test_safety_management_plan_export_uses_latest_saved_snapshot(self) -> None:
        save = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/save-section",
            json={"sectionKey": "cover", "content": {"summary": "최신 저장본"}, "status": "edited"},
        )
        export = self.client.post("/api/v1/safety-management-plans/safety-management-plan-sample-001/export", json={})

        self.assertEqual(save.status_code, 200)
        self.assertEqual(export.status_code, 200)
        self.assertEqual(export.json()["version"]["versionNo"], 2)

    def test_safety_management_plan_export_creates_file_asset(self) -> None:
        response = self.client.post("/api/v1/safety-management-plans/safety-management-plan-sample-001/export", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["fileAsset"]["linkedEntityId"], "safety-management-plan-sample-001")

    def test_safety_management_plan_refresh_linked_data_sets_stale(self) -> None:
        self.client.patch(
            "/api/v1/projects/project-sample-001",
            json={"projectName": "리움미술관 승강기 교체공사 개정"},
        )
        response = self.client.post("/api/v1/safety-management-plans/safety-management-plan-sample-001/refresh-linked-data")

        self.assertEqual(response.status_code, 200)
        warning_types = [item["type"] for item in response.json()["warnings"]]
        self.assertIn("stale_linked_data", warning_types)

    def test_safety_management_plan_version_created_on_save(self) -> None:
        response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/save-section",
            json={"sectionKey": "project_overview", "content": {"summary": "저장"}, "status": "edited"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["version"]["versionNo"], 2)

    def test_safety_management_plan_organization_get_and_patch(self) -> None:
        get_response = self.client.get("/api/v1/safety-management-plans/safety-management-plan-sample-001/organization")
        patch_response = self.client.patch(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/organization",
            json={
                "responsibilities": [
                    {
                        "role": "현장 책임",
                        "name": "홍길동",
                        "responsibility": "현장 안전점검 총괄",
                    }
                ]
            },
        )

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["responsibilities"][0]["role"], "현장 책임")

    def test_safety_management_plan_education_get_and_patch(self) -> None:
        get_response = self.client.get("/api/v1/safety-management-plans/safety-management-plan-sample-001/education")
        patch_response = self.client.patch(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/education",
            json={
                "items": [
                    {
                        "educationType": "신규채용",
                        "target": "신규 투입자",
                        "cycle": "투입 전",
                        "content": "현장 위험요인 교육",
                        "recordMethod": "서명부",
                    }
                ]
            },
        )

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["items"][0]["educationType"], "신규채용")

    def test_safety_management_plan_emergency_get_and_patch(self) -> None:
        get_response = self.client.get("/api/v1/safety-management-plans/safety-management-plan-sample-001/emergency")
        patch_response = self.client.patch(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/emergency",
            json={
                "contacts": [
                    {
                        "type": "구급",
                        "organization": "현장대응팀",
                        "note": "119 연계",
                    }
                ]
            },
        )

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["contacts"][0]["type"], "구급")

    def test_safety_management_plan_attachment_list_link_and_delete(self) -> None:
        list_response = self.client.get("/api/v1/safety-management-plans/safety-management-plan-sample-001/attachments")
        link_response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/attachments/link",
            json={
                "fileId": "file-asset-smp-new-001",
                "fileName": "organization_chart.pdf",
                "storagePath": "/project/08_plan/organization_chart.pdf",
                "attachmentType": "organization",
                "sourceLabel": "조직도",
            },
        )
        attachment_id = link_response.json()["attachment"]["id"]
        delete_response = self.client.delete(f"/api/v1/safety-management-plan-attachments/{attachment_id}")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(link_response.status_code, 200)
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.json()["deleted"])

    def test_safety_management_plan_work_type_patch_and_delete(self) -> None:
        create_response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/work-types",
            json={"name": "가설 작업", "description": "가설 구조물 설치"},
        )
        work_type_id = create_response.json()["workType"]["id"]
        patch_response = self.client.patch(
            f"/api/v1/safety-management-work-types/{work_type_id}",
            json={"description": "가설 구조물 설치 및 해체"},
        )
        delete_response = self.client.delete(f"/api/v1/safety-management-work-types/{work_type_id}")

        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["workType"]["description"], "가설 구조물 설치 및 해체")
        self.assertEqual(delete_response.status_code, 200)

    def test_safety_management_plan_risk_patch_and_delete(self) -> None:
        create_response = self.client.post(
            "/api/v1/safety-management-plans/safety-management-plan-sample-001/risks",
            json={"hazard": "낙하 위험", "reductionMeasure": "방호망 설치"},
        )
        risk_item_id = create_response.json()["riskItem"]["id"]
        patch_response = self.client.patch(
            f"/api/v1/safety-management-risks/{risk_item_id}",
            json={"riskLevel": "high"},
        )
        delete_response = self.client.delete(f"/api/v1/safety-management-risks/{risk_item_id}")

        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["riskItem"]["riskLevel"], "high")
        self.assertEqual(delete_response.status_code, 200)
