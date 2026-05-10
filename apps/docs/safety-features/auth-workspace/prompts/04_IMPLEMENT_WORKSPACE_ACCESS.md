# 04_IMPLEMENT_WORKSPACE_ACCESS

```text
너는 workspace access guard를 검증하는 시니어 백엔드 엔지니어다.

목표:
모든 workspace 데이터 API가 현재 user의 workspace 범위 안에서만 동작하도록 검증/보강하라.

참조 문서:
- docs/safety-features/auth-workspace/specs/workspace_access.md
- docs/safety-features/webhard/specs/permissions.md
- docs/safety-features/report-workspace/specs/api_contract.md

대상 코드:
- apps/api/app/main.py
- apps/api/app/apps_stack.py
- apps/api/app/drive_service.py
- apps/api/app/models.py

요구사항:
1. require_user와 require_workspace_payload 사용 위치를 점검하라.
2. reports/drive/mailbox/photoAlbum/billing/directory API의 workspace scope를 점검하라.
3. workspace 밖 id 접근을 404 또는 403으로 차단하라.
4. public share 같은 예외 flow는 별도 boundary를 유지하라.
5. 테스트 시나리오를 문서화하라.

완료 기준:
- workspace 밖 데이터 접근 negative test가 모두 실패한다.
```
