# 02. Tech Markdown — 관리자/템플릿/프롬프트

## 1. Frontend Routes

```text
/admin
/admin/users
/admin/users/[userId]
/admin/roles
/admin/permissions
/admin/company
/admin/document-templates
/admin/document-templates/new
/admin/document-templates/[templateId]
/admin/document-templates/[templateId]/versions
/admin/document-templates/[templateId]/sections
/admin/document-templates/[templateId]/variables
/admin/document-templates/[templateId]/preview
/admin/checklist-templates
/admin/checklist-templates/[templateId]
/admin/phrase-library
/admin/legal-clauses
/admin/prompts
/admin/prompts/new
/admin/prompts/[promptId]
/admin/prompts/[promptId]/versions
/admin/prompts/[promptId]/test-cases
/admin/prompts/[promptId]/run
/admin/codex-prompts
/admin/design-prompts
/admin/reverse-prompts
/admin/mail-templates
/admin/webhard-policies
/admin/approval-templates
/admin/signature-assets
/admin/audit-logs
```

## 2. Frontend Components

```text
AdminDashboardPage
UserManagementPage
RolePermissionPage
CompanyProfilePage
DocumentTemplateListPage
DocumentTemplateEditorPage
TemplateVersionHistoryPage
TemplateVariableManagerPage
TemplatePreviewPage
ChecklistTemplateAdminPage
PhraseLibraryPage
LegalClauseManagerPage
PromptRepositoryPage
PromptEditorPage
PromptVersionHistoryPage
PromptTestCasePage
PromptRunConsolePage
CodexPromptRepositoryPage
DesignPromptRepositoryPage
ReversePromptRepositoryPage
MailTemplatePage
WebhardPolicyPage
ApprovalTemplatePage
SignatureAssetPage
AuditLogPage

AdminSidebar
AdminSectionHeader
AdminStatCard
PermissionMatrix
UserRoleSelector
CompanyProfileForm
TemplateTypeBadge
TemplateStatusBadge
TemplateSectionTree
TemplateSectionEditor
TemplateVariableTable
TemplateLoopEditor
TemplateConditionBuilder
TemplatePreviewPane
TemplateImpactPanel
PhraseTable
LegalClauseApprovalPanel
PromptTypeBadge
PromptStatusBadge
PromptSchemaEditor
PromptMessageEditor
PromptGuardrailEditor
PromptTestCaseTable
PromptRunResultPanel
PromptReleaseChecklist
AuditLogTable
VersionDiffViewer
RollbackButton
```

## 3. Backend APIs

### Users / Roles

```text
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/{userId}
PATCH  /api/v1/admin/users/{userId}
DELETE /api/v1/admin/users/{userId}

GET    /api/v1/admin/roles
POST   /api/v1/admin/roles
PATCH  /api/v1/admin/roles/{roleId}
DELETE /api/v1/admin/roles/{roleId}
GET    /api/v1/admin/permissions
PATCH  /api/v1/admin/roles/{roleId}/permissions
```

### Company Profile

```text
GET   /api/v1/admin/company-profile
PATCH /api/v1/admin/company-profile
POST  /api/v1/admin/company-profile/logo
POST  /api/v1/admin/company-profile/seal
```

### Document Templates

```text
GET    /api/v1/admin/document-templates
POST   /api/v1/admin/document-templates
GET    /api/v1/admin/document-templates/{templateId}
PATCH  /api/v1/admin/document-templates/{templateId}
DELETE /api/v1/admin/document-templates/{templateId}

GET    /api/v1/admin/document-templates/{templateId}/versions
POST   /api/v1/admin/document-templates/{templateId}/versions
GET    /api/v1/admin/template-versions/{versionId}
PATCH  /api/v1/admin/template-versions/{versionId}
POST   /api/v1/admin/template-versions/{versionId}/review
POST   /api/v1/admin/template-versions/{versionId}/publish
POST   /api/v1/admin/template-versions/{versionId}/deprecate
POST   /api/v1/admin/template-versions/{versionId}/rollback

GET    /api/v1/admin/template-versions/{versionId}/sections
POST   /api/v1/admin/template-versions/{versionId}/sections
PATCH  /api/v1/admin/template-sections/{sectionId}
DELETE /api/v1/admin/template-sections/{sectionId}

GET    /api/v1/admin/template-versions/{versionId}/variables
POST   /api/v1/admin/template-versions/{versionId}/variables/extract
PATCH  /api/v1/admin/template-variables/{variableId}
DELETE /api/v1/admin/template-variables/{variableId}

POST   /api/v1/admin/template-versions/{versionId}/preview
POST   /api/v1/admin/template-versions/{versionId}/validate
GET    /api/v1/admin/template-versions/{versionId}/impact
```

