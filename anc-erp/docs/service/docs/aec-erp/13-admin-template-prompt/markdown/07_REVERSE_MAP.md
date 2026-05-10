# 07. Reverse Map — 관리자/템플릿/프롬프트

## 1. Feature

```yaml
featureId: admin.template.prompt
featureName: 관리자/템플릿/프롬프트
priority: P1
module: admin-template-prompt
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 관리자 대시보드 | `/admin` | 설정/템플릿/프롬프트 현황 |
| 사용자 관리 | `/admin/users` | 사용자 생성/상태/역할 관리 |
| 권한 관리 | `/admin/roles` | 역할별 permission matrix |
| 회사정보 | `/admin/company` | 회사명, 로고, 직인, footer |
| 문서 템플릿 목록 | `/admin/document-templates` | 문서 템플릿 조회/필터 |
| 문서 템플릿 편집 | `/admin/document-templates/[templateId]` | 본문/섹션/변수 편집 |
| 템플릿 버전 | `/admin/document-templates/[templateId]/versions` | version history/diff/rollback |
| 템플릿 변수 | `/admin/document-templates/[templateId]/variables` | 변수/dataPath/sourceModel 관리 |
| 템플릿 preview | `/admin/document-templates/[templateId]/preview` | 샘플 데이터 미리보기 |
| 체크리스트 템플릿 | `/admin/checklist-templates` | 점검표 항목/버전 관리 |
| 표준 문구 | `/admin/phrase-library` | 표준 문구/메일 문구 관리 |
| 법령 문구 | `/admin/legal-clauses` | 법령/고시 문구 승인 관리 |
| 프롬프트 저장소 | `/admin/prompts` | promptKey/type/version 관리 |
| 프롬프트 편집 | `/admin/prompts/[promptId]` | message/schema/guardrail 편집 |
| 프롬프트 테스트 | `/admin/prompts/[promptId]/test-cases` | 테스트케이스 관리 |
| Prompt Run | `/admin/prompts/[promptId]/run` | 샘플 실행/평가 |
| Codex 프롬프트 | `/admin/codex-prompts` | 구현 프롬프트 저장소 |
| 디자인 프롬프트 | `/admin/design-prompts` | 기능별 디자인 프롬프트 |
| Reverse Prompt | `/admin/reverse-prompts` | 기능별 역추적 프롬프트 |
| 메일 템플릿 | `/admin/mail-templates` | 제출/조치요청 메일 템플릿 |
| 웹하드 정책 | `/admin/webhard-policies` | 기본 폴더/공유 정책 |
| 결재선 템플릿 | `/admin/approval-templates` | 문서 유형별 결재선 |
| 서명/직인 | `/admin/signature-assets` | 직인/서명 자산 관리 |
| 감사로그 | `/admin/audit-logs` | 관리자 작업 이력 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/admin` | AdminStatCard, AdminRecentActivity, AdminWarningList |
| `/admin/users` | UserTable, UserRoleSelector, UserStatusBadge |
| `/admin/roles` | PermissionMatrix, RoleForm, PermissionGroupTabs |
| `/admin/company` | CompanyProfileForm, LogoUploader, SealUploader |
| `/admin/document-templates` | TemplateTable, TemplateTypeBadge, TemplateStatusBadge |
| `/admin/document-templates/[templateId]` | TemplateSectionTree, TemplateSectionEditor, TemplatePreviewPane |
| `/admin/document-templates/[templateId]/variables` | TemplateVariableTable, TemplateLoopEditor, TemplateConditionBuilder |
| `/admin/document-templates/[templateId]/versions` | VersionDiffViewer, RollbackButton, PublishChecklist |
| `/admin/checklist-templates` | ChecklistTemplateTable, ChecklistItemEditor, ReportMappingEditor |
| `/admin/phrase-library` | PhraseTable, PhraseEditor, UsageTemplateList |
| `/admin/legal-clauses` | LegalClauseTable, LegalClauseApprovalPanel, ImpactPanel |
| `/admin/prompts` | PromptTable, PromptTypeBadge, PromptStatusBadge |
| `/admin/prompts/[promptId]` | PromptMessageEditor, PromptSchemaEditor, PromptGuardrailEditor |
| `/admin/prompts/[promptId]/test-cases` | PromptTestCaseTable, PromptExpectedCheckEditor |
| `/admin/prompts/[promptId]/run` | PromptRunConsole, PromptRunResultPanel |
| `/admin/audit-logs` | AuditLogTable, VersionDiffViewer |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| UserTable | GET `/api/v1/admin/users` |
| UserRoleSelector | PATCH `/api/v1/admin/users/{userId}` |
| PermissionMatrix | GET `/api/v1/admin/permissions`, PATCH `/api/v1/admin/roles/{roleId}/permissions` |
| CompanyProfileForm | GET/PATCH `/api/v1/admin/company-profile` |
| LogoUploader | POST `/api/v1/admin/company-profile/logo` |
| SealUploader | POST `/api/v1/admin/company-profile/seal` |
| TemplateTable | GET `/api/v1/admin/document-templates` |
| TemplateSectionEditor | PATCH `/api/v1/admin/template-sections/{sectionId}` |
| TemplateVariableTable | GET `/api/v1/admin/template-versions/{versionId}/variables` |
| TemplatePreviewPane | POST `/api/v1/admin/template-versions/{versionId}/preview` |
| PublishChecklist | POST `/api/v1/admin/template-versions/{versionId}/validate`, POST `/publish` |
| PromptTable | GET `/api/v1/admin/prompts` |
| PromptMessageEditor | PATCH `/api/v1/admin/prompt-versions/{versionId}` |
| PromptRunConsole | POST `/api/v1/admin/prompt-versions/{versionId}/run` |
| PromptTestCaseTable | GET/POST `/api/v1/admin/prompts/{promptId}/test-cases` |
| LegalClauseApprovalPanel | POST `/request-review`, POST `/approve`, POST `/publish` |
| AuditLogTable | GET `/api/v1/admin/audit-logs` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| `/admin/users` | AdminUser, Role |
| `/admin/roles` | Role, Permission, AdminAuditLog |
| `/admin/company-profile` | CompanyProfile, FileAsset, AdminAuditLog |
| `/admin/document-templates` | DocumentTemplate |
| `/admin/template-versions` | TemplateVersion, TemplateSection, TemplateVariable |
| `/template-versions/{id}/preview` | TemplatePreviewRun, MissingField |
| `/template-versions/{id}/publish` | TemplateVersion, AdminAuditLog |
| `/admin/checklist-templates` | ChecklistTemplate, ChecklistItem |
| `/admin/phrases` | Phrase, AdminAuditLog |
| `/admin/legal-clauses` | LegalClause, AdminAuditLog |
| `/admin/prompts` | PromptTemplate, PromptVersion |
| `/prompt-versions/{id}/run` | PromptVersion, PromptRunLog |
| `/prompt-versions/{id}/run-test-cases` | PromptTestCase, PromptRunLog |
| `/admin/audit-logs` | AdminAuditLog |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| DocumentTemplate | template-variable-mapping-and-prompt-governance |
| TemplateVersion | template-variable-mapping-and-prompt-governance |
| TemplateVariable | template-variable-mapping-and-prompt-governance |
| TemplateLoop | template-variable-mapping-and-prompt-governance |
| TemplateCondition | template-variable-mapping-and-prompt-governance |
| PromptTemplate | template-variable-mapping-and-prompt-governance |
| PromptVersion | template-variable-mapping-and-prompt-governance |
| PromptTestCase | template-variable-mapping-and-prompt-governance |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 사용자 생성 | test_admin_user_create_success |
| 권한 변경 | test_role_permission_update_creates_audit_log |
| 회사정보 수정 | test_company_profile_update_success |
| 템플릿 생성 | test_document_template_create_success |
| 변수 추출 | test_template_version_extracts_variables |
| 템플릿 발행 검증 | test_template_version_publish_requires_validation |
| published 편집 방지 | test_published_template_version_cannot_be_edited |
| 템플릿 미리보기 | test_template_preview_generates_missing_fields |
| 체크리스트 발행 | test_checklist_template_clone_and_publish |
| 표준 문구 발행 | test_phrase_create_and_publish |
| 법령 권한 | test_legal_clause_update_requires_permission |
| 법령 승인 | test_legal_clause_publish_requires_approval |
| 프롬프트 생성 | test_prompt_template_create_success |
| 프롬프트 schema | test_prompt_version_requires_schema_for_service_ai |
| 프롬프트 실행로그 | test_prompt_run_logs_output |
| 테스트케이스 실행 | test_prompt_test_case_execution |
| 프롬프트 발행 검증 | test_prompt_publish_requires_test_case_run |
| published 프롬프트 편집 방지 | test_published_prompt_version_cannot_be_edited |
| 템플릿 롤백 | test_template_rollback_creates_audit_log |
| 프롬프트 롤백 | test_prompt_rollback_creates_audit_log |
| 감사로그 필터 | test_audit_log_filter_by_target_type |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | project-info-extraction prompt, project form schema |
| 계약/견적 | contract template, payment phrase, contract prompt |
| 점검회차/일정 | schedule-generation prompt, task template |
| 보고서 자동화 | DocumentTemplate, TemplateVersion, safety-report prompt |
| 체크리스트 | ChecklistTemplate, ChecklistItem, report mapping |
| 사진대지 | photo_ledger template, caption prompt |
| 산업안전보건관리비 | safety_cost template, comment prompt |
| 안전관리계획서 | plan template, risk phrase library |
| 안전보건대장 | ledger template, risk register mapping |
| 웹하드 | folder policy, file-classification prompt |
| 메일함 | mail templates, mail-draft prompt |
| 결재/제출 | approval templates, signature assets, submission checklist |
| 대시보드/통계 | admin status, template/prompt warnings |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| published 템플릿 직접 수정 | 새 버전 생성만 허용 |
| 프롬프트 변경으로 문서 품질 저하 | 테스트케이스 통과 전 publish 차단 |
| 법령 문구 임의 변경 | legal_text_manager 권한과 승인 workflow |
| 기존 문서가 새 템플릿 변경으로 깨짐 | 문서 생성 시 templateVersionId snapshot 저장 |
| 변수명 중복/불일치 | variable registry와 validation |
| 발주처별 변수 누락 | ownerSpecific flag와 preview warning |
| Codex 프롬프트와 Reverse Map 불일치 | prompt featureId와 Reverse Map 연결 |
| 감사로그 누락 | 위험 작업 API에 audit middleware 적용 |
