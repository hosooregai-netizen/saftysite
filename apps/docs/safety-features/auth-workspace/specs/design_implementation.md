# Design Implementation Spec: Auth Workspace Design Implementation

## Layout Pattern

```text
Auth/session callback states
```

## Target Routes

- /auth/google/callback

## Design Goal

인증 callback과 workspace session 상태를 사용자가 이해할 수 있도록 loading, success, error, guest claim 상태를 명확히 표시한다.

## Implementation Requirements

1. callback loading은 앱 로그인 처리 중임을 명확히 표시한다.
2. auth error는 code/state/redirect mismatch 등을 사용자 친화적으로 표시한다.
3. guest import가 있으면 가져오기 진행/완료/실패 상태를 표시한다.
4. Gmail 연결과 앱 로그인은 절대 같은 CTA로 보이지 않게 한다.
5. nextPath 이동 전 상태가 짧게라도 표시되어야 한다.

## Non-regression

- auth callback을 Gmail connect callback처럼 표시하지 말 것
- anonymous/local/session 상태를 숨기지 말 것

## Target Files

- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/components/AccountSettingsScreen.tsx

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
