# Reverse Map: Report Workspace

## 기능 목적

보고서 작성 워크스페이스는 새 보고서 생성, 사진 업로드, AI 초안 생성, 검토, PDF/HWPX 출력까지 이어지는 핵심 업무 흐름이다.

## Route map

| Route | 역할 |
|---|---|
| `/reports/new` | 새 보고서/guided upload |
| `/reports/[reportId]` | 보고서 검토 workspace |
| `/reports` | 보고서 목록 |
| `/api/v1/reports/*` | 보고서 API |
| `/api/v1/safety/reports` | safety list |
| `/api/v1/admin/reports` | admin report list |

## Code map

| 흐름 | Frontend | Backend | Docs |
|---|---|---|---|
| 새 보고서 시작 | `app/reports/new/page.tsx` | `POST /api/v1/reports` | `guided_upload.md` |
| 사진 업로드 | `GuidedImageDropzone`, `reportImages` | `photo-steps/step-N` | `guided_upload.md` |
| AI 생성 | `generateDraftFromGuidedPhotos` | `services.ai_pipeline` | `ai_generation.md` |
| 보고서 로드 | `ReportWorkspaceScreen` | `GET /api/v1/reports/{id}` | `data_flow.md` |
| 검토/수정 | `ReportWorkspace` | `PATCH /api/v1/reports/{id}` | `review_validation.md` |
| 검토 완료 | `markReportReviewComplete` | `review-complete` | `review_validation.md` |
| 출력 | `registerReportExport`, download helper | `exports/pdf`, `exports/hwpx` | `export_dispatch.md` |
| 목록 | `ReportsOverview` | `GET /api/v1/reports` | `feature.md` |

## Existing docs map

| 새 문서 | 기존 문서 |
|---|---|
| `guided_upload.md` | `02_step_minimal_photo_upload.md` |
| `ai_generation.md` | `03`, `04`, `05` step docs |
| `review_validation.md` | `06_step_review_validation.md` |
| `export_dispatch.md` | `07_step_render_export_dispatch.md` |
| prompts | `90_codex_prompts.md`, `codex/*` |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현재 코드와 기존 문서 읽고 계획 |
| `02_SCHEMA_AND_DATA_FLOW_PROMPT.md` | schema/API/data flow 정리 |
| `03_IMPLEMENT_GUIDED_UPLOAD_PROMPT.md` | guided upload 안정화 |
| `04_IMPLEMENT_AI_GENERATION_PROMPT.md` | AI draft pipeline 안정화 |
| `05_IMPLEMENT_REVIEW_VALIDATION_PROMPT.md` | 검토/검증 강화 |
| `06_IMPLEMENT_EXPORT_DISPATCH_PROMPT.md` | 출력/과금/메일 연계 |
| `07_QA_REGRESSION.md` | 회귀 검증 |
