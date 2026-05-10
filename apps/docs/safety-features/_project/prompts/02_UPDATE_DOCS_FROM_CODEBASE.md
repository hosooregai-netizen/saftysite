# Prompt: Update Docs From Codebase

```text
너는 프로젝트 문서와 실제 코드 사이의 drift를 줄이는 테크니컬 라이터이자 시니어 엔지니어다.

목표:
현재 코드베이스를 기준으로 `docs/safety-features`의 route map, code map, feature registry를 갱신하라. 앱 코드는 수정하지 말고 문서만 수정하라.

작업 순서:
1. docs/safety-features/DOCUMENTATION_RULES.md를 읽는다.
2. apps/web/app/**/page.tsx를 확인해 route를 수집한다.
3. apps/web/components/AppShell.tsx를 확인해 shell 분기 구조를 수집한다.
4. apps/web/features/drive/*와 apps/web/features/mailbox/components/*를 확인한다.
5. apps/api/app/*.py와 apps/api/app/services/*를 확인한다.
6. `_project/specs/route_map.md`를 갱신한다.
7. `_project/specs/code_map.md`를 갱신한다.
8. `_registry/feature_registry.md`를 갱신한다.
9. `_registry/route_registry.md`를 갱신한다.

완료 기준:
- 모든 주요 route가 registry에 있다.
- 각 기능마다 frontend/backend 문서화 대상 파일이 연결되어 있다.
- source tree에 없는 import는 known issue로 기록되어 있다.
```
