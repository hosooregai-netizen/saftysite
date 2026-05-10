import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    admin_repository,
    approval_repository,
    checklist_repository,
    contract_repository,
    finding_repository,
    inspection_repository,
    mail_repository,
    project_repository,
    safety_report_repository,
)
from server.app.main import app


class AdminRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        checklist_repository.__init__(project_repository, inspection_repository)
        finding_repository.__init__(project_repository, inspection_repository, checklist_repository)
        safety_report_repository.__init__(project_repository, inspection_repository)
        mail_repository.__init__(project_repository)
        approval_repository.__init__(
            project_repository,
            inspection_repository,
            safety_report_repository,
            mail_repository,
        )
        admin_repository.__init__()
        self.client = TestClient(app)

    def test_admin_user_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/admin/users",
            json={
                "name": "운영초안관리자",
                "email": "ops-admin@anc.local",
                "roleIds": ["role-001"],
                "projectAccessPolicy": "all",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["email"], "ops-admin@anc.local")

    def test_role_permission_update_creates_audit_log(self) -> None:
        response = self.client.patch(
            "/api/v1/admin/roles/role-001/permissions",
            json={"permissionKeys": ["template.read", "template.publish"], "reason": "권한 정비"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["auditLog"]["action"], "role.permissions_updated")

    def test_company_profile_update_success(self) -> None:
        response = self.client.patch(
            "/api/v1/admin/company-profile",
            json={"companyName": "A&C 기술사 ERP 운영본", "defaultMailFooter": "운영 footer"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["companyProfile"]["companyName"], "A&C 기술사 ERP 운영본")

    def test_document_template_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/admin/document-templates",
            json={
                "templateKey": "feature13_admin_template_test",
                "name": "관리자 템플릿 테스트",
                "documentType": "safety_health_ledger_inspection_report",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["template"]["templateKey"], "feature13_admin_template_test")

    def test_template_version_extracts_variables(self) -> None:
        template = self.client.post(
            "/api/v1/admin/document-templates",
            json={
                "templateKey": "feature13_extract_vars",
                "name": "변수 추출 테스트",
                "documentType": "safety_management_plan",
            },
        ).json()
        version = self.client.post(
            f"/api/v1/admin/document-templates/{template['template']['id']}/versions",
            json={"bodyTemplate": "{{project.projectName}} / {{owner.organizationName}}"},
        ).json()

        response = self.client.post(
            f"/api/v1/admin/template-versions/{version['version']['id']}/variables/extract"
        )

        self.assertEqual(response.status_code, 200)
        variable_keys = [item["variableKey"] for item in response.json()["variables"]]
        self.assertIn("project.projectName", variable_keys)
        self.assertIn("owner.organizationName", variable_keys)

    def test_template_version_publish_requires_validation(self) -> None:
        template = self.client.post(
            "/api/v1/admin/document-templates",
            json={
                "templateKey": "feature13_publish_guard",
                "name": "발행 차단 테스트",
                "documentType": "safety_report",
            },
        ).json()
        version = self.client.post(
            f"/api/v1/admin/document-templates/{template['template']['id']}/versions",
            json={},
        ).json()

        response = self.client.post(
            f"/api/v1/admin/template-versions/{version['version']['id']}/publish",
            json={"reason": "검증 없이 발행 시도"},
        )

        self.assertEqual(response.status_code, 400)

    def test_published_template_version_cannot_be_edited(self) -> None:
        response = self.client.patch(
            "/api/v1/admin/template-versions/template-version-001",
            json={"bodyTemplate": "edited"},
        )

        self.assertEqual(response.status_code, 400)

    def test_template_preview_generates_missing_fields(self) -> None:
        template = self.client.post(
            "/api/v1/admin/document-templates",
            json={
                "templateKey": "feature13_preview_missing",
                "name": "미리보기 누락 테스트",
                "documentType": "safety_health_ledger",
            },
        ).json()
        version = self.client.post(
            f"/api/v1/admin/document-templates/{template['template']['id']}/versions",
            json={"bodyTemplate": "{{owner.contactName}}"},
        ).json()
        self.client.post(f"/api/v1/admin/template-versions/{version['version']['id']}/variables/extract")

        response = self.client.post(
            f"/api/v1/admin/template-versions/{version['version']['id']}/preview",
            json={"sampleName": "preview-check"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()["missingFields"]), 0)

    def test_checklist_template_clone_and_publish(self) -> None:
        clone = self.client.post("/api/v1/admin/checklist-templates/checklist-template-sample-001/clone")

        self.assertEqual(clone.status_code, 200)
        response = self.client.post(
            f"/api/v1/admin/checklist-templates/{clone.json()['template']['id']}/publish"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["template"]["status"], "published")

    def test_phrase_create_and_publish(self) -> None:
        create = self.client.post(
            "/api/v1/admin/phrases",
            json={
                "phraseType": "standard_phrase",
                "title": "초안 안내",
                "body": "본 문서는 초안입니다.",
                "tags": ["draft"],
            },
        )

        self.assertEqual(create.status_code, 200)
        publish = self.client.post(f"/api/v1/admin/phrases/{create.json()['phrase']['id']}/publish")
        self.assertEqual(publish.status_code, 200)
        self.assertEqual(publish.json()["phrase"]["status"], "published")

    def test_legal_clause_update_requires_permission(self) -> None:
        response = self.client.patch(
            "/api/v1/admin/legal-clauses/legal-clause-001",
            json={"body": "수정 본문", "changeReason": "검토", "hasLegalPermission": False},
        )

        self.assertEqual(response.status_code, 400)

    def test_legal_clause_publish_requires_approval(self) -> None:
        create = self.client.post(
            "/api/v1/admin/legal-clauses",
            json={
                "clauseCode": "LEGAL-NEW-001",
                "title": "새 법령 초안",
                "body": "초안",
                "changeReason": "신규 등록",
                "hasLegalPermission": True,
            },
        )

        self.assertEqual(create.status_code, 200)
        response = self.client.post(
            f"/api/v1/admin/legal-clauses/{create.json()['legalClause']['id']}/publish",
            json={"reason": "승인 없이 발행"},
        )

        self.assertEqual(response.status_code, 400)

    def test_prompt_template_create_success(self) -> None:
        response = self.client.post(
            "/api/v1/admin/prompts",
            json={
                "promptKey": "feature13_prompt_create",
                "name": "프롬프트 생성 테스트",
                "promptType": "service_ai",
                "featureId": "admin.template.prompt",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["prompt"]["promptKey"], "feature13_prompt_create")

    def test_prompt_version_requires_schema_for_service_ai(self) -> None:
        create = self.client.post(
            "/api/v1/admin/prompts",
            json={
                "promptKey": "feature13_prompt_schema_guard",
                "name": "schema guard",
                "promptType": "service_ai",
                "featureId": "admin.template.prompt",
            },
        ).json()
        version_id = create["currentVersion"]["id"]

        response = self.client.post(
            f"/api/v1/admin/prompt-versions/{version_id}/publish",
            json={"reason": "schema 없는 publish"},
        )

        self.assertEqual(response.status_code, 400)

    def test_prompt_run_logs_output(self) -> None:
        version_id = self._create_runnable_prompt_version("feature13_prompt_run")
        response = self.client.post(
            f"/api/v1/admin/prompt-versions/{version_id}/run",
            json={"inputFixture": {"projectId": "project-sample-001"}},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("draft", response.json()["runLog"]["outputText"])

    def test_prompt_test_case_execution(self) -> None:
        create = self.client.post(
            "/api/v1/admin/prompts",
            json={
                "promptKey": "feature13_prompt_testcases",
                "name": "test case execution",
                "promptType": "service_ai",
                "featureId": "admin.template.prompt",
            },
        ).json()
        version_id = create["currentVersion"]["id"]
        self.client.patch(
            f"/api/v1/admin/prompt-versions/{version_id}",
            json={
                "systemMessage": "system",
                "userMessageTemplate": "user",
                "inputSchema": {"type": "object"},
                "outputSchema": {"type": "object"},
                "guardrails": ["Do not invent facts"],
                "forbiddenBehaviors": ["invent_legal_text"],
            },
        )
        self.client.post(
            f"/api/v1/admin/prompts/{create['prompt']['id']}/test-cases",
            json={
                "name": "기본 케이스",
                "inputFixture": {"projectId": "project-sample-001"},
                "expectedContains": ["draft"],
                "expectedMissing": [],
            },
        )

        response = self.client.post(f"/api/v1/admin/prompt-versions/{version_id}/run-test-cases")

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()["results"]), 0)

    def test_prompt_publish_requires_test_case_run(self) -> None:
        create = self.client.post(
            "/api/v1/admin/prompts",
            json={
                "promptKey": "feature13_prompt_publish_guard",
                "name": "publish guard",
                "promptType": "service_ai",
                "featureId": "admin.template.prompt",
            },
        ).json()
        version_id = create["currentVersion"]["id"]
        self.client.patch(
            f"/api/v1/admin/prompt-versions/{version_id}",
            json={
                "systemMessage": "system",
                "userMessageTemplate": "user",
                "inputSchema": {"type": "object"},
                "outputSchema": {"type": "object"},
                "guardrails": ["Do not invent facts"],
                "forbiddenBehaviors": ["invent_legal_text"],
            },
        )

        response = self.client.post(
            f"/api/v1/admin/prompt-versions/{version_id}/publish",
            json={"reason": "test run 없이 publish"},
        )

        self.assertEqual(response.status_code, 400)

    def test_published_prompt_version_cannot_be_edited(self) -> None:
        response = self.client.patch(
            "/api/v1/admin/prompt-versions/prompt-version-001",
            json={"systemMessage": "edited"},
        )

        self.assertEqual(response.status_code, 400)

    def test_template_rollback_creates_audit_log(self) -> None:
        response = self.client.post(
            "/api/v1/admin/template-versions/template-version-001/rollback",
            json={"reason": "안정판 복귀"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["auditLog"]["action"], "template_version.rollback")

    def test_prompt_rollback_creates_audit_log(self) -> None:
        response = self.client.post(
            "/api/v1/admin/prompt-versions/prompt-version-001/rollback",
            json={"reason": "프롬프트 복귀"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["auditLog"]["action"], "prompt_version.rollback")

    def test_audit_log_filter_by_target_type(self) -> None:
        self.client.patch(
            "/api/v1/admin/roles/role-001/permissions",
            json={"permissionKeys": ["template.read"], "reason": "필터 테스트"},
        )

        response = self.client.get("/api/v1/admin/audit-logs?targetType=role")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(item["targetType"] == "role" for item in response.json()))

    def test_admin_checklist_template_detail_get(self) -> None:
        response = self.client.get("/api/v1/admin/checklist-templates/checklist-template-sample-001")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["template"]["id"], "checklist-template-sample-001")

    def test_admin_webhard_policy_get_and_patch(self) -> None:
        get_response = self.client.get("/api/v1/admin/webhard-policies")
        self.assertEqual(get_response.status_code, 200)

        patch_response = self.client.patch(
            "/api/v1/admin/webhard-policies",
            json={"sharedLinkExpiryDays": 14, "reason": "정책 조정"},
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["policy"]["sharedLinkExpiryDays"], 14)

    def test_admin_mail_templates_list_get_and_patch(self) -> None:
        list_response = self.client.get("/api/v1/admin/mail-templates")
        self.assertEqual(list_response.status_code, 200)
        self.assertGreater(len(list_response.json()), 0)

        detail_response = self.client.get("/api/v1/admin/mail-templates/mail-template-submission-001")
        self.assertEqual(detail_response.status_code, 200)

        patch_response = self.client.patch(
            "/api/v1/admin/mail-templates/mail-template-submission-001",
            json={"subjectTemplate": "[Admin] {{document.title}}"},
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["template"]["subjectTemplate"], "[Admin] {{document.title}}")

    def test_admin_approval_templates_list_get_and_patch(self) -> None:
        list_response = self.client.get("/api/v1/admin/approval-templates")
        self.assertEqual(list_response.status_code, 200)
        self.assertGreater(len(list_response.json()), 0)

        detail_response = self.client.get("/api/v1/admin/approval-templates/approval-template-safety-report-001")
        self.assertEqual(detail_response.status_code, 200)

        patch_response = self.client.patch(
            "/api/v1/admin/approval-templates/approval-template-safety-report-001",
            json={"name": "관리자 결재선"},
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["template"]["name"], "관리자 결재선")

    def test_admin_signature_assets_list_get_and_patch(self) -> None:
        list_response = self.client.get("/api/v1/admin/signature-assets")
        self.assertEqual(list_response.status_code, 200)
        self.assertGreater(len(list_response.json()), 0)

        detail_response = self.client.get("/api/v1/admin/signature-assets/signature-asset-sample-001")
        self.assertEqual(detail_response.status_code, 200)

        patch_response = self.client.patch(
            "/api/v1/admin/signature-assets/signature-asset-sample-001",
            json={"status": "inactive"},
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.json()["signatureAsset"]["status"], "inactive")

    def _create_runnable_prompt_version(self, prompt_key: str) -> str:
        create = self.client.post(
            "/api/v1/admin/prompts",
            json={
                "promptKey": prompt_key,
                "name": prompt_key,
                "promptType": "service_ai",
                "featureId": "admin.template.prompt",
            },
        ).json()
        version_id = create["currentVersion"]["id"]
        patch = self.client.patch(
            f"/api/v1/admin/prompt-versions/{version_id}",
            json={
                "systemMessage": "system",
                "userMessageTemplate": "user",
                "inputSchema": {"type": "object"},
                "outputSchema": {"type": "object"},
                "guardrails": ["Do not invent facts"],
                "forbiddenBehaviors": ["invent_legal_text"],
            },
        )
        self.assertEqual(patch.status_code, 200)
        self.client.post(
            f"/api/v1/admin/prompts/{create['prompt']['id']}/test-cases",
            json={
                "name": "기본 케이스",
                "inputFixture": {"projectId": "project-sample-001"},
                "expectedContains": ["draft"],
                "expectedMissing": [],
            },
        )
        return version_id
