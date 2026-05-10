# Google Workspace Auth Spec

## 목적

Google OAuth를 사용해 workspace account를 생성하거나 기존 account에 로그인한다.

## Frontend flow

```text
beginGoogleWorkspaceAuth()
→ getGoogleWorkspaceRedirectUri()
→ startGoogleWorkspaceAuth()
→ writeGoogleWorkspaceAuthContext(state)
→ redirect to Google
```

## Callback flow

```text
/auth/google/callback
→ code/state/error parse
→ completeGoogleWorkspaceAuthCallback()
→ read context
→ completeGoogleWorkspaceAuth()
→ claim anonymous session
→ import guest workspace cache
→ clear context
→ nextPath redirect
```

## State context

state별 context는 sessionStorage에 저장한다.

```text
saftysite-web-google-auth:{state}
```

저장값:

```ts
{
  anonymousToken: string | null;
  nextPath: string;
  requestedAt: number;
}
```

## 보안 기준

- redirectUri allowlist 검증
- state 검증
- state 1회성 소비
- state 만료 시간 적용
- code/token 로그 출력 금지
- anonymousToken은 callback 이후 제거
- nextPath는 내부 경로만 허용
- external open redirect 금지

## 후속 연결

- Gmail OAuth와 구분한다.
- Workspace auth는 `/auth/google/callback`.
- Mail auth는 `/mail/connect/google`.
- pending mail connect state는 mailbox 문서에서 관리한다.
