# 08_IMPLEMENT_WORKSPACE_AUTH_AND_GUEST_IMPORT_GATES

```text
Workspace Google login과 Gmail connect를 분리하고, guest import가 같은 workspace에 중복 실행되지 않게 하라.

요구사항:
1. /auth/google/callback은 앱 로그인만 처리.
2. /mail/connect/google은 Gmail 연결만 처리.
3. UI 문구와 CTA를 분리.
4. guest import idempotency key 적용.
5. import 후 sync.lastImportedWorkspaceId 기록.
```
