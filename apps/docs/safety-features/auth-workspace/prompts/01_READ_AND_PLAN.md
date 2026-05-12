# 01_READ_AND_PLAN

```text
너는 인증/워크스페이스 기능을 분석하는 시니어 풀스택 엔지니어다.

목표:
현재 auth/workspace/session/guest import 구조를 읽고 개선 계획을 세워라. 아직 코드는 수정하지 마라.

반드시 확인할 파일:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/reportApi.ts
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/config.py
- apps/api/app/store.py

확인할 문서:
- docs/safety-features/auth-workspace/specs/*.md
- docs/safety-features/account-settings/specs/*.md
- docs/safety-features/mailbox/specs/oauth.md

산출물:
1. route/API 흐름 요약
2. session mode별 동작 요약
3. Google Workspace auth와 Gmail OAuth 차이
4. guest import/claim 흐름
5. 리스크와 우선순위
```
