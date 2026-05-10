# Data Flow: Account Settings

## 1. Route to component

```text
/account
→ apps/web/app/account/page.tsx
→ AccountSettingsScreen

/auth/google/callback
→ apps/web/app/auth/google/callback/page.tsx
→ completeGoogleWorkspaceAuthCallback()
```

## 2. Account page load

```text
AccountSettingsScreen
→ useSearchParams()
→ peekCachedSession()
→ canUseWorkspaceServerApis(session)
→ query params 확인
   - billingNotice
   - billingError
   - authError
   - auth=required
   - intent=billing
   - package
   - next
→ UI state 렌더링
```

## 3. Google auth start

```text
handleGoogleAuth()
→ current session 확인
→ nextPath 결정
→ anonymousToken 결정
→ beginGoogleWorkspaceAuth({ nextPath, anonymousToken })
→ startGoogleWorkspaceAuth(redirectUri)
→ POST /api/v1/auth/google/start
→ state context를 sessionStorage에 저장
→ window.location.href = authUrl
```

## 4. Google callback

```text
/auth/google/callback
→ code/state/error 확인
→ completeGoogleWorkspaceAuthCallback({ authCode, state })
→ readGoogleWorkspaceAuthContext(state)
→ completeGoogleWorkspaceAuth()
→ POST /api/v1/auth/google/complete
→ session 저장
→ anonymousToken이 있으면 claimAnonymousSession()
→ guest cache가 있으면 importGuestWorkspaceCache()
→ nextPath 반환
→ router.replace(nextPath)
```

## 5. Backend auth flow

```text
POST /api/v1/auth/google/start
→ redirect_uri allowlist 검증
→ state 생성
→ authUrl 반환

POST /api/v1/auth/google/complete
→ state 검증
→ code token exchange 또는 provider user 확인
→ User 생성/조회
→ Workspace/Membership 생성/조회
→ AuthResponse 반환
```

## 6. Guest import flow

```text
readGuestWorkspaceCache()
→ importGuestWorkspaceCache()
→ POST /api/v1/workspaces/import-guest-cache
→ directory / mailboxDrafts / photoAlbum / drive import
→ markGuestWorkspaceImported(workspaceId)
```

## 7. Billing intent flow

```text
/account?intent=billing&package=...
→ canPurchase=true이면
→ router.replace(/billing/checkout?package=...)
```
