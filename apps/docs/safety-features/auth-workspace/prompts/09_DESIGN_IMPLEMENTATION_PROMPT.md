# 09_DESIGN_IMPLEMENTATION_PROMPT: Auth Workspace Design Implementation

```text
너는 Auth/session callback states 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
인증 callback과 workspace session 상태를 사용자가 이해할 수 있도록 loading, success, error, guest claim 상태를 명확히 표시한다.

대상 route:
- /auth/google/callback

대상 파일:
- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/components/AccountSettingsScreen.tsx

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/auth-workspace/specs/ui_ux.md
- docs/safety-features/auth-workspace/specs/validation.md
- docs/safety-features/auth-workspace/specs/known_issues.md

구현 요구사항:
1. callback loading은 앱 로그인 처리 중임을 명확히 표시한다.
2. auth error는 code/state/redirect mismatch 등을 사용자 친화적으로 표시한다.
3. guest import가 있으면 가져오기 진행/완료/실패 상태를 표시한다.
4. Gmail 연결과 앱 로그인은 절대 같은 CTA로 보이지 않게 한다.
5. nextPath 이동 전 상태가 짧게라도 표시되어야 한다.

Non-regression:
- auth callback을 Gmail connect callback처럼 표시하지 말 것
- anonymous/local/session 상태를 숨기지 말 것

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```
