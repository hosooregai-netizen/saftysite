# 04 FRONTEND IMPLEMENTATION — 관리자/템플릿/프롬프트

Implement `관리자/템플릿/프롬프트`.

## Trace

- Route: `/admin/prompts`
- Component: `PromptEditor`
- API: `GET /api/v1/admin/prompt-templates`
- Models: `DocumentTemplate, PromptTemplate, ChecklistTemplate, LegalTextTemplate, AdminAuditLog`
- Prompt: `admin-prompt-quality-check`
- Tests: `admin_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