### Checklist Templates

```text
GET    /api/v1/admin/checklist-templates
POST   /api/v1/admin/checklist-templates
GET    /api/v1/admin/checklist-templates/{templateId}
PATCH  /api/v1/admin/checklist-templates/{templateId}
POST   /api/v1/admin/checklist-templates/{templateId}/clone
POST   /api/v1/admin/checklist-templates/{templateId}/publish
GET    /api/v1/admin/checklist-templates/{templateId}/items
POST   /api/v1/admin/checklist-templates/{templateId}/items
PATCH  /api/v1/admin/checklist-items/{itemId}
POST   /api/v1/admin/checklist-templates/{templateId}/items/reorder
```

### Phrase / Legal Clause Library

```text
GET    /api/v1/admin/phrases
POST   /api/v1/admin/phrases
PATCH  /api/v1/admin/phrases/{phraseId}
POST   /api/v1/admin/phrases/{phraseId}/publish

GET    /api/v1/admin/legal-clauses
POST   /api/v1/admin/legal-clauses
PATCH  /api/v1/admin/legal-clauses/{clauseId}
POST   /api/v1/admin/legal-clauses/{clauseId}/request-review
POST   /api/v1/admin/legal-clauses/{clauseId}/approve
POST   /api/v1/admin/legal-clauses/{clauseId}/publish
```

### Prompt Repository

```text
GET    /api/v1/admin/prompts
POST   /api/v1/admin/prompts
GET    /api/v1/admin/prompts/{promptId}
PATCH  /api/v1/admin/prompts/{promptId}
DELETE /api/v1/admin/prompts/{promptId}

GET    /api/v1/admin/prompts/{promptId}/versions
POST   /api/v1/admin/prompts/{promptId}/versions
GET    /api/v1/admin/prompt-versions/{versionId}
PATCH  /api/v1/admin/prompt-versions/{versionId}
POST   /api/v1/admin/prompt-versions/{versionId}/run
POST   /api/v1/admin/prompt-versions/{versionId}/review
POST   /api/v1/admin/prompt-versions/{versionId}/publish
POST   /api/v1/admin/prompt-versions/{versionId}/rollback

GET    /api/v1/admin/prompts/{promptId}/test-cases
POST   /api/v1/admin/prompts/{promptId}/test-cases
PATCH  /api/v1/admin/prompt-test-cases/{testCaseId}
DELETE /api/v1/admin/prompt-test-cases/{testCaseId}
POST   /api/v1/admin/prompt-versions/{versionId}/run-test-cases
```

### Policies / Audit

```text
GET   /api/v1/admin/webhard-policies
PATCH /api/v1/admin/webhard-policies
GET   /api/v1/admin/mail-templates
POST  /api/v1/admin/mail-templates
GET   /api/v1/admin/approval-templates
POST  /api/v1/admin/approval-templates
GET   /api/v1/admin/signature-assets
POST  /api/v1/admin/signature-assets
GET   /api/v1/admin/audit-logs
GET   /api/v1/admin/audit-logs/{auditLogId}
```

## 4. Data Models

### AdminUser

```ts
type AdminUser = {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  status: 'active' | 'invited' | 'disabled' | 'deleted'
  roleIds: string[]
  projectAccessPolicy: 'all' | 'assigned_only' | 'none'
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}
```

### Role / Permission

```ts
type Role = {
  id: string
  key: string
  name: string
  description?: string
  permissionKeys: string[]
  systemRole: boolean
  createdAt: string
  updatedAt: string
}

type Permission = {
  key: string
  group: 'project' | 'document' | 'template' | 'prompt' | 'admin' | 'file' | 'mail' | 'approval'
  label: string
  description?: string
}
```

### CompanyProfile

```ts
type CompanyProfile = {
  id: string
  companyName: string
  representativeName?: string
  businessNumber?: string
  address?: string
  phone?: string
  email?: string
  logoFileId?: string
  sealFileId?: string
  engineerLicenseText?: string
  defaultMailFooter?: string
  defaultDocumentFooter?: string
  updatedAt: string
}
```

