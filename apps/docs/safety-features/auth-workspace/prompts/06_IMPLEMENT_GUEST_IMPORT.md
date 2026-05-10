# 06_IMPLEMENT_GUEST_IMPORT

```text
너는 guest workspace cache import를 안정화하는 시니어 풀스택 엔지니어다.

목표:
로그인 후 guest cache를 현재 workspace로 안전하게 import하고 중복을 방지하라.

참조 문서:
- docs/safety-features/auth-workspace/specs/guest_import.md
- docs/safety-features/photo-album/specs/guest_cache.md
- docs/safety-features/webhard/specs/schema.md

대상 코드:
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/web/lib/sessionAuthFlow.ts
- apps/api/app/main.py

요구사항:
1. directory, mailboxDrafts, photoAlbum, drive items/shares import를 검증하라.
2. local id → server id mapping을 정확히 적용하라.
3. parent_id/headquarter_id/site_id/item_id remap을 확인하라.
4. 이미 import된 cache는 재import하지 않도록 marker를 기록하라.
5. import 실패 시 로그인 session은 유지하라.

완료 기준:
- guest cache import 후 importedCounts와 idMaps가 반환된다.
- 중복 import가 최소화된다.
```
