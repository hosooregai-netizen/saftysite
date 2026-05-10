# 01_UPDATE_REGISTRY_FROM_CODE

```text
너는 프로젝트 문서 registry를 최신 코드 기준으로 업데이트하는 시니어 테크니컬 라이터다.

목표:
route, feature, API, schema, prompt registry를 현재 코드 기준으로 점검하고 업데이트하라.

반드시 확인할 문서:
- docs/safety-features/INDEX.md
- docs/safety-features/_registry/feature_registry.md
- docs/safety-features/_registry/route_registry.md
- docs/safety-features/_registry/api_registry.md
- docs/safety-features/_registry/schema_registry.md
- docs/safety-features/_registry/prompt_registry.md
- docs/safety-features/_registry/reverse_registry.md

반드시 확인할 코드:
- apps/web/app/*
- apps/web/components/*
- apps/web/features/*
- apps/web/lib/*
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/apps_stack.py
- apps/api/app/drive_service.py
- apps/api/app/mail_google_service.py

절대 수정하지 말 것:
- 앱 기능 코드
- .next
- .venv
- __MACOSX

요구사항:
1. 모든 frontend route를 route_registry에 반영하라.
2. 모든 핵심 API endpoint를 api_registry에 반영하라.
3. 누락된 feature → route → component 연결을 reverse_registry에 반영하라.
4. 기능별 prompt folder가 prompt_registry에 있는지 확인하라.
5. 문서 누락 항목은 doc_status_registry에 기록하라.

완료 기준:
- INDEX.md에서 전체 기능을 찾을 수 있다.
- route_registry와 feature_registry가 서로 일치한다.
- 기능별 reverse_map과 reverse_registry가 충돌하지 않는다.
```
