# 04_IMPLEMENT_WORKSPACE_AND_GUEST_IMPORT

```text
너는 guest workspace cache import와 workspace membership 흐름을 구현하는 시니어 풀스택 엔지니어다.

목표:
로그인 전 생성한 게스트 데이터를 로그인 후 현재 workspace로 안전하게 가져오게 하라.

참조 문서:
- docs/safety-features/account-settings/specs/guest_import.md
- docs/safety-features/account-settings/specs/workspace_membership.md
- docs/safety-features/account-settings/specs/session_state.md

대상 코드:
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/web/lib/sessionAuthFlow.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/store.py
- apps/api/app/drive_service.py

요구사항:
1. directory, photoAlbum, drive, mailboxDrafts import를 지원하라.
2. local id → server id mapping을 유지하라.
3. drive parentId/share itemId 참조를 보존하라.
4. 이미 import한 workspace에는 중복 import하지 마라.
5. import 실패 시 guest cache를 삭제하지 마라.
6. import 결과 count와 skipped reason을 반환하라.
7. UI에서 import 성공/실패/재시도를 표시하라.

완료 기준:
- Google 로그인 후 guest data가 workspace로 이동한다.
- 중복 import가 발생하지 않는다.
- 실패해도 데이터가 손상되지 않는다.
```
