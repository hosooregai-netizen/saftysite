# 00_MASTER_CREATE_REGISTRY_PATCH

```text
너는 최신 코드 검증 결과를 문서 registry에 반영하는 시니어 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
Step 15 Code ↔ Docs Verification 결과를 바탕으로 `_registry`, `_project/specs`, `_quality/specs`, `_verification/specs`, `_release/specs`를 업데이트하라.

반영해야 할 사항:
1. `/dashboard` route 추가
2. `/pricing` route 추가
3. `/api/*` frontend proxy route 분리
4. actual FastAPI endpoint inventory 반영
5. source readiness missing file 13개 반영
6. known issue registry 업데이트
7. quality source_readiness 업데이트

절대 수정하지 말 것:
- 앱 소스 코드
- .next
- .venv
- __MACOSX

완료 기준:
- route_registry가 실제 route와 일치한다.
- api_registry가 actual endpoint inventory를 포함한다.
- source_readiness_registry가 missing file과 import reference를 포함한다.
- known_issue_registry가 Step 15 gap을 반영한다.
```
