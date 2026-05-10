from dataclasses import asdict
import json
import re
from uuid import uuid4

from server.app.domain.models import (
    AdminAuditLog,
    AdminUser,
    CompanyProfile,
    DocumentTemplate,
    FileAsset,
    LegalClause,
    MissingField,
    Phrase,
    PromptRunLog,
    PromptTemplate,
    PromptTestCase,
    PromptVersion,
    Role,
    TemplateCondition,
    TemplateLoop,
    TemplatePreviewRun,
    TemplateSection,
    TemplateVariable,
    TemplateVersion,
    WebhardPolicy,
)
from server.app.repositories.admin_repository import AdminRepository
from server.app.services.approval_service import ApprovalService
from server.app.services.checklist_service import ChecklistService
from server.app.services.mail_service import MailboxService


class AdminNotFoundError(Exception):
    pass


class AdminValidationError(Exception):
    pass


class AdminService:
    VARIABLE_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_.]+)\s*}}")
    LOOP_PATTERN = re.compile(r"{{#each\s+([a-zA-Z0-9_.]+)(?:\s+as\s+([a-zA-Z0-9_]+))?\s*}}")
    CONDITION_PATTERN = re.compile(r"{{#if\s+([a-zA-Z0-9_.]+)\s*}}")

    def __init__(
        self,
        repository: AdminRepository,
        checklist_service: ChecklistService,
        approval_service: ApprovalService,
        mail_service: MailboxService,
    ) -> None:
        self.repository = repository
        self.checklist_service = checklist_service
        self.approval_service = approval_service
        self.mail_service = mail_service

    def _now(self) -> str:
        return "2026-05-10T15:00:00+09:00"

    def get_dashboard_summary(self) -> dict:
        templates = self.repository.list_document_templates()
        prompt_templates = self.repository.list_prompt_templates()
        audit_logs = self.repository.list_audit_logs()
        legal_changes = [item for item in audit_logs if item.targetType == "legal_clause"][:5]
        warnings = []
        failed_prompt_tests = 0
        for prompt in prompt_templates:
            current = self.repository.get_prompt_version(prompt.currentVersionId) if prompt.currentVersionId else None
            if current and current.lastTestRunAt is None:
                failed_prompt_tests += 1
                warnings.append(
                    {
                        "code": "prompt_test_missing",
                        "message": f"{prompt.name} 테스트 이력이 없습니다.",
                        "severity": "warning",
                    }
                )
        return {
            "counts": {
                "users": len(self.repository.list_users()),
                "activeTemplates": len([item for item in templates if item.status == "published"]),
                "reviewTemplates": len([item for item in templates if item.status == "review"]),
                "publishedPrompts": len([item for item in prompt_templates if item.status == "published"]),
                "failedPromptTests": failed_prompt_tests,
            },
            "recentLegalChanges": [asdict(item) for item in legal_changes],
            "recentAuditLogs": [asdict(item) for item in audit_logs[:8]],
            "warnings": warnings,
        }

    def list_users(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_users()]

    def create_user(self, payload: dict) -> dict:
        user = AdminUser(
            id=f"admin-user-{uuid4().hex[:8]}",
            name=payload["name"],
            email=payload["email"],
            phone=payload.get("phone"),
            department=payload.get("department"),
            position=payload.get("position"),
            status=payload.get("status", "active"),
            roleIds=payload.get("roleIds", []),
            projectAccessPolicy=payload.get("projectAccessPolicy", "assigned_only"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"user": asdict(self.repository.save_user(user))}

    def get_user(self, user_id: str) -> dict:
        return {"user": asdict(self._require_user(user_id))}

    def update_user(self, user_id: str, payload: dict) -> dict:
        user = self._require_user(user_id)
        for key, value in payload.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        user.updatedAt = self._now()
        return {"user": asdict(self.repository.save_user(user))}

    def delete_user(self, user_id: str) -> dict:
        self._require_user(user_id)
        self.repository.delete_user(user_id)
        return {"deleted": True, "userId": user_id}

    def list_roles(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_roles()]

    def create_role(self, payload: dict) -> dict:
        if any(item.key == payload["key"] for item in self.repository.list_roles()):
            raise AdminValidationError("role key must be unique")
        role = Role(
            id=f"role-{uuid4().hex[:8]}",
            key=payload["key"],
            name=payload["name"],
            description=payload.get("description"),
            permissionKeys=payload.get("permissionKeys", []),
            systemRole=payload.get("systemRole", False),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"role": asdict(self.repository.save_role(role))}

    def update_role(self, role_id: str, payload: dict) -> dict:
        role = self._require_role(role_id)
        for key, value in payload.items():
            if hasattr(role, key) and value is not None:
                setattr(role, key, value)
        role.updatedAt = self._now()
        return {"role": asdict(self.repository.save_role(role))}

    def delete_role(self, role_id: str) -> dict:
        self._require_role(role_id)
        self.repository.delete_role(role_id)
        return {"deleted": True, "roleId": role_id}

    def list_permissions(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_permissions()]

    def update_role_permissions(self, role_id: str, payload: dict) -> dict:
        role = self._require_role(role_id)
        role.permissionKeys = payload["permissionKeys"]
        role.updatedAt = self._now()
        stored = self.repository.save_role(role)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-admin-001"),
            action="role.permissions_updated",
            target_type="role",
            target_id=stored.id,
            target_name=stored.name,
            reason=payload.get("reason", "권한 변경"),
            changed_fields=["permissionKeys"],
        )
        return {"role": asdict(stored), "auditLog": asdict(audit_log)}

    def get_company_profile(self) -> dict:
        return {"companyProfile": asdict(self._require_company_profile())}

    def update_company_profile(self, payload: dict) -> dict:
        profile = self._require_company_profile()
        for key, value in payload.items():
            if hasattr(profile, key) and value is not None and key not in {"reason", "actedBy"}:
                setattr(profile, key, value)
        profile.updatedAt = self._now()
        stored = self.repository.save_company_profile(profile)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-admin-001"),
            action="company_profile.updated",
            target_type="company_profile",
            target_id=stored.id,
            target_name=stored.companyName,
            reason=payload.get("reason", "회사정보 수정"),
            changed_fields=["companyProfile"],
        )
        return {"companyProfile": asdict(stored), "auditLog": asdict(audit_log)}

    def upload_company_logo(self, payload: dict) -> dict:
        profile = self._require_company_profile()
        file_asset = self._create_admin_file_asset(payload["fileName"], payload.get("fileType", "image/png"), "company_logo")
        profile.logoFileId = file_asset.id
        profile.updatedAt = self._now()
        self.repository.save_company_profile(profile)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-admin-001"),
            action="company_profile.logo_uploaded",
            target_type="company_profile",
            target_id=profile.id,
            target_name=profile.companyName,
            reason=payload.get("reason", "회사 로고 업로드"),
            changed_fields=["logoFileId"],
        )
        return {"companyProfile": asdict(profile), "fileAsset": asdict(file_asset), "auditLog": asdict(audit_log)}

    def upload_company_seal(self, payload: dict) -> dict:
        profile = self._require_company_profile()
        file_asset = self._create_admin_file_asset(payload["fileName"], payload.get("fileType", "image/png"), "company_seal")
        profile.sealFileId = file_asset.id
        profile.updatedAt = self._now()
        self.repository.save_company_profile(profile)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-admin-001"),
            action="company_profile.seal_uploaded",
            target_type="company_profile",
            target_id=profile.id,
            target_name=profile.companyName,
            reason=payload.get("reason", "회사 직인 업로드"),
            changed_fields=["sealFileId"],
        )
        return {"companyProfile": asdict(profile), "fileAsset": asdict(file_asset), "auditLog": asdict(audit_log)}

    def list_document_templates(self) -> list[dict]:
        rows = []
        for template in self.repository.list_document_templates():
            current = self.repository.get_template_version(template.currentVersionId) if template.currentVersionId else None
            rows.append(
                {
                    "template": asdict(template),
                    "currentVersion": asdict(current) if current else None,
                    "sectionCount": len(self.repository.list_template_sections(current.id)) if current else 0,
                    "variableCount": len(self.repository.list_template_variables(current.id)) if current else 0,
                }
            )
        return rows

    def create_document_template(self, payload: dict) -> dict:
        if self.repository.get_document_template_by_key(payload["templateKey"]):
            raise AdminValidationError("templateKey must be unique")
        template = DocumentTemplate(
            id=f"document-template-{uuid4().hex[:8]}",
            templateKey=payload["templateKey"],
            name=payload["name"],
            documentType=payload["documentType"],
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_document_template(template)
        version = TemplateVersion(
            id=f"template-version-{uuid4().hex[:8]}",
            templateId=stored.id,
            versionNo=1,
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored.currentVersionId = version.id
        self.repository.save_document_template(stored)
        self.repository.save_template_version(version)
        self.repository.save_template_sections(version.id, [])
        self.repository.save_template_variables(version.id, [])
        self.repository.save_template_loops(version.id, [])
        self.repository.save_template_conditions(version.id, [])
        return self.get_document_template(stored.id)

    def get_document_template(self, template_id: str) -> dict:
        template = self._require_document_template(template_id)
        versions = self.repository.list_template_versions(template_id)
        current = self.repository.get_template_version(template.currentVersionId) if template.currentVersionId else None
        current_version_id = current.id if current else versions[0].id if versions else None
        return {
            "template": asdict(template),
            "currentVersion": asdict(current) if current else None,
            "versions": [asdict(item) for item in versions],
            "sections": [asdict(item) for item in self.repository.list_template_sections(current_version_id)] if current_version_id else [],
            "variables": [asdict(item) for item in self.repository.list_template_variables(current_version_id)] if current_version_id else [],
            "loops": [asdict(item) for item in self.repository.list_template_loops(current_version_id)] if current_version_id else [],
            "conditions": [asdict(item) for item in self.repository.list_template_conditions(current_version_id)] if current_version_id else [],
        }

    def update_document_template(self, template_id: str, payload: dict) -> dict:
        template = self._require_document_template(template_id)
        for key, value in payload.items():
            if hasattr(template, key) and value is not None:
                setattr(template, key, value)
        template.updatedAt = self._now()
        self.repository.save_document_template(template)
        return self.get_document_template(template_id)

    def delete_document_template(self, template_id: str) -> dict:
        self._require_document_template(template_id)
        self.repository.delete_document_template(template_id)
        return {"deleted": True, "templateId": template_id}

    def list_template_versions(self, template_id: str) -> list[dict]:
        self._require_document_template(template_id)
        return [asdict(item) for item in self.repository.list_template_versions(template_id)]

    def create_template_version(self, template_id: str, payload: dict) -> dict:
        template = self._require_document_template(template_id)
        latest = self.repository.list_template_versions(template_id)
        version_no = (latest[0].versionNo if latest else 0) + 1
        base = self.repository.get_template_version(template.currentVersionId) if template.currentVersionId else None
        version = TemplateVersion(
            id=f"template-version-{uuid4().hex[:8]}",
            templateId=template_id,
            versionNo=version_no,
            status="draft",
            bodyTemplate=payload.get("bodyTemplate") or (base.bodyTemplate if base else ""),
            changeSummary=payload.get("changeSummary"),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.save_template_version(version)
        self.repository.save_template_sections(
            version.id,
            [
                TemplateSection(
                    id=f"template-section-{uuid4().hex[:8]}",
                    versionId=version.id,
                    key=item.key,
                    title=item.title,
                    body=item.body,
                    displayOrder=item.displayOrder,
                )
                for item in (self.repository.list_template_sections(base.id) if base else [])
            ],
        )
        self.repository.save_template_variables(
            version.id,
            [
                TemplateVariable(
                    id=f"template-variable-{uuid4().hex[:8]}",
                    versionId=version.id,
                    variableKey=item.variableKey,
                    label=item.label,
                    dataPath=item.dataPath,
                    sourceModel=item.sourceModel,
                    dataType=item.dataType,
                    required=item.required,
                    ownerSpecific=item.ownerSpecific,
                    exampleValue=item.exampleValue,
                    usedSectionKeys=item.usedSectionKeys,
                )
                for item in (self.repository.list_template_variables(base.id) if base else [])
            ],
        )
        self.repository.save_template_loops(version.id, list(self.repository.list_template_loops(base.id)) if base else [])
        self.repository.save_template_conditions(version.id, list(self.repository.list_template_conditions(base.id)) if base else [])
        template.currentVersionId = version.id
        template.updatedAt = self._now()
        self.repository.save_document_template(template)
        return {"version": asdict(version)}

    def get_template_version(self, version_id: str) -> dict:
        version = self._require_template_version(version_id)
        return {
            "version": asdict(version),
            "sections": [asdict(item) for item in self.repository.list_template_sections(version_id)],
            "variables": [asdict(item) for item in self.repository.list_template_variables(version_id)],
            "loops": [asdict(item) for item in self.repository.list_template_loops(version_id)],
            "conditions": [asdict(item) for item in self.repository.list_template_conditions(version_id)],
            "previewRuns": [asdict(item) for item in self.repository.list_template_preview_runs(version_id)],
        }

    def update_template_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published template version cannot be edited")
        for key, value in payload.items():
            if hasattr(version, key) and value is not None:
                setattr(version, key, value)
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        return self.get_template_version(version_id)

    def review_template_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        version.status = "review"
        version.reviewNote = payload.get("reason")
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        return {"version": asdict(version)}

    def publish_template_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        template = self._require_document_template(version.templateId)
        validation = self.validate_template_version(version_id)
        preview = self.preview_template_version(version_id, {"sampleData": self._default_template_sample_data(), "sampleName": "publish-check"})
        missing_required = [item for item in preview["missingFields"] if item["severity"] == "danger"]
        if validation["errors"] or missing_required:
            raise AdminValidationError("template version publish requires validation and preview without required missing variables")
        version.status = "published"
        version.validationPassed = True
        version.previewPassed = True
        version.missingRequiredVariables = []
        version.publishedAt = self._now()
        version.publishedBy = payload.get("actedBy", "user-template-manager-001")
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        template.status = "published"
        template.currentVersionId = version.id
        template.publishedVersionId = version.id
        template.updatedAt = self._now()
        self.repository.save_document_template(template)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-template-manager-001"),
            action="template_version.published",
            target_type="template_version",
            target_id=version.id,
            target_name=template.name,
            reason=payload.get("reason", "템플릿 발행"),
            changed_fields=["status", "publishedAt", "publishedVersionId"],
        )
        return {"version": asdict(version), "template": asdict(template), "auditLog": asdict(audit_log)}

    def deprecate_template_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        version.status = "deprecated"
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-template-manager-001"),
            action="template_version.deprecated",
            target_type="template_version",
            target_id=version.id,
            target_name=version.id,
            reason=payload.get("reason", "템플릿 보관"),
            changed_fields=["status"],
        )
        return {"version": asdict(version), "auditLog": asdict(audit_log)}

    def rollback_template_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        template = self._require_document_template(version.templateId)
        target_version_id = payload.get("targetVersionId") or version.id
        target = self._require_template_version(target_version_id)
        template.currentVersionId = target.id
        template.publishedVersionId = target.id
        template.status = "published"
        template.updatedAt = self._now()
        target.status = "published"
        target.updatedAt = self._now()
        self.repository.save_template_version(target)
        self.repository.save_document_template(template)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-template-manager-001"),
            action="template_version.rollback",
            target_type="template_version",
            target_id=target.id,
            target_name=template.name,
            reason=payload.get("reason", "템플릿 롤백"),
            changed_fields=["publishedVersionId"],
        )
        return {"template": asdict(template), "version": asdict(target), "auditLog": asdict(audit_log)}

    def list_template_sections(self, version_id: str) -> list[dict]:
        self._require_template_version(version_id)
        return [asdict(item) for item in self.repository.list_template_sections(version_id)]

    def create_template_section(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published template version cannot be edited")
        sections = self.repository.list_template_sections(version_id)
        section = TemplateSection(
            id=f"template-section-{uuid4().hex[:8]}",
            versionId=version_id,
            key=payload["key"],
            title=payload["title"],
            body=payload.get("body", ""),
            displayOrder=payload.get("displayOrder", len(sections) + 1),
        )
        sections.append(section)
        self.repository.save_template_sections(version_id, sections)
        return {"section": asdict(section), "sections": [asdict(item) for item in sections]}

    def update_template_section(self, section_id: str, payload: dict) -> dict:
        version_id, sections, target = self._locate_template_section(section_id)
        version = self._require_template_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published template version cannot be edited")
        for item in sections:
            if item.id == section_id:
                for key, value in payload.items():
                    if hasattr(item, key) and value is not None:
                        setattr(item, key, value)
                target = item
                break
        self.repository.save_template_sections(version_id, sections)
        return {"section": asdict(target)}

    def delete_template_section(self, section_id: str) -> dict:
        version_id, sections, _ = self._locate_template_section(section_id)
        version = self._require_template_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published template version cannot be edited")
        sections = [item for item in sections if item.id != section_id]
        self.repository.save_template_sections(version_id, sections)
        return {"deleted": True, "sectionId": section_id}

    def list_template_variables(self, version_id: str) -> list[dict]:
        self._require_template_version(version_id)
        return [asdict(item) for item in self.repository.list_template_variables(version_id)]

    def extract_template_variables(self, version_id: str) -> dict:
        version = self._require_template_version(version_id)
        source_blocks = [version.bodyTemplate] + [item.body for item in self.repository.list_template_sections(version_id)]
        sections = self.repository.list_template_sections(version_id)
        variables: list[TemplateVariable] = []
        loops: list[TemplateLoop] = []
        conditions: list[TemplateCondition] = []

        for block_index, body in enumerate(source_blocks):
            section_key = sections[block_index - 1].key if block_index > 0 and block_index - 1 < len(sections) else "root"
            for match in self.LOOP_PATTERN.finditer(body):
                data_path = match.group(1)
                alias = match.group(2) or "item"
                existing = next((item for item in loops if item.loopKey == data_path), None)
                if existing:
                    if section_key not in existing.usedSectionKeys:
                        existing.usedSectionKeys.append(section_key)
                else:
                    loops.append(
                        TemplateLoop(
                            id=f"template-loop-{uuid4().hex[:8]}",
                            versionId=version_id,
                            loopKey=data_path,
                            dataPath=data_path,
                            alias=alias,
                            usedSectionKeys=[section_key],
                        )
                    )
            for match in self.CONDITION_PATTERN.finditer(body):
                expression = match.group(1)
                existing = next((item for item in conditions if item.conditionKey == expression), None)
                if existing:
                    if section_key not in existing.usedSectionKeys:
                        existing.usedSectionKeys.append(section_key)
                else:
                    conditions.append(
                        TemplateCondition(
                            id=f"template-condition-{uuid4().hex[:8]}",
                            versionId=version_id,
                            conditionKey=expression,
                            expression=expression,
                            usedSectionKeys=[section_key],
                        )
                    )
            for match in self.VARIABLE_PATTERN.finditer(body):
                variable_key = match.group(1)
                if variable_key.startswith("#"):
                    continue
                existing = next((item for item in variables if item.variableKey == variable_key), None)
                if existing:
                    if section_key not in existing.usedSectionKeys:
                        existing.usedSectionKeys.append(section_key)
                else:
                    variables.append(
                        TemplateVariable(
                            id=f"template-variable-{uuid4().hex[:8]}",
                            versionId=version_id,
                            variableKey=variable_key,
                            label=variable_key.split(".")[-1],
                            dataPath=variable_key,
                            sourceModel=variable_key.split(".")[0].title(),
                            dataType="string",
                            required=True,
                            ownerSpecific=variable_key.startswith("owner."),
                            usedSectionKeys=[section_key],
                        )
                    )
        self.repository.save_template_variables(version_id, variables)
        self.repository.save_template_loops(version_id, loops)
        self.repository.save_template_conditions(version_id, conditions)
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        return {
            "variables": [asdict(item) for item in variables],
            "loops": [asdict(item) for item in loops],
            "conditions": [asdict(item) for item in conditions],
        }

    def update_template_variable(self, variable_id: str, payload: dict) -> dict:
        version_id, variables, target = self._locate_template_variable(variable_id)
        version = self._require_template_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published template version cannot be edited")
        for item in variables:
            if item.id == variable_id:
                for key, value in payload.items():
                    if hasattr(item, key) and value is not None:
                        setattr(item, key, value)
                target = item
                break
        self.repository.save_template_variables(version_id, variables)
        return {"variable": asdict(target)}

    def delete_template_variable(self, variable_id: str) -> dict:
        version_id, variables, _ = self._locate_template_variable(variable_id)
        version = self._require_template_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published template version cannot be edited")
        variables = [item for item in variables if item.id != variable_id]
        self.repository.save_template_variables(version_id, variables)
        return {"deleted": True, "variableId": variable_id}

    def preview_template_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_template_version(version_id)
        sample_data = payload.get("sampleData") or self._default_template_sample_data()
        missing_fields = self._find_missing_fields(version_id, sample_data)
        preview_text = version.bodyTemplate
        for variable in self.repository.list_template_variables(version_id):
            value = self._resolve_data_path(sample_data, variable.dataPath)
            preview_text = preview_text.replace(f"{{{{{variable.variableKey}}}}}", str(value if value is not None else f"[{variable.variableKey}]"))
        preview_run = TemplatePreviewRun(
            id=f"template-preview-{uuid4().hex[:8]}",
            versionId=version_id,
            previewText=preview_text,
            missingFields=missing_fields,
            sampleName=payload.get("sampleName"),
            createdAt=self._now(),
        )
        self.repository.add_template_preview_run(preview_run)
        version.previewPassed = not any(item.severity == "danger" for item in missing_fields)
        version.missingRequiredVariables = [item.field for item in missing_fields if item.severity == "danger"]
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        return {
            "previewRun": asdict(preview_run),
            "missingFields": [asdict(item) for item in missing_fields],
            "previewText": preview_text,
        }

    def validate_template_version(self, version_id: str) -> dict:
        version = self._require_template_version(version_id)
        errors = []
        warnings = []
        if not version.bodyTemplate and not self.repository.list_template_sections(version_id):
            errors.append({"code": "template_body_missing", "message": "템플릿 본문 또는 섹션이 필요합니다."})
        if not self.repository.list_template_variables(version_id):
            warnings.append({"code": "template_variables_missing", "message": "변수 추출이 아직 수행되지 않았습니다."})
        if any(not item.dataPath for item in self.repository.list_template_variables(version_id)):
            errors.append({"code": "template_variable_path_missing", "message": "dataPath가 비어 있는 변수가 있습니다."})
        version.validationPassed = len(errors) == 0
        version.updatedAt = self._now()
        self.repository.save_template_version(version)
        return {"version": asdict(version), "errors": errors, "warnings": warnings}

    def get_template_impact(self, version_id: str) -> dict:
        version = self._require_template_version(version_id)
        template = self._require_document_template(version.templateId)
        related_prompts = [
            item.promptKey
            for item in self.repository.list_prompt_templates()
            if template.documentType in item.name.lower() or item.featureId.startswith("document.")
        ]
        return {
            "templateId": template.id,
            "versionId": version.id,
            "documentType": template.documentType,
            "templateKey": template.templateKey,
            "relatedPromptKeys": related_prompts[:5],
            "affectedDraftCount": 0,
            "ownerSpecificVariables": [
                item.variableKey for item in self.repository.list_template_variables(version_id) if item.ownerSpecific
            ],
        }

    def list_checklist_templates(self) -> list[dict]:
        return self.checklist_service.list_templates()

    def create_checklist_template(self, payload: dict) -> dict:
        return self.checklist_service.create_template(payload)

    def get_checklist_template(self, template_id: str) -> dict:
        return self.checklist_service.get_template(template_id)

    def update_checklist_template(self, template_id: str, payload: dict) -> dict:
        return self.checklist_service.update_template(template_id, payload)

    def clone_checklist_template(self, template_id: str) -> dict:
        return self.checklist_service.clone_template(template_id)

    def publish_checklist_template(self, template_id: str) -> dict:
        return self.checklist_service.publish_template(template_id)

    def list_checklist_items(self, template_id: str) -> list[dict]:
        return self.checklist_service.list_template_items(template_id)

    def create_checklist_item(self, template_id: str, payload: dict) -> dict:
        return self.checklist_service.create_template_item(template_id, payload)

    def update_checklist_item(self, item_id: str, payload: dict) -> dict:
        return self.checklist_service.update_template_item(item_id, payload)

    def reorder_checklist_items(self, template_id: str, payload: dict) -> list[dict]:
        return self.checklist_service.reorder_template_items(template_id, payload["itemIds"])

    def list_phrases(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_phrases()]

    def create_phrase(self, payload: dict) -> dict:
        phrase = Phrase(
            id=f"phrase-{uuid4().hex[:8]}",
            phraseType=payload["phraseType"],
            title=payload["title"],
            body=payload["body"],
            tags=payload.get("tags", []),
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"phrase": asdict(self.repository.save_phrase(phrase))}

    def update_phrase(self, phrase_id: str, payload: dict) -> dict:
        phrase = self._require_phrase(phrase_id)
        for key, value in payload.items():
            if hasattr(phrase, key) and value is not None:
                setattr(phrase, key, value)
        phrase.updatedAt = self._now()
        return {"phrase": asdict(self.repository.save_phrase(phrase))}

    def publish_phrase(self, phrase_id: str) -> dict:
        phrase = self._require_phrase(phrase_id)
        phrase.status = "published"
        phrase.publishedAt = self._now()
        phrase.updatedAt = self._now()
        return {"phrase": asdict(self.repository.save_phrase(phrase))}

    def list_legal_clauses(self) -> list[dict]:
        return [asdict(item) for item in self.repository.list_legal_clauses()]

    def create_legal_clause(self, payload: dict) -> dict:
        self._ensure_legal_permission(payload)
        clause = LegalClause(
            id=f"legal-clause-{uuid4().hex[:8]}",
            clauseCode=payload["clauseCode"],
            title=payload["title"],
            body=payload["body"],
            status="draft",
            changeReason=payload["changeReason"],
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return {"legalClause": asdict(self.repository.save_legal_clause(clause))}

    def update_legal_clause(self, clause_id: str, payload: dict) -> dict:
        self._ensure_legal_permission(payload)
        clause = self._require_legal_clause(clause_id)
        if not payload.get("changeReason"):
            raise AdminValidationError("legal clause update requires changeReason")
        for key, value in payload.items():
            if hasattr(clause, key) and value is not None and key not in {"actedBy", "hasLegalPermission"}:
                setattr(clause, key, value)
        clause.updatedAt = self._now()
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-legal-001"),
            action="legal_clause.updated",
            target_type="legal_clause",
            target_id=clause.id,
            target_name=clause.title,
            reason=payload["changeReason"],
            changed_fields=["body"],
        )
        return {"legalClause": asdict(self.repository.save_legal_clause(clause)), "auditLog": asdict(audit_log)}

    def request_legal_clause_review(self, clause_id: str, payload: dict) -> dict:
        clause = self._require_legal_clause(clause_id)
        clause.status = "review"
        clause.requestedReviewAt = self._now()
        clause.updatedAt = self._now()
        return {"legalClause": asdict(self.repository.save_legal_clause(clause))}

    def approve_legal_clause(self, clause_id: str, payload: dict) -> dict:
        clause = self._require_legal_clause(clause_id)
        clause.status = "approved"
        clause.approvedAt = self._now()
        clause.approvedBy = payload.get("actedBy", "user-legal-001")
        clause.updatedAt = self._now()
        return {"legalClause": asdict(self.repository.save_legal_clause(clause))}

    def publish_legal_clause(self, clause_id: str, payload: dict) -> dict:
        clause = self._require_legal_clause(clause_id)
        if clause.status != "approved":
            raise AdminValidationError("legal clause publish requires approval")
        clause.status = "published"
        clause.publishedAt = self._now()
        clause.updatedAt = self._now()
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-legal-001"),
            action="legal_clause.published",
            target_type="legal_clause",
            target_id=clause.id,
            target_name=clause.title,
            reason=payload.get("reason", "법령 문구 발행"),
            changed_fields=["status"],
        )
        return {"legalClause": asdict(self.repository.save_legal_clause(clause)), "auditLog": asdict(audit_log)}

    def list_prompts(self) -> list[dict]:
        rows = []
        for prompt in self.repository.list_prompt_templates():
            current = self.repository.get_prompt_version(prompt.currentVersionId) if prompt.currentVersionId else None
            current_logs = self.repository.list_prompt_run_logs(current.id) if current else []
            rows.append(
                {
                    "prompt": asdict(prompt),
                    "currentVersion": asdict(current) if current else None,
                    "testCaseCount": len(self.repository.list_prompt_test_cases(prompt.id)),
                    "runLogCount": len(current_logs),
                }
            )
        return rows

    def create_prompt(self, payload: dict) -> dict:
        if self.repository.get_prompt_template_by_key(payload["promptKey"]):
            raise AdminValidationError("promptKey must be unique")
        prompt = PromptTemplate(
            id=f"prompt-template-{uuid4().hex[:8]}",
            promptKey=payload["promptKey"],
            name=payload["name"],
            promptType=payload["promptType"],
            featureId=payload["featureId"],
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored = self.repository.save_prompt_template(prompt)
        version = PromptVersion(
            id=f"prompt-version-{uuid4().hex[:8]}",
            promptId=stored.id,
            versionNo=1,
            status="draft",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        stored.currentVersionId = version.id
        self.repository.save_prompt_template(stored)
        self.repository.save_prompt_version(version)
        self.repository.save_prompt_test_cases(stored.id, [])
        return self.get_prompt(stored.id)

    def get_prompt(self, prompt_id: str) -> dict:
        prompt = self._require_prompt(prompt_id)
        versions = self.repository.list_prompt_versions(prompt_id)
        current = self.repository.get_prompt_version(prompt.currentVersionId) if prompt.currentVersionId else None
        current_version_id = current.id if current else versions[0].id if versions else None
        return {
            "prompt": asdict(prompt),
            "currentVersion": asdict(current) if current else None,
            "versions": [asdict(item) for item in versions],
            "testCases": [asdict(item) for item in self.repository.list_prompt_test_cases(prompt_id)],
            "runLogs": [asdict(item) for item in self.repository.list_prompt_run_logs(current_version_id)] if current_version_id else [],
        }

    def update_prompt(self, prompt_id: str, payload: dict) -> dict:
        prompt = self._require_prompt(prompt_id)
        for key, value in payload.items():
            if hasattr(prompt, key) and value is not None:
                setattr(prompt, key, value)
        prompt.updatedAt = self._now()
        self.repository.save_prompt_template(prompt)
        return self.get_prompt(prompt_id)

    def delete_prompt(self, prompt_id: str) -> dict:
        self._require_prompt(prompt_id)
        self.repository.delete_prompt_template(prompt_id)
        return {"deleted": True, "promptId": prompt_id}

    def list_prompt_versions(self, prompt_id: str) -> list[dict]:
        self._require_prompt(prompt_id)
        return [asdict(item) for item in self.repository.list_prompt_versions(prompt_id)]

    def create_prompt_version(self, prompt_id: str, payload: dict) -> dict:
        prompt = self._require_prompt(prompt_id)
        latest = self.repository.list_prompt_versions(prompt_id)
        version_no = (latest[0].versionNo if latest else 0) + 1
        base = self.repository.get_prompt_version(prompt.currentVersionId) if prompt.currentVersionId else None
        version = PromptVersion(
            id=f"prompt-version-{uuid4().hex[:8]}",
            promptId=prompt_id,
            versionNo=version_no,
            status="draft",
            systemMessage=payload.get("systemMessage") or (base.systemMessage if base else ""),
            userMessageTemplate=payload.get("userMessageTemplate") or (base.userMessageTemplate if base else ""),
            inputSchema=payload.get("inputSchema") or (base.inputSchema if base else None),
            outputSchema=payload.get("outputSchema") or (base.outputSchema if base else None),
            guardrails=payload.get("guardrails") or (base.guardrails if base else []),
            forbiddenBehaviors=payload.get("forbiddenBehaviors") or (base.forbiddenBehaviors if base else []),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        self.repository.save_prompt_version(version)
        prompt.currentVersionId = version.id
        prompt.updatedAt = self._now()
        self.repository.save_prompt_template(prompt)
        return {"version": asdict(version)}

    def get_prompt_version(self, version_id: str) -> dict:
        version = self._require_prompt_version(version_id)
        return {
            "version": asdict(version),
            "runLogs": [asdict(item) for item in self.repository.list_prompt_run_logs(version_id)],
        }

    def update_prompt_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_prompt_version(version_id)
        if version.status == "published":
            raise AdminValidationError("published prompt version cannot be edited")
        for key, value in payload.items():
            if hasattr(version, key) and value is not None:
                setattr(version, key, value)
        version.updatedAt = self._now()
        self.repository.save_prompt_version(version)
        return self.get_prompt_version(version_id)

    def run_prompt_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_prompt_version(version_id)
        output = {"draft": f"{version.systemMessage or version.userMessageTemplate} :: {payload.get('inputFixture', {})}"}
        output_text = json.dumps(output, ensure_ascii=False)
        schema_valid = bool(version.outputSchema)
        forbidden_hits = [
            item for item in version.forbiddenBehaviors if item and item in output_text
        ]
        passed = schema_valid and not forbidden_hits
        run_log = PromptRunLog(
            id=f"prompt-run-log-{uuid4().hex[:8]}",
            promptVersionId=version_id,
            inputFixture=payload.get("inputFixture", {}),
            outputText=output_text,
            schemaValid=schema_valid,
            forbiddenBehaviorHits=forbidden_hits,
            passed=passed,
            createdAt=self._now(),
        )
        self.repository.add_prompt_run_log(run_log)
        version.lastTestRunAt = self._now()
        version.updatedAt = self._now()
        self.repository.save_prompt_version(version)
        return {"runLog": asdict(run_log), "output": output}

    def review_prompt_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_prompt_version(version_id)
        version.status = "review"
        version.reviewNote = payload.get("reason")
        version.updatedAt = self._now()
        self.repository.save_prompt_version(version)
        return {"version": asdict(version)}

    def publish_prompt_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_prompt_version(version_id)
        prompt = self._require_prompt(version.promptId)
        test_logs = self.repository.list_prompt_run_logs(version_id)
        if prompt.promptType == "service_ai":
            if not version.inputSchema or not version.outputSchema or not version.guardrails or not version.forbiddenBehaviors:
                raise AdminValidationError("service AI prompt publish requires schema, guardrails, and forbiddenBehaviors")
            if not test_logs:
                raise AdminValidationError("prompt publish requires at least one executed test case")
        version.status = "published"
        version.publishedAt = self._now()
        version.publishedBy = payload.get("actedBy", "user-prompt-manager-001")
        version.updatedAt = self._now()
        self.repository.save_prompt_version(version)
        prompt.status = "published"
        prompt.currentVersionId = version.id
        prompt.publishedVersionId = version.id
        prompt.updatedAt = self._now()
        self.repository.save_prompt_template(prompt)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-prompt-manager-001"),
            action="prompt_version.published",
            target_type="prompt_version",
            target_id=version.id,
            target_name=prompt.name,
            reason=payload.get("reason", "프롬프트 발행"),
            changed_fields=["status", "publishedVersionId"],
        )
        return {"version": asdict(version), "prompt": asdict(prompt), "auditLog": asdict(audit_log)}

    def rollback_prompt_version(self, version_id: str, payload: dict) -> dict:
        version = self._require_prompt_version(version_id)
        prompt = self._require_prompt(version.promptId)
        target_version_id = payload.get("targetVersionId") or version.id
        target = self._require_prompt_version(target_version_id)
        target.status = "published"
        target.updatedAt = self._now()
        self.repository.save_prompt_version(target)
        prompt.currentVersionId = target.id
        prompt.publishedVersionId = target.id
        prompt.status = "published"
        prompt.updatedAt = self._now()
        self.repository.save_prompt_template(prompt)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-prompt-manager-001"),
            action="prompt_version.rollback",
            target_type="prompt_version",
            target_id=target.id,
            target_name=prompt.name,
            reason=payload.get("reason", "프롬프트 롤백"),
            changed_fields=["publishedVersionId"],
        )
        return {"prompt": asdict(prompt), "version": asdict(target), "auditLog": asdict(audit_log)}

    def list_prompt_test_cases(self, prompt_id: str) -> list[dict]:
        self._require_prompt(prompt_id)
        return [asdict(item) for item in self.repository.list_prompt_test_cases(prompt_id)]

    def create_prompt_test_case(self, prompt_id: str, payload: dict) -> dict:
        self._require_prompt(prompt_id)
        test_cases = self.repository.list_prompt_test_cases(prompt_id)
        test_case = PromptTestCase(
            id=f"prompt-test-case-{uuid4().hex[:8]}",
            promptId=prompt_id,
            name=payload["name"],
            inputFixture=payload.get("inputFixture", {}),
            expectedContains=payload.get("expectedContains", []),
            expectedMissing=payload.get("expectedMissing", []),
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        test_cases.append(test_case)
        self.repository.save_prompt_test_cases(prompt_id, test_cases)
        return {"testCase": asdict(test_case), "testCases": [asdict(item) for item in test_cases]}

    def update_prompt_test_case(self, test_case_id: str, payload: dict) -> dict:
        prompt_id, test_cases, target = self._locate_prompt_test_case(test_case_id)
        for item in test_cases:
            if item.id == test_case_id:
                for key, value in payload.items():
                    if hasattr(item, key) and value is not None:
                        setattr(item, key, value)
                item.updatedAt = self._now()
                target = item
                break
        self.repository.save_prompt_test_cases(prompt_id, test_cases)
        return {"testCase": asdict(target)}

    def delete_prompt_test_case(self, test_case_id: str) -> dict:
        prompt_id, test_cases, _ = self._locate_prompt_test_case(test_case_id)
        self.repository.save_prompt_test_cases(prompt_id, [item for item in test_cases if item.id != test_case_id])
        return {"deleted": True, "testCaseId": test_case_id}

    def run_prompt_test_cases(self, version_id: str) -> dict:
        version = self._require_prompt_version(version_id)
        prompt = self._require_prompt(version.promptId)
        results = []
        for test_case in self.repository.list_prompt_test_cases(prompt.id):
            run_result = self.run_prompt_version(version_id, {"inputFixture": test_case.inputFixture})
            output_text = run_result["runLog"]["outputText"]
            passed = run_result["runLog"]["schemaValid"]
            for expected in test_case.expectedContains:
                if expected not in output_text:
                    passed = False
            for forbidden in test_case.expectedMissing:
                if forbidden in output_text:
                    passed = False
            results.append(
                {
                    "testCase": asdict(test_case),
                    "runLog": run_result["runLog"],
                    "passed": passed,
                }
            )
        version.lastTestRunAt = self._now()
        version.updatedAt = self._now()
        self.repository.save_prompt_version(version)
        return {"results": results, "version": asdict(version)}

    def get_webhard_policy(self) -> dict:
        return {"policy": asdict(self._require_webhard_policy())}

    def update_webhard_policy(self, payload: dict) -> dict:
        policy = self._require_webhard_policy()
        for key, value in payload.items():
            if hasattr(policy, key) and value is not None and key not in {"reason", "actedBy"}:
                setattr(policy, key, value)
        policy.updatedAt = self._now()
        stored = self.repository.save_webhard_policy(policy)
        audit_log = self._add_audit_log(
            actor_user_id=payload.get("actedBy", "user-admin-001"),
            action="webhard_policy.updated",
            target_type="webhard_policy",
            target_id=stored.id,
            target_name=stored.defaultRootFolderName,
            reason=payload.get("reason", "웹하드 정책 수정"),
            changed_fields=["policy"],
        )
        return {"policy": asdict(stored), "auditLog": asdict(audit_log)}

    def list_mail_templates(self) -> list[dict]:
        return self.mail_service.list_templates()

    def create_mail_template(self, payload: dict) -> dict:
        return self.mail_service.create_template(payload)

    def get_mail_template(self, template_id: str) -> dict:
        return self.mail_service.get_template(template_id)

    def update_mail_template(self, template_id: str, payload: dict) -> dict:
        return self.mail_service.update_template(template_id, payload)

    def list_approval_templates(self) -> list[dict]:
        return self.approval_service.list_templates()

    def create_approval_template(self, payload: dict) -> dict:
        return self.approval_service.create_template(payload)

    def get_approval_template(self, template_id: str) -> dict:
        return self.approval_service.get_template(template_id)

    def update_approval_template(self, template_id: str, payload: dict) -> dict:
        return self.approval_service.update_template(template_id, payload)

    def list_signature_assets(self) -> list[dict]:
        return self.approval_service.list_signature_assets()

    def create_signature_asset(self, payload: dict) -> dict:
        return self.approval_service.create_signature_asset(payload)

    def get_signature_asset(self, asset_id: str) -> dict:
        return self.approval_service.get_signature_asset(asset_id)

    def update_signature_asset(self, asset_id: str, payload: dict) -> dict:
        return self.approval_service.update_signature_asset(asset_id, payload)

    def list_audit_logs(self, target_type: str | None = None) -> list[dict]:
        return [asdict(item) for item in self.repository.list_audit_logs(target_type)]

    def get_audit_log(self, audit_log_id: str) -> dict:
        audit_log = self.repository.get_audit_log(audit_log_id)
        if not audit_log:
            raise AdminNotFoundError("admin audit log not found")
        return {"auditLog": asdict(audit_log)}

    def _default_template_sample_data(self) -> dict:
        return {
            "project": {"projectName": "샘플 프로젝트", "siteAddress": "서울시"},
            "owner": {"organizationName": "샘플 발주처", "requiresSeparateReport": True},
            "inspection": {"roundNo": 1, "actualInspectionDate": "2026-05-10"},
        }

    def _find_missing_fields(self, version_id: str, sample_data: dict) -> list[MissingField]:
        missing = []
        for variable in self.repository.list_template_variables(version_id):
            if self._resolve_data_path(sample_data, variable.dataPath) is None:
                missing.append(
                    MissingField(
                        field=variable.variableKey,
                        message=f"{variable.dataPath} 값이 없습니다.",
                        severity="danger" if variable.required else "warning",
                        label=variable.label,
                        reason=f"{variable.dataPath} 값이 없습니다.",
                    )
                )
        return missing

    def _resolve_data_path(self, payload: dict, data_path: str):
        current = payload
        for token in data_path.split("."):
            if not isinstance(current, dict) or token not in current:
                return None
            current = current[token]
        return current

    def _ensure_legal_permission(self, payload: dict) -> None:
        if not payload.get("hasLegalPermission", True):
            raise AdminValidationError("legal clause update requires permission")

    def _create_admin_file_asset(self, file_name: str, file_type: str, relation_type: str) -> FileAsset:
        file_asset = FileAsset(
            id=f"file-admin-{uuid4().hex[:8]}",
            projectId="admin-global",
            fileName=file_name,
            fileType=file_type,
            storagePath=f"/admin/{relation_type}/{file_name}",
            linkedEntityType="admin",
            linkedEntityId=relation_type,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        return self.repository.save_file_asset(file_asset)

    def _add_audit_log(
        self,
        actor_user_id: str,
        action: str,
        target_type: str,
        target_id: str,
        target_name: str,
        reason: str,
        changed_fields: list[str],
    ) -> AdminAuditLog:
        return self.repository.add_audit_log(
            AdminAuditLog(
                id=f"admin-audit-{uuid4().hex[:8]}",
                actorUserId=actor_user_id,
                action=action,
                targetType=target_type,
                targetId=target_id,
                targetName=target_name,
                reason=reason,
                changedFields=changed_fields,
                createdAt=self._now(),
            )
        )

    def _require_user(self, user_id: str) -> AdminUser:
        user = self.repository.get_user(user_id)
        if not user:
            raise AdminNotFoundError("admin user not found")
        return user

    def _require_role(self, role_id: str) -> Role:
        role = self.repository.get_role(role_id)
        if not role:
            raise AdminNotFoundError("role not found")
        return role

    def _require_company_profile(self) -> CompanyProfile:
        profile = self.repository.get_company_profile()
        if not profile:
            raise AdminNotFoundError("company profile not found")
        return profile

    def _require_document_template(self, template_id: str) -> DocumentTemplate:
        template = self.repository.get_document_template(template_id)
        if not template:
            raise AdminNotFoundError("document template not found")
        return template

    def _require_template_version(self, version_id: str) -> TemplateVersion:
        version = self.repository.get_template_version(version_id)
        if not version:
            raise AdminNotFoundError("template version not found")
        return version

    def _require_phrase(self, phrase_id: str) -> Phrase:
        phrase = self.repository.get_phrase(phrase_id)
        if not phrase:
            raise AdminNotFoundError("phrase not found")
        return phrase

    def _require_legal_clause(self, clause_id: str) -> LegalClause:
        clause = self.repository.get_legal_clause(clause_id)
        if not clause:
            raise AdminNotFoundError("legal clause not found")
        return clause

    def _require_prompt(self, prompt_id: str) -> PromptTemplate:
        prompt = self.repository.get_prompt_template(prompt_id)
        if not prompt:
            raise AdminNotFoundError("prompt template not found")
        return prompt

    def _require_prompt_version(self, version_id: str) -> PromptVersion:
        version = self.repository.get_prompt_version(version_id)
        if not version:
            raise AdminNotFoundError("prompt version not found")
        prompt = self._require_prompt(version.promptId)
        if prompt.promptType == "service_ai" and (version.status == "published" or prompt.status == "published"):
            if not version.inputSchema or not version.outputSchema:
                raise AdminValidationError("prompt version requires schema for service_ai")
        return version

    def _require_webhard_policy(self) -> WebhardPolicy:
        policy = self.repository.get_webhard_policy()
        if not policy:
            raise AdminNotFoundError("webhard policy not found")
        return policy

    def _locate_template_section(self, section_id: str) -> tuple[str, list[TemplateSection], TemplateSection]:
        for version_id, sections in self.repository.templateSections.items():
            for section in sections:
                if section.id == section_id:
                    return version_id, list(sections), section
        raise AdminNotFoundError("template section not found")

    def _locate_template_variable(self, variable_id: str) -> tuple[str, list[TemplateVariable], TemplateVariable]:
        for version_id, variables in self.repository.templateVariables.items():
            for variable in variables:
                if variable.id == variable_id:
                    return version_id, list(variables), variable
        raise AdminNotFoundError("template variable not found")

    def _locate_prompt_test_case(self, test_case_id: str) -> tuple[str, list[PromptTestCase], PromptTestCase]:
        for prompt_id, test_cases in self.repository.promptTestCases.items():
            for test_case in test_cases:
                if test_case.id == test_case_id:
                    return prompt_id, list(test_cases), test_case
        raise AdminNotFoundError("prompt test case not found")
