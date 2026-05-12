# Prompt: Bootstrap Read and Plan

```text
너는 Next.js + FastAPI 기반 SaaS/ERP 프로젝트의 기술 문서화와 리버스 엔지니어링을 담당하는 시니어 소프트웨어 아키텍트다.

목표:
현재 프로젝트 구조를 읽고 `docs/safety-features` 문서 체계에 맞춰 기능별 문서화 계획을 작성하라. 아직 앱 코드는 수정하지 마라.

반드시 먼저 읽을 문서:
- docs/safety-features/README.md
- docs/safety-features/DOCUMENTATION_RULES.md
- docs/safety-features/_project/specs/product_overview.md
- docs/safety-features/_project/specs/current_baseline.md
- docs/safety-features/_project/specs/route_map.md
- docs/safety-features/_project/specs/code_map.md
- docs/safety-features/_templates/feature/specs/README.md

반드시 확인할 코드:
- apps/web/components/AppShell.tsx
- apps/web/app/**/page.tsx
- apps/web/features/drive/*
- apps/web/features/mailbox/components/*
- apps/web/lib/mailboxApi.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/apps_stack.py
- apps/api/app/mail_google_service.py
- apps/api/app/models.py

절대 수정하지 말 것:
- 앱 소스 코드
- .next
- .venv
- __MACOSX

산출물:
1. 현재 기능 목록
2. route map 검증 결과
3. 기능별 우선순위
4. 기능별 docs 생성 계획
5. source tree에 없는 import 또는 build risk 목록
6. 다음에 작성할 기능 문서 추천 순서
```
