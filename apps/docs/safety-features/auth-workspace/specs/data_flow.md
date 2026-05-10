# Data Flow: Auth Workspace

## Route to component

```text
/account
→ AccountSettingsScreen
→ peekCachedSession
→ beginGoogleWorkspaceAuth

/auth/google/callback
→ GoogleWorkspaceAuthCallbackPage
→ completeGoogleWorkspaceAuthCallback
```

## Frontend session flow

```text
reportApi.ts
→ bootstrapReportSession
→ bootstrapDemoSession
→ peekCachedSession
→ writeSafetyAuthToken
→ session storage key: saftysite-web-report-session-v2
```

## Google Workspace auth flow

```text
sessionAuthFlow.ts
→ getGoogleWorkspaceRedirectUri
→ startGoogleWorkspaceAuth
→ writeGoogleWorkspaceAuthContext(state)
→ Google redirect
→ completeGoogleWorkspaceAuthCallback
→ readGoogleWorkspaceAuthContext(state)
→ completeGoogleWorkspaceAuth
→ claimAnonymousSession
→ importGuestWorkspaceCache
```

## Backend auth flow

```text
main.py
→ /api/v1/auth/google/start
→ validate redirect_uri
→ store.auth_oauth_states[state]
→ build_google_app_authorization_url

main.py
→ /api/v1/auth/google/complete
→ state lookup
→ redirect_uri check
→ exchange_google_app_code
→ resolve_or_create_google_user
→ build_auth_response
```

## Workspace access flow

```text
Authorization token
→ require_user
→ resolve_user_for_token
→ get_workspace_for_user or require_workspace_payload
→ workspace_id scope
→ feature-specific service/API
```

## Guest import flow

```text
GuestWorkspaceCache
→ ImportGuestWorkspaceCacheRequest
→ /api/v1/workspaces/import-guest-cache
→ find/create headquarters
→ find/create sites
→ import photoAlbum
→ import drive items/shares
→ import mailbox drafts
→ id mapping response
```