### DocumentTemplate / TemplateVersion

```ts
type DocumentTemplateType =
  | 'technical_service_contract'
  | 'estimate'
  | 'safety_health_ledger_inspection_report'
  | 'safety_management_plan'
  | 'safety_health_ledger'
  | 'photo_ledger'
  | 'safety_cost_usage'
  | 'mail_submission'
  | 'mail_action_request'
  | 'approval_checklist'

type TemplateStatus = 'draft' | 'review' | 'published' | 'deprecated' | 'archived'

type DocumentTemplate = {
  id: string
  templateKey: string
  name: string
  documentType: DocumentTemplateType
  description?: string
  currentPublishedVersionId?: string
  status: TemplateStatus
  createdAt: string
  updatedAt: string
}

type TemplateVersion = {
  id: string
  templateId: string
  versionNo: number
  versionName?: string
  status: TemplateStatus
  bodyFormat: 'markdown' | 'html' | 'hwpx_xml' | 'docx_template' | 'json_schema'
  body: string
  variableSchema: Record<string, unknown>
  outputFormats: Array<'pdf' | 'hwpx' | 'docx' | 'markdown' | 'json'>
  createdBy: string
  reviewedBy?: string
  publishedBy?: string
  publishedAt?: string
  changeSummary?: string
  createdAt: string
  updatedAt: string
}
```

### TemplateSection / Variable / Loop / Condition

```ts
type TemplateSection = {
  id: string
  templateVersionId: string
  sectionKey: string
  title: string
  displayOrder: number
  required: boolean
  body: string
  sourceModels: string[]
}

type TemplateVariable = {
  id: string
  templateVersionId: string
  variableKey: string
  label: string
  dataPath: string
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'file' | 'array' | 'object'
  required: boolean
  defaultValue?: unknown
  exampleValue?: unknown
  sourceModel?: string
  ownerSpecific: boolean
  description?: string
}

type TemplateLoop = {
  id: string
  templateVersionId: string
  loopKey: string
  sourcePath: string
  itemAlias: string
  emptyPolicy: 'hide' | 'show_empty_table' | 'show_missing_warning'
}

type TemplateCondition = {
  id: string
  templateVersionId: string
  conditionKey: string
  expression: string
  description?: string
}
```

### Phrase / LegalClause

```ts
type Phrase = {
  id: string
  phraseKey: string
  type: 'standard_phrase' | 'contract_clause' | 'mail_phrase' | 'review_warning_text'
  title: string
  body: string
  status: TemplateStatus
  tags: string[]
  createdAt: string
  updatedAt: string
}

type LegalClause = {
  id: string
  clauseKey: string
  title: string
  body: string
  sourceName?: string
  sourceUrl?: string
  effectiveDate?: string
  status: TemplateStatus
  reviewRequired: boolean
  reviewedBy?: string
  approvedBy?: string
  changeReason?: string
  createdAt: string
  updatedAt: string
}
```

### PromptTemplate / PromptVersion

```ts
type PromptType =
  | 'service_ai'
  | 'codex_implementation'
  | 'design_prompt'
  | 'reverse_prompt'
  | 'qa_prompt'
  | 'all_in_one_context'

type PromptTemplate = {
  id: string
  promptKey: string
  name: string
  promptType: PromptType
  featureId?: string
  description?: string
  currentPublishedVersionId?: string
  status: TemplateStatus
  createdAt: string
  updatedAt: string
}

type PromptVersion = {
  id: string
  promptId: string
  versionNo: number
  status: TemplateStatus
  systemMessage?: string
  userMessageTemplate: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  guardrails: string[]
  forbiddenBehaviors: string[]
  linkedTemplateVersionIds: string[]
  createdBy: string
  reviewedBy?: string
  publishedBy?: string
  publishedAt?: string
  changeSummary?: string
  createdAt: string
  updatedAt: string
}
```

### PromptTestCase / PromptRunLog

```ts
type PromptTestCase = {
  id: string
  promptId: string
  name: string
  inputFixture: Record<string, unknown>
  expectedChecks: Array<{
    checkType: 'json_schema' | 'contains' | 'not_contains' | 'field_equals' | 'custom_rule'
    path?: string
    value?: unknown
    description: string
  }>
  createdAt: string
  updatedAt: string
}

type PromptRunLog = {
  id: string
  promptVersionId: string
  testCaseId?: string
  input: Record<string, unknown>
  output: Record<string, unknown> | string
  status: 'passed' | 'failed' | 'warning' | 'manual_review'
  evaluationSummary?: string
  tokenUsage?: Record<string, number>
  createdBy?: string
  createdAt: string
}
```

