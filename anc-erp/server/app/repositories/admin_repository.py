from copy import deepcopy

from server.app.domain.models import (
    AdminAuditLog,
    AdminUser,
    CompanyProfile,
    DocumentTemplate,
    FileAsset,
    LegalClause,
    Permission,
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


class AdminRepository:
    def __init__(self) -> None:
        self.users: dict[str, AdminUser] = {}
        self.roles: dict[str, Role] = {}
        self.permissions: dict[str, Permission] = {}
        self.companyProfile: CompanyProfile | None = None
        self.documentTemplates: dict[str, DocumentTemplate] = {}
        self.templateVersions: dict[str, TemplateVersion] = {}
        self.templateSections: dict[str, list[TemplateSection]] = {}
        self.templateVariables: dict[str, list[TemplateVariable]] = {}
        self.templateLoops: dict[str, list[TemplateLoop]] = {}
        self.templateConditions: dict[str, list[TemplateCondition]] = {}
        self.templatePreviewRuns: dict[str, list[TemplatePreviewRun]] = {}
        self.phrases: dict[str, Phrase] = {}
        self.legalClauses: dict[str, LegalClause] = {}
        self.promptTemplates: dict[str, PromptTemplate] = {}
        self.promptVersions: dict[str, PromptVersion] = {}
        self.promptTestCases: dict[str, list[PromptTestCase]] = {}
        self.promptRunLogs: dict[str, list[PromptRunLog]] = {}
        self.webhardPolicy: WebhardPolicy | None = None
        self.auditLogs: list[AdminAuditLog] = []
        self.fileAssets: dict[str, FileAsset] = {}
        self._seed()

    def _seed(self) -> None:
        now = "2026-05-10T14:00:00+09:00"
        permissions = [
            ("project.read", "프로젝트 읽기", "project"),
            ("project.write", "프로젝트 수정", "project"),
            ("document.generate", "문서 생성", "document"),
            ("document.export", "문서 export", "document"),
            ("document.submit", "문서 제출", "document"),
            ("template.read", "템플릿 조회", "template"),
            ("template.write", "템플릿 수정", "template"),
            ("template.publish", "템플릿 발행", "template"),
            ("prompt.read", "프롬프트 조회", "prompt"),
            ("prompt.write", "프롬프트 수정", "prompt"),
            ("prompt.publish", "프롬프트 발행", "prompt"),
            ("legal_clause.write", "법령 문구 수정", "legal"),
            ("admin.audit.read", "감사로그 조회", "admin"),
        ]
        for index, (key, name, group_key) in enumerate(permissions, start=1):
            self.permissions[key] = Permission(
                id=f"permission-{index:03d}",
                key=key,
                name=name,
                groupKey=group_key,
            )

        role_rows = [
            ("super_admin", "최고관리자", [item[0] for item in permissions], True),
            ("admin", "관리자", ["project.read", "project.write", "template.read", "template.write", "prompt.read", "prompt.write", "admin.audit.read"], True),
            ("template_manager", "템플릿 관리자", ["template.read", "template.write", "template.publish"], False),
            ("prompt_manager", "프롬프트 관리자", ["prompt.read", "prompt.write", "prompt.publish"], False),
            ("legal_text_manager", "법령 문구 관리자", ["template.read", "legal_clause.write"], False),
            ("engineer", "기술사", ["project.read", "document.generate", "document.export"], False),
            ("writer", "작성자", ["project.read", "document.generate"], False),
            ("contract_manager", "계약 담당", ["project.read", "project.write"], False),
            ("field_inspector", "현장 점검자", ["project.read"], False),
            ("viewer", "조회 전용", ["project.read", "template.read", "prompt.read"], False),
        ]
        for index, (key, name, permission_keys, system_role) in enumerate(role_rows, start=1):
            self.roles[key] = Role(
                id=f"role-{index:03d}",
                key=key,
                name=name,
                permissionKeys=permission_keys,
                systemRole=system_role,
                createdAt=now,
                updatedAt=now,
            )

        self.users["user-admin-001"] = AdminUser(
            id="user-admin-001",
            name="관리자",
            email="admin@anc.local",
            department="운영관리",
            position="Admin",
            status="active",
            roleIds=["role-001"],
            projectAccessPolicy="all",
            lastLoginAt=now,
            createdAt=now,
            updatedAt=now,
        )

        self.companyProfile = CompanyProfile(
            id="company-profile-001",
            companyName="A&C기술사사무소",
            representativeName="대표기술사",
            businessNumber="000-00-00000",
            address="서울시 강남구 테헤란로 100",
            phone="02-0000-0000",
            email="office@anc.local",
            engineerLicenseLabel="건설안전기술사",
            defaultSignatureText="본 문서는 업무용 초안입니다.",
            defaultDocumentFooter="A&C 기술사 ERP 문서 시스템",
            defaultMailFooter="A&C기술사사무소",
            updatedAt=now,
        )
        self.webhardPolicy = WebhardPolicy(
            id="webhard-policy-001",
            defaultRootFolderName="A&C ERP 자료함",
            generatedDocumentsFolderName="최종본",
            submissionFolderName="제출본",
            sharedLinkExpiryDays=14,
            requireLockedFinalFiles=True,
            updatedAt=now,
        )

        seeded_templates = [
            ("technical_service_contract", "기술용역계약서", "technical_service_contract"),
            ("safety_health_ledger_inspection_report", "이행확인 보고서", "safety_health_ledger_inspection_report"),
            ("photo_ledger", "사진대지", "photo_ledger"),
            ("safety_cost_usage", "산안비 사용내용 확인", "safety_cost_usage"),
            ("safety_management_plan", "안전관리계획서", "safety_management_plan"),
            ("safety_health_ledger", "안전보건대장", "safety_health_ledger"),
            ("mail_submission", "제출 메일 템플릿", "mail_submission"),
            ("mail_action_request", "조치요청 메일 템플릿", "mail_action_request"),
        ]
        for index, (template_key, name, document_type) in enumerate(seeded_templates, start=1):
            template = DocumentTemplate(
                id=f"document-template-{index:03d}",
                templateKey=template_key,
                name=name,
                documentType=document_type,
                status="published",
                createdAt=now,
                updatedAt=now,
            )
            version = TemplateVersion(
                id=f"template-version-{index:03d}",
                templateId=template.id,
                versionNo=1,
                status="published",
                bodyTemplate=f"{name} 초안\n{{{{project.projectName}}}}\n{{{{owner.organizationName}}}}",
                changeSummary="초기 발행본",
                publishedAt=now,
                publishedBy="user-admin-001",
                validationPassed=True,
                previewPassed=True,
                createdAt=now,
                updatedAt=now,
            )
            template.currentVersionId = version.id
            template.publishedVersionId = version.id
            self.documentTemplates[template.id] = deepcopy(template)
            self.templateVersions[version.id] = deepcopy(version)
            self.templateSections[version.id] = [
                TemplateSection(
                    id=f"template-section-{index:03d}-001",
                    versionId=version.id,
                    key="cover",
                    title="표지",
                    body=f"{name}\n{{{{project.projectName}}}}",
                    displayOrder=1,
                ),
                TemplateSection(
                    id=f"template-section-{index:03d}-002",
                    versionId=version.id,
                    key="body",
                    title="본문",
                    body="{{#if owner.requiresSeparateReport}}\n발주처별 제출 문구\n{{/if}}",
                    displayOrder=2,
                ),
            ]
            self.templateVariables[version.id] = [
                TemplateVariable(
                    id=f"template-variable-{index:03d}-001",
                    versionId=version.id,
                    variableKey="project.projectName",
                    label="프로젝트명",
                    dataPath="project.projectName",
                    sourceModel="Project",
                    dataType="string",
                    required=True,
                    exampleValue="샘플 프로젝트",
                    usedSectionKeys=["cover"],
                ),
                TemplateVariable(
                    id=f"template-variable-{index:03d}-002",
                    versionId=version.id,
                    variableKey="owner.organizationName",
                    label="발주처명",
                    dataPath="owner.organizationName",
                    sourceModel="ProjectParty",
                    dataType="string",
                    required="mail_" not in template_key,
                    ownerSpecific=True,
                    exampleValue="샘플 발주처",
                    usedSectionKeys=["body"],
                ),
            ]
            self.templateLoops[version.id] = []
            self.templateConditions[version.id] = [
                TemplateCondition(
                    id=f"template-condition-{index:03d}-001",
                    versionId=version.id,
                    conditionKey="owner.requiresSeparateReport",
                    expression="owner.requiresSeparateReport",
                    usedSectionKeys=["body"],
                )
            ]

        seeded_prompts = [
            ("project-info-extraction", "프로젝트 정보 추출", "service_ai", "project.field.registry"),
            ("contract-draft-generation", "계약 초안 생성", "service_ai", "contract.estimate.management"),
            ("inspection-schedule-generation", "점검 일정 생성", "service_ai", "inspection.schedule.management"),
            ("safety-report-generation", "보고서 생성", "service_ai", "document.safety_health_ledger_report"),
            ("checklist-summary-and-finding-candidate", "체크리스트 요약", "service_ai", "inspection.checklist.management"),
            ("finding-action-photo-ledger", "지적/사진대지", "service_ai", "finding.action.photo_ledger"),
            ("safety-cost-usage-comment", "산안비 코멘트", "service_ai", "safety_cost.usage_confirmation"),
            ("safety-management-plan-generation", "안전관리계획서 생성", "service_ai", "safety_management_plan.automation"),
            ("safety-health-ledger-generation", "안전보건대장 생성", "service_ai", "safety_health_ledger.automation"),
            ("webhard-file-classification", "웹하드 파일 분류", "service_ai", "webhard.file_management"),
            ("mail-draft-and-classification", "메일 초안/분류", "service_ai", "mailbox.project_communication"),
            ("approval-submission-readiness", "제출 준비도 검증", "service_ai", "approval.signature.submission"),
            ("template-variable-mapping-and-prompt-governance", "템플릿/프롬프트 거버넌스", "service_ai", "admin.template.prompt"),
            ("codex-feature-13-implementation", "Codex 구현 프롬프트", "codex", "admin.template.prompt"),
            ("design-feature-13-admin", "디자인 프롬프트", "design", "admin.template.prompt"),
            ("reverse-feature-13-admin", "Reverse Prompt", "reverse", "admin.template.prompt"),
        ]
        for index, (prompt_key, name, prompt_type, feature_id) in enumerate(seeded_prompts, start=1):
            prompt = PromptTemplate(
                id=f"prompt-template-{index:03d}",
                promptKey=prompt_key,
                name=name,
                promptType=prompt_type,
                featureId=feature_id,
                status="published" if prompt_type == "service_ai" else "draft",
                createdAt=now,
                updatedAt=now,
            )
            version = PromptVersion(
                id=f"prompt-version-{index:03d}",
                promptId=prompt.id,
                versionNo=1,
                status="published" if prompt_type == "service_ai" else "draft",
                systemMessage=f"{name} 시스템 메시지",
                userMessageTemplate=f"{name} 사용자 템플릿",
                inputSchema={"type": "object", "properties": {"projectId": {"type": "string"}}},
                outputSchema={"type": "object", "properties": {"draft": {"type": "string"}}},
                guardrails=["Do not invent facts"],
                forbiddenBehaviors=["invent_legal_text"],
                lastTestRunAt=now if prompt_type == "service_ai" else None,
                publishedAt=now if prompt_type == "service_ai" else None,
                publishedBy="user-admin-001" if prompt_type == "service_ai" else None,
                createdAt=now,
                updatedAt=now,
            )
            prompt.currentVersionId = version.id
            if version.status == "published":
                prompt.publishedVersionId = version.id
            self.promptTemplates[prompt.id] = deepcopy(prompt)
            self.promptVersions[version.id] = deepcopy(version)
            self.promptTestCases[prompt.id] = [
                PromptTestCase(
                    id=f"prompt-test-case-{index:03d}-001",
                    promptId=prompt.id,
                    name=f"{name} 기본 케이스",
                    inputFixture={"projectId": "project-sample-001"},
                    expectedContains=["draft"],
                    createdAt=now,
                    updatedAt=now,
                )
            ]
            if prompt_type == "service_ai":
                self.promptRunLogs[version.id] = [
                    PromptRunLog(
                        id=f"prompt-run-log-{index:03d}-001",
                        promptVersionId=version.id,
                        testCaseId=f"prompt-test-case-{index:03d}-001",
                        inputFixture={"projectId": "project-sample-001"},
                        outputText='{"draft":"ok"}',
                        schemaValid=True,
                        passed=True,
                        createdAt=now,
                    )
                ]

        self.phrases["phrase-001"] = Phrase(
            id="phrase-001",
            phraseType="standard_phrase",
            title="보고서 기본 안내",
            body="본 문서는 업무상 초안이며 사용자 확인 후 확정됩니다.",
            tags=["draft", "report"],
            status="published",
            publishedAt=now,
            createdAt=now,
            updatedAt=now,
        )
        self.legalClauses["legal-clause-001"] = LegalClause(
            id="legal-clause-001",
            clauseCode="OSHA-001",
            title="산업안전보건 기본 문구",
            body="법령 문구 초안",
            status="approved",
            changeReason="초기 등록",
            requestedReviewAt=now,
            approvedAt=now,
            approvedBy="user-legal-001",
            createdAt=now,
            updatedAt=now,
        )

    def list_users(self) -> list[AdminUser]:
        return sorted([deepcopy(item) for item in self.users.values()], key=lambda item: item.name)

    def get_user(self, user_id: str) -> AdminUser | None:
        item = self.users.get(user_id)
        return deepcopy(item) if item else None

    def save_user(self, user: AdminUser) -> AdminUser:
        self.users[user.id] = deepcopy(user)
        return deepcopy(user)

    def delete_user(self, user_id: str) -> None:
        self.users.pop(user_id, None)

    def list_roles(self) -> list[Role]:
        return sorted([deepcopy(item) for item in self.roles.values()], key=lambda item: item.name)

    def get_role(self, role_id: str) -> Role | None:
        item = self.roles.get(role_id) or next((item for item in self.roles.values() if item.id == role_id), None)
        return deepcopy(item) if item else None

    def save_role(self, role: Role) -> Role:
        self.roles[role.key] = deepcopy(role)
        return deepcopy(role)

    def delete_role(self, role_id: str) -> None:
        target = self.get_role(role_id)
        if target:
            self.roles.pop(target.key, None)

    def list_permissions(self) -> list[Permission]:
        return sorted([deepcopy(item) for item in self.permissions.values()], key=lambda item: (item.groupKey, item.key))

    def get_company_profile(self) -> CompanyProfile | None:
        return deepcopy(self.companyProfile) if self.companyProfile else None

    def save_company_profile(self, profile: CompanyProfile) -> CompanyProfile:
        self.companyProfile = deepcopy(profile)
        return deepcopy(profile)

    def save_file_asset(self, file_asset: FileAsset) -> FileAsset:
        self.fileAssets[file_asset.id] = deepcopy(file_asset)
        return deepcopy(file_asset)

    def list_document_templates(self) -> list[DocumentTemplate]:
        return sorted([deepcopy(item) for item in self.documentTemplates.values()], key=lambda item: item.name)

    def get_document_template(self, template_id: str) -> DocumentTemplate | None:
        item = self.documentTemplates.get(template_id)
        return deepcopy(item) if item else None

    def get_document_template_by_key(self, template_key: str) -> DocumentTemplate | None:
        item = next((row for row in self.documentTemplates.values() if row.templateKey == template_key), None)
        return deepcopy(item) if item else None

    def save_document_template(self, template: DocumentTemplate) -> DocumentTemplate:
        self.documentTemplates[template.id] = deepcopy(template)
        return deepcopy(template)

    def delete_document_template(self, template_id: str) -> None:
        template = self.documentTemplates.pop(template_id, None)
        if not template:
            return
        version_ids = [item.id for item in self.templateVersions.values() if item.templateId == template_id]
        for version_id in version_ids:
            self.templateVersions.pop(version_id, None)
            self.templateSections.pop(version_id, None)
            self.templateVariables.pop(version_id, None)
            self.templateLoops.pop(version_id, None)
            self.templateConditions.pop(version_id, None)
            self.templatePreviewRuns.pop(version_id, None)

    def list_template_versions(self, template_id: str) -> list[TemplateVersion]:
        return sorted(
            [deepcopy(item) for item in self.templateVersions.values() if item.templateId == template_id],
            key=lambda item: item.versionNo,
            reverse=True,
        )

    def get_template_version(self, version_id: str) -> TemplateVersion | None:
        item = self.templateVersions.get(version_id)
        return deepcopy(item) if item else None

    def save_template_version(self, version: TemplateVersion) -> TemplateVersion:
        self.templateVersions[version.id] = deepcopy(version)
        return deepcopy(version)

    def list_template_sections(self, version_id: str) -> list[TemplateSection]:
        return sorted(deepcopy(self.templateSections.get(version_id, [])), key=lambda item: item.displayOrder)

    def save_template_sections(self, version_id: str, sections: list[TemplateSection]) -> list[TemplateSection]:
        self.templateSections[version_id] = deepcopy(sections)
        return deepcopy(sections)

    def list_template_variables(self, version_id: str) -> list[TemplateVariable]:
        return deepcopy(self.templateVariables.get(version_id, []))

    def save_template_variables(self, version_id: str, variables: list[TemplateVariable]) -> list[TemplateVariable]:
        self.templateVariables[version_id] = deepcopy(variables)
        return deepcopy(variables)

    def list_template_loops(self, version_id: str) -> list[TemplateLoop]:
        return deepcopy(self.templateLoops.get(version_id, []))

    def save_template_loops(self, version_id: str, loops: list[TemplateLoop]) -> list[TemplateLoop]:
        self.templateLoops[version_id] = deepcopy(loops)
        return deepcopy(loops)

    def list_template_conditions(self, version_id: str) -> list[TemplateCondition]:
        return deepcopy(self.templateConditions.get(version_id, []))

    def save_template_conditions(self, version_id: str, conditions: list[TemplateCondition]) -> list[TemplateCondition]:
        self.templateConditions[version_id] = deepcopy(conditions)
        return deepcopy(conditions)

    def add_template_preview_run(self, preview_run: TemplatePreviewRun) -> TemplatePreviewRun:
        self.templatePreviewRuns.setdefault(preview_run.versionId, []).append(deepcopy(preview_run))
        return deepcopy(preview_run)

    def list_template_preview_runs(self, version_id: str) -> list[TemplatePreviewRun]:
        return deepcopy(self.templatePreviewRuns.get(version_id, []))

    def list_phrases(self) -> list[Phrase]:
        return sorted([deepcopy(item) for item in self.phrases.values()], key=lambda item: item.title)

    def get_phrase(self, phrase_id: str) -> Phrase | None:
        item = self.phrases.get(phrase_id)
        return deepcopy(item) if item else None

    def save_phrase(self, phrase: Phrase) -> Phrase:
        self.phrases[phrase.id] = deepcopy(phrase)
        return deepcopy(phrase)

    def list_legal_clauses(self) -> list[LegalClause]:
        return sorted([deepcopy(item) for item in self.legalClauses.values()], key=lambda item: item.clauseCode)

    def get_legal_clause(self, clause_id: str) -> LegalClause | None:
        item = self.legalClauses.get(clause_id)
        return deepcopy(item) if item else None

    def save_legal_clause(self, clause: LegalClause) -> LegalClause:
        self.legalClauses[clause.id] = deepcopy(clause)
        return deepcopy(clause)

    def list_prompt_templates(self) -> list[PromptTemplate]:
        return sorted([deepcopy(item) for item in self.promptTemplates.values()], key=lambda item: item.name)

    def get_prompt_template(self, prompt_id: str) -> PromptTemplate | None:
        item = self.promptTemplates.get(prompt_id)
        return deepcopy(item) if item else None

    def get_prompt_template_by_key(self, prompt_key: str) -> PromptTemplate | None:
        item = next((row for row in self.promptTemplates.values() if row.promptKey == prompt_key), None)
        return deepcopy(item) if item else None

    def save_prompt_template(self, prompt: PromptTemplate) -> PromptTemplate:
        self.promptTemplates[prompt.id] = deepcopy(prompt)
        return deepcopy(prompt)

    def delete_prompt_template(self, prompt_id: str) -> None:
        self.promptTemplates.pop(prompt_id, None)
        version_ids = [item.id for item in self.promptVersions.values() if item.promptId == prompt_id]
        for version_id in version_ids:
            self.promptVersions.pop(version_id, None)
            self.promptRunLogs.pop(version_id, None)
        self.promptTestCases.pop(prompt_id, None)

    def list_prompt_versions(self, prompt_id: str) -> list[PromptVersion]:
        return sorted(
            [deepcopy(item) for item in self.promptVersions.values() if item.promptId == prompt_id],
            key=lambda item: item.versionNo,
            reverse=True,
        )

    def get_prompt_version(self, version_id: str) -> PromptVersion | None:
        item = self.promptVersions.get(version_id)
        return deepcopy(item) if item else None

    def save_prompt_version(self, version: PromptVersion) -> PromptVersion:
        self.promptVersions[version.id] = deepcopy(version)
        return deepcopy(version)

    def list_prompt_test_cases(self, prompt_id: str) -> list[PromptTestCase]:
        return deepcopy(self.promptTestCases.get(prompt_id, []))

    def save_prompt_test_cases(self, prompt_id: str, test_cases: list[PromptTestCase]) -> list[PromptTestCase]:
        self.promptTestCases[prompt_id] = deepcopy(test_cases)
        return deepcopy(test_cases)

    def add_prompt_run_log(self, run_log: PromptRunLog) -> PromptRunLog:
        self.promptRunLogs.setdefault(run_log.promptVersionId, []).append(deepcopy(run_log))
        return deepcopy(run_log)

    def list_prompt_run_logs(self, version_id: str) -> list[PromptRunLog]:
        return deepcopy(self.promptRunLogs.get(version_id, []))

    def get_webhard_policy(self) -> WebhardPolicy | None:
        return deepcopy(self.webhardPolicy) if self.webhardPolicy else None

    def save_webhard_policy(self, policy: WebhardPolicy) -> WebhardPolicy:
        self.webhardPolicy = deepcopy(policy)
        return deepcopy(policy)

    def add_audit_log(self, audit_log: AdminAuditLog) -> AdminAuditLog:
        self.auditLogs.append(deepcopy(audit_log))
        return deepcopy(audit_log)

    def list_audit_logs(self, target_type: str | None = None) -> list[AdminAuditLog]:
        rows = [deepcopy(item) for item in self.auditLogs]
        if target_type:
            rows = [item for item in rows if item.targetType == target_type]
        return sorted(rows, key=lambda item: item.createdAt, reverse=True)

    def get_audit_log(self, audit_log_id: str) -> AdminAuditLog | None:
        item = next((row for row in self.auditLogs if row.id == audit_log_id), None)
        return deepcopy(item) if item else None
