# 04_00_document_automation_hub — 표준서식 자동화 허브

Priority: `P0`

## Trace

- Route: `/document-bundles/[bundleId]`
- Component: `StandardFormStatusMatrix`
- API: `GET /api/v1/document-bundles/{bundleId}`
- Model: `DocumentBundle, StandardFormDefinition, StandardFormInstance`
- Prompt: `standard-form-bundle-planner`
- Tests: `document_hub_tests`
