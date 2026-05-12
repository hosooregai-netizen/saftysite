# Master Prompt: Create Photo Album Docs

```text
너는 Next.js + FastAPI 기반 SaaS/ERP 프로젝트의 사진첩 기능을 문서화하는 시니어 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/photo-album/` 아래에 specs와 prompts를 분리한 사진첩 기능 문서 구조를 생성하라.

반드시 확인할 코드:
- apps/web/app/photo-album/page.tsx
- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/lib/workspaceStorageApi.ts
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/reportImages.ts
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/store.py

source readiness 확인 대상:
- apps/web/types/photos.ts
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- album_filters.md
- photo_evidence_linking.md
- guest_cache.md
- source_readiness.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SOURCE_READINESS.md
- 03_SCHEMA_AND_API_PROMPT.md
- 04_IMPLEMENT_PHOTO_GRID.md
- 05_IMPLEMENT_FILTERS_AND_LINKING.md
- 06_VISUAL_POLISH.md
- 07_QA_REGRESSION.md

절대 수정하지 말 것:
- 앱 코드
- .next
- .venv
- __MACOSX

완료 기준:
- photo-album/README.md에서 기능 범위를 이해할 수 있다.
- specs/data_flow.md에서 route → component → adapter → API 흐름을 이해할 수 있다.
- specs/source_readiness.md에서 clean build 위험 파일을 확인할 수 있다.
- prompts/를 순서대로 실행하면 사진첩 구현/복구 작업을 진행할 수 있다.
```
