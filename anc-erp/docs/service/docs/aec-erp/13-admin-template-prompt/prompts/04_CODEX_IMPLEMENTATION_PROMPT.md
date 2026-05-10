# 04. Codex Implementation Prompt — 관리자/템플릿/프롬프트

## Prompt

```text
You are implementing the Admin, Template, and Prompt Repository module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. This module manages users, roles, permissions, company profile, document templates, checklist templates, phrase/legal clause libraries, service AI prompts, Codex implementation prompts, design prompts, reverse prompts, test cases, release/rollback, and audit logs.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: InMemory repositories
- V1 Storage: MongoDB repository adapter
- API namespace: /api/v1

Implement only the Admin / Template / Prompt module.

Existing concepts:
- Project
- DocumentInstance
- ChecklistTemplate
- FileAsset
- MailTemplate
- ApprovalWorkflow
- AuditLog

Required backend models:
- AdminUser
- Role
- Permission
- CompanyProfile
- DocumentTemplate
- TemplateVersion
- TemplateSection
- TemplateVariable
- TemplateLoop
- TemplateCondition
- TemplatePreviewRun
- Phrase
- LegalClause
- PromptTemplate
- PromptVersion
- PromptTestCase
- PromptRunLog
- WebhardPolicy
- MailTemplate
- ApprovalTemplate
- SignatureAsset
- AdminAuditLog

Required backend APIs:

Users / Roles:
- GET /api/v1/admin/users
- POST /api/v1/admin/users
- GET /api/v1/admin/users/{userId}
- PATCH /api/v1/admin/users/{userId}
- DELETE /api/v1/admin/users/{userId}
- GET /api/v1/admin/roles
- POST /api/v1/admin/roles
- PATCH /api/v1/admin/roles/{roleId}
- DELETE /api/v1/admin/roles/{roleId}
- GET /api/v1/admin/permissions
- PATCH /api/v1/admin/roles/{roleId}/permissions

Company Profile:
- GET /api/v1/admin/company-profile
- PATCH /api/v1/admin/company-profile
- POST /api/v1/admin/company-profile/logo
- POST /api/v1/admin/company-profile/seal

Document Templates:
- GET /api/v1/admin/document-templates
- POST /api/v1/admin/document-templates
- GET /api/v1/admin/document-templates/{templateId}
- PATCH /api/v1/admin/document-templates/{templateId}
- DELETE /api/v1/admin/document-templates/{templateId}
- GET /api/v1/admin/document-templates/{templateId}/versions
- POST /api/v1/admin/document-templates/{templateId}/versions
- GET /api/v1/admin/template-versions/{versionId}
- PATCH /api/v1/admin/template-versions/{versionId}
- POST /api/v1/admin/template-versions/{versionId}/review
- POST /api/v1/admin/template-versions/{versionId}/publish
- POST /api/v1/admin/template-versions/{versionId}/deprecate
- POST /api/v1/admin/template-versions/{versionId}/rollback
- GET /api/v1/admin/template-versions/{versionId}/sections
- POST /api/v1/admin/template-versions/{versionId}/sections
- PATCH /api/v1/admin/template-sections/{sectionId}
- DELETE /api/v1/admin/template-sections/{sectionId}
- GET /api/v1/admin/template-versions/{versionId}/variables
- POST /api/v1/admin/template-versions/{versionId}/variables/extract
- PATCH /api/v1/admin/template-variables/{variableId}
- DELETE /api/v1/admin/template-variables/{variableId}
- POST /api/v1/admin/template-versions/{versionId}/preview
- POST /api/v1/admin/template-versions/{versionId}/validate
- GET /api/v1/admin/template-versions/{versionId}/impact

Checklist Templates:
- GET /api/v1/admin/checklist-templates
- POST /api/v1/admin/checklist-templates
- GET /api/v1/admin/checklist-templates/{templateId}
- PATCH /api/v1/admin/checklist-templates/{templateId}
- POST /api/v1/admin/checklist-templates/{templateId}/clone
- POST /api/v1/admin/checklist-templates/{templateId}/publish

Phrase / Legal Clause Library:
- GET /api/v1/admin/phrases
- POST /api/v1/admin/phrases
- PATCH /api/v1/admin/phrases/{phraseId}
- POST /api/v1/admin/phrases/{phraseId}/publish
- GET /api/v1/admin/legal-clauses
- POST /api/v1/admin/legal-clauses
- PATCH /api/v1/admin/legal-clauses/{clauseId}
- POST /api/v1/admin/legal-clauses/{clauseId}/request-review
- POST /api/v1/admin/legal-clauses/{clauseId}/approve
- POST /api/v1/admin/legal-clauses/{clauseId}/publish

Prompt Repository:
- GET /api/v1/admin/prompts
- POST /api/v1/admin/prompts
- GET /api/v1/admin/prompts/{promptId}
- PATCH /api/v1/admin/prompts/{promptId}
- DELETE /api/v1/admin/prompts/{promptId}
- GET /api/v1/admin/prompts/{promptId}/versions
- POST /api/v1/admin/prompts/{promptId}/versions
- GET /api/v1/admin/prompt-versions/{versionId}
- PATCH /api/v1/admin/prompt-versions/{versionId}
- POST /api/v1/admin/prompt-versions/{versionId}/run
- POST /api/v1/admin/prompt-versions/{versionId}/review
- POST /api/v1/admin/prompt-versions/{versionId}/publish
- POST /api/v1/admin/prompt-versions/{versionId}/rollback
- GET /api/v1/admin/prompts/{promptId}/test-cases
- POST /api/v1/admin/prompts/{promptId}/test-cases
- PATCH /api/v1/admin/prompt-test-cases/{testCaseId}
- DELETE /api/v1/admin/prompt-test-cases/{testCaseId}
- POST /api/v1/admin/prompt-versions/{versionId}/run-test-cases

Policies / Audit:
- GET /api/v1/admin/webhard-policies
- PATCH /api/v1/admin/webhard-policies
- GET /api/v1/admin/mail-templates
- POST /api/v1/admin/mail-templates
- GET /api/v1/admin/approval-templates
- POST /api/v1/admin/approval-templates
- GET /api/v1/admin/signature-assets
- POST /api/v1/admin/signature-assets
- GET /api/v1/admin/audit-logs
- GET /api/v1/admin/audit-logs/{auditLogId}

Required frontend routes:
- /admin
- /admin/users
- /admin/roles
- /admin/company
- /admin/document-templates
- /admin/document-templates/[templateId]
- /admin/document-templates/[templateId]/versions
- /admin/document-templates/[templateId]/sections
- /admin/document-templates/[templateId]/variables
- /admin/document-templates/[templateId]/preview
- /admin/checklist-templates
- /admin/phrase-library
- /admin/legal-clauses
- /admin/prompts
- /admin/prompts/[promptId]
- /admin/prompts/[promptId]/versions
- /admin/prompts/[promptId]/test-cases
- /admin/prompts/[promptId]/run
- /admin/codex-prompts
- /admin/design-prompts
- /admin/reverse-prompts
- /admin/mail-templates
- /admin/webhard-policies
- /admin/approval-templates
- /admin/signature-assets
- /admin/audit-logs

Business requirements:
1. Published template versions cannot be edited directly. Create a new version instead.
2. Published prompt versions cannot be edited directly. Create a new version instead.
3. Template publish requires validation, sample preview, and no required missing variables.
4. Service AI prompt publish requires inputSchema, outputSchema, guardrails, forbiddenBehaviors, and at least one executed test case.
5. Legal clauses require special permission and approval before publishing.
6. Role permission changes must create AdminAuditLog.
7. Template publish, rollback, deprecate must create AdminAuditLog.
8. Prompt publish, rollback, deprecate must create AdminAuditLog.
9. Template variable extraction should detect variables, loops, and conditions.
10. Prompt run console must validate output schema and save PromptRunLog.
11. Template impact endpoint must show which document types and existing drafts could be affected.
12. Seed default document templates and prompt templates for all previous modules 01~12.

Validation:
1. templateKey and promptKey must be unique.
2. template version status transitions must be valid.
3. prompt version status transitions must be valid.
4. legal clause update requires changeReason.
5. company seal upload requires admin permission.
6. rollback requires target version and reason.
7. publish cannot happen if validation errors exist.

Seed data:
- Roles: super_admin, admin, template_manager, prompt_manager, legal_text_manager, engineer, writer, contract_manager, field_inspector, viewer
- Document templates: technical_service_contract, safety_health_ledger_inspection_report, photo_ledger, safety_cost_usage, safety_management_plan, safety_health_ledger, mail_submission, mail_action_request
- Prompt templates: project-info-extraction, contract-draft-generation, inspection-schedule-generation, safety-report-generation, checklist-summary-and-finding-candidate, finding-action-photo-ledger, safety-cost-usage-comment, safety-management-plan-generation, safety-health-ledger-generation, webhard-file-classification, mail-draft-and-classification, approval-submission-readiness, template-variable-mapping-and-prompt-governance

Tests:
- test_admin_user_create_success
- test_role_permission_update_creates_audit_log
- test_company_profile_update_success
- test_document_template_create_success
- test_template_version_extracts_variables
- test_template_version_publish_requires_validation
- test_published_template_version_cannot_be_edited
- test_template_preview_generates_missing_fields
- test_checklist_template_clone_and_publish
- test_phrase_create_and_publish
- test_legal_clause_update_requires_permission
- test_legal_clause_publish_requires_approval
- test_prompt_template_create_success
- test_prompt_version_requires_schema_for_service_ai
- test_prompt_run_logs_output
- test_prompt_test_case_execution
- test_prompt_publish_requires_test_case_run
- test_published_prompt_version_cannot_be_edited
- test_template_rollback_creates_audit_log
- test_prompt_rollback_creates_audit_log
- test_audit_log_filter_by_target_type

Deliverables:
- Backend models and repositories
- Backend API routes and services
- Template validation service
- Template preview service
- Prompt run/test service
- Permission guard helpers
- Frontend admin pages and components
- API client functions
- Type definitions
- Tests
- README note for this module
```
