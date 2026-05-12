# 01_AUTH_WORKSPACE_BLOCKER_PATCH

```text
너는 auth-workspace release blocker를 수정하는 시니어 엔지니어다.

목표:
인증, 세션, workspace guard, guest claim/import blocker를 수정하라.

입력:
- blocker id:
- severity:
- failing gate:
- evidence:
- expected:
- actual:

반드시 확인할 문서:
- docs/safety-features/auth-workspace/specs/*
- docs/safety-features/_release-candidate/specs/release_blocker_severity_matrix.md
- docs/safety-features/_blocker-patches/specs/patch_verification_checklist.md

대상 파일:
- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/guestWorkspaceCache.ts
- apps/api/app/main.py
- apps/api/app/models.py

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX
- blocker와 무관한 기능

요구사항:
1. blocker root cause를 요약하라.
2. 최소 범위 patch를 적용하라.
3. 관련 기능 regression을 확인하라.
4. 관련 docs와 registry를 업데이트하라.
5. release decision report에 반영할 결과를 작성하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- blocker resolved
- focused QA pass
- related regression pass
- docs updated
```