### AdminAuditLog

```ts
type AdminAuditLog = {
  id: string
  actorId?: string
  action: string
  targetType: string
  targetId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  reason?: string
  ipAddress?: string
  createdAt: string
}
```

## 5. Validation Rules

### DocumentTemplate

- templateKey는 unique여야 한다.
- published 상태가 되려면 최소 1개 TemplateVersion이 published여야 한다.
- TemplateVersion publish 전 variables validation을 통과해야 한다.
- required variable은 dataPath를 가져야 한다.
- ownerSpecific variable은 발주처별 문서에서만 사용 가능하다.
- published TemplateVersion은 직접 수정할 수 없다. 새 version을 생성해야 한다.

### PromptTemplate

- promptKey는 unique여야 한다.
- published PromptVersion은 직접 수정할 수 없다.
- service_ai prompt는 inputSchema와 outputSchema가 필수다.
- 법령/금액/날짜 관련 프롬프트는 forbiddenBehaviors를 가져야 한다.
- publish 전 최소 1개 테스트케이스를 실행해야 한다.

### LegalClause

- legal_text_manager 또는 super_admin만 수정할 수 있다.
- 변경 사유가 필수다.
- publish 전 승인자가 필요하다.
- 기존 문서에는 자동 소급 적용하지 않는다.

### Audit

다음 작업은 반드시 AdminAuditLog를 남긴다.

```text
role permission 변경
template publish / rollback / deprecate
prompt publish / rollback / deprecate
legal clause 변경
company seal 변경
signature asset 업로드/폐기
```

## 6. Service Rules

### Template Publish Flow

```text
1. TemplateVersion validate
2. variable schema 확인
3. loop/condition syntax 확인
4. sample preview 생성
5. required test 통과 확인
6. status = published
7. 기존 published version은 deprecated optional
8. AdminAuditLog 기록
```

### Prompt Publish Flow

```text
1. PromptVersion validate
2. input/output schema 확인
3. guardrails 확인
4. forbiddenBehaviors 확인
5. testCase 실행
6. 결과 통과 확인
7. status = published
8. AdminAuditLog 기록
```

### Template Variable Extraction

```text
template body 입력
→ {{variable}} 추출
→ {{#each loop}} 추출
→ {{#if condition}} 추출
→ dataPath 후보 추천
→ sourceModel 추천
→ required 여부 추천
→ missingVariables 반환
```

### Prompt Run Console

```text
promptVersion 선택
→ input fixture 입력
→ 실행
→ output schema validate
→ forbidden behavior check
→ 결과 저장
→ PromptRunLog 생성
```

## 7. Seed Data

### Default Document Templates

```text
technical_service_contract
safety_health_ledger_inspection_report
photo_ledger
safety_cost_usage
safety_management_plan
safety_health_ledger
mail_submission
mail_action_request
```

### Default Prompt Templates

```text
project-info-extraction
contract-draft-generation
inspection-schedule-generation
safety-report-generation
checklist-summary-and-finding-candidate
finding-action-photo-ledger
safety-cost-usage-comment
safety-management-plan-generation
safety-health-ledger-generation
webhard-file-classification
mail-draft-and-classification
approval-submission-readiness
template-variable-mapping-and-prompt-governance
```

## 8. Tests

```text
test_admin_user_create_success
test_role_permission_update_creates_audit_log
test_company_profile_update_success
test_document_template_create_success
test_template_version_extracts_variables
test_template_version_publish_requires_validation
test_published_template_version_cannot_be_edited
test_template_preview_generates_missing_fields
test_checklist_template_clone_and_publish
test_phrase_create_and_publish
test_legal_clause_update_requires_permission
test_legal_clause_publish_requires_approval
test_prompt_template_create_success
test_prompt_version_requires_schema_for_service_ai
test_prompt_run_logs_output
test_prompt_test_case_execution
test_prompt_publish_requires_test_case_run
test_published_prompt_version_cannot_be_edited
test_template_rollback_creates_audit_log
test_prompt_rollback_creates_audit_log
test_audit_log_filter_by_target_type
```
