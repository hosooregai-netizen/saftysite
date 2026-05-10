# 08. Reverse Prompt — 관리자/템플릿/프롬프트

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
관리자/템플릿/프롬프트

기능 설명:
관리자/템플릿/프롬프트는 사용자/권한, 회사정보, 문서 템플릿, 체크리스트 템플릿, 표준 문구, 법령/고시 문구, 서비스 AI 프롬프트, Codex 구현 프롬프트, 디자인 프롬프트, Reverse Prompt, 메일 템플릿, 웹하드 정책, 결재선 템플릿, 감사로그를 관리하는 운영 모듈이다.

업무 맥락:
- A&C ERP의 문서 자동화는 DocumentTemplate과 PromptTemplate의 버전에 의존한다.
- 공사안전보건대장 이행확인 보고서, 안전관리계획서, 안전보건대장, 사진대지는 모두 템플릿 버전으로 생성되어야 한다.
- 서비스 AI 실행 결과는 promptVersionId를 남겨야 한다.
- published 템플릿/프롬프트는 직접 수정하면 안 되고 새 버전을 만들어야 한다.
- 법령/고시 문구는 별도 권한과 승인, 감사로그가 필요하다.
- Codex 구현 프롬프트와 Reverse Prompt도 기능별로 보관되어야 한다.
- 발행 전 preview, validation, test case 실행이 필요하다.

입력:
{
  "featureName": "관리자/템플릿/프롬프트",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "securityRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `admin.template.prompt`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 보고서 자동화
    - 체크리스트
    - 지적사항/사진대지
    - 산업안전보건관리비
    - 안전관리계획서
    - 안전보건대장
    - 웹하드
    - 메일함
    - 결재/제출
    - 대시보드/통계

출력 JSON:
{
  "featureId": "admin.template.prompt",
  "featureName": "관리자/템플릿/프롬프트",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
- /admin
- /admin/users
- /admin/roles
- /admin/company
- /admin/document-templates
- /admin/document-templates/[templateId]
- /admin/document-templates/[templateId]/versions
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

반드시 포함할 models:
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

반드시 포함할 prompts:
- template-variable-mapping-and-prompt-governance
- admin-template-prompt implementation prompt
- admin-template-prompt design prompt

반드시 포함할 tests:
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

주의:
- published 템플릿은 직접 수정할 수 없다.
- published 프롬프트는 직접 수정할 수 없다.
- 법령/고시 문구는 권한과 승인 없이 수정할 수 없다.
- 템플릿 변경은 기존 생성 문서에 자동 소급 적용하면 안 된다.
- 문서 생성 시 templateVersionId를 남겨야 한다.
- AI 실행 시 promptVersionId를 남겨야 한다.
- 프롬프트 발행 전 테스트케이스 실행이 필요하다.
- 위험 작업은 AdminAuditLog를 반드시 남겨야 한다.
```
