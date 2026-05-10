# Step 11 Master Prompt: Registry & Index

```text
너는 Next.js + FastAPI 기반 SaaS 프로젝트의 문서 registry를 정리하는 시니어 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/` 아래에 전체 기능을 한눈에 찾고 역추적할 수 있는 registry/index 문서를 생성하라.

대상:
- docs/safety-features/README.md
- docs/safety-features/INDEX.md
- docs/safety-features/DOCUMENTATION_RULES.md
- docs/safety-features/_registry/*
- docs/safety-features/_project/specs/*
- docs/safety-features/_project/prompts/*

반드시 반영할 기능:
- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace

생성할 registry:
- feature_registry.md
- route_registry.md
- api_registry.md
- schema_registry.md
- prompt_registry.md
- reverse_registry.md
- doc_status_registry.md
- cross_feature_registry.md
- known_issue_registry.md

생성할 project specs:
- feature_map.md
- route_map.md
- code_map.md
- reverse_guide.md
- docs_qa_checklist.md
- implementation_sequence.md
- cross_feature_flows.md

생성할 project prompts:
- 01_UPDATE_REGISTRY_FROM_CODE.md
- 02_VERIFY_DOC_COVERAGE.md
- 03_VALIDATE_REVERSE_MAPS.md
- 04_GENERATE_COMBINED_DOCS_PACKAGE.md
- 05_DOCS_QA_REGRESSION.md

요구사항:
1. feature → route → component → API → schema → prompt를 추적할 수 있게 하라.
2. specs와 prompts의 역할을 분리해서 설명하라.
3. 기존 기능별 문서 구조와 충돌하지 않게 하라.
4. known issues와 clean build watchlist를 registry에 포함하라.
5. 앱 코드는 수정하지 마라.
6. .next, .venv, __MACOSX는 건드리지 마라.

완료 기준:
- INDEX.md만 보고 주요 기능 문서로 이동할 수 있다.
- feature_registry에서 모든 기능의 priority와 route를 볼 수 있다.
- route_registry에서 route별 기능을 찾을 수 있다.
- api_registry에서 API가 어느 기능에 속하는지 알 수 있다.
- prompt_registry에서 실행 프롬프트 순서를 알 수 있다.
- reverse_registry에서 기능을 리버스할 수 있다.
```
