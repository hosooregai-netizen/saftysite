# 01 READ AND PLAN — 표준서식 자동화 허브

Implement `표준서식 자동화 허브`.

## Trace

- Route: `/document-bundles/[bundleId]`
- Component: `StandardFormStatusMatrix`
- API: `GET /api/v1/document-bundles/{bundleId}`
- Models: `DocumentBundle, StandardFormDefinition, StandardFormInstance`
- Prompt: `standard-form-bundle-planner`
- Tests: `document_hub_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.
