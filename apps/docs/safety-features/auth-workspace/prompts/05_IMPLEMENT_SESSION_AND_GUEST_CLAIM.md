# 05_IMPLEMENT_SESSION_AND_GUEST_CLAIM

```text
너는 session mode와 anonymous claim 흐름을 안정화하는 시니어 풀스택 엔지니어다.

목표:
authenticated / anonymous / local session mode와 anonymous workspace claim 흐름을 안정화하라.

참조 문서:
- docs/safety-features/auth-workspace/specs/session_modes.md
- docs/safety-features/auth-workspace/specs/anonymous_claim.md

대상 코드:
- apps/web/lib/reportApi.ts
- apps/web/lib/sessionAuthFlow.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/store.py

요구사항:
1. session mode helper가 일관되게 동작하는지 확인하라.
2. anonymousToken이 있는 로그인 후 claimAnonymousSession을 실행하라.
3. anonymous membership 제거와 authenticated membership 생성이 안전한지 검증하라.
4. claim 실패 시 session은 유지하고 오류를 표시하라.
5. 중복 claim을 방지하라.

완료 기준:
- anonymous workspace가 로그인 사용자에게 안전하게 이전된다.
```
