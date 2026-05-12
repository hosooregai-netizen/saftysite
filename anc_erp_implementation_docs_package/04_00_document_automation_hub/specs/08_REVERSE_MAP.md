# 08. Reverse Map — 표준서식 자동화 허브

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 표준서식 자동화 허브 | `/document-bundles/[bundleId]` | `StandardFormStatusMatrix` | `GET /api/v1/document-bundles/{bundleId}` | `DocumentBundle, StandardFormDefinition, StandardFormInstance` | `standard-form-bundle-planner` | `document_hub_tests` |
