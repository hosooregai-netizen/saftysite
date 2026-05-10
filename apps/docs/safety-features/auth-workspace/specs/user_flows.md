# User Flows: Auth Workspace

## 1. 비로그인 사용자가 임시 작업 시작

```text
사용자 진입
→ bootstrapReportSession 또는 anonymous auth
→ /api/v1/auth/anonymous
→ anonymous user 생성
→ 임시 workspace 생성
→ session storage에 DemoSession 저장
→ 보고서/사진첩/웹하드 임시 작업 가능
```

## 2. Google Workspace 로그인

```text
/account에서 Google 로그인 클릭
→ beginGoogleWorkspaceAuth()
→ /api/v1/auth/google/start
→ authorization_url 수신
→ sessionStorage에 state context 저장
→ Google consent 화면 이동
→ /auth/google/callback?code=&state=
→ completeGoogleWorkspaceAuthCallback()
→ /api/v1/auth/google/complete
→ AuthResponse 수신
→ session 저장
→ anonymousToken이 있으면 claimAnonymousSession()
→ guest cache import
→ nextPath로 이동
```

## 3. 일반 로그인/회원가입

```text
사용자 이메일/비밀번호 입력
→ loginReportUser 또는 signupReportUser
→ AuthResponse 수신
→ session 저장
→ anonymousToken이 있으면 claim
→ guest cache import
```

## 4. 결제 진입 중 로그인 필요

```text
/account?intent=billing&package=starter-10
→ session 확인
→ 미로그인 또는 anonymous면 Google 로그인 유도
→ 로그인 완료
→ /billing/checkout?package=starter-10로 이동
```

## 5. guest cache import

```text
readGuestWorkspaceCache()
→ importGuestWorkspaceCache()
→ /api/v1/workspaces/import-guest-cache
→ local id → server id mapping
→ headquarters/sites/photoAlbum/drive/mailboxDrafts import
→ markGuestWorkspaceImported()
```

## 6. Gmail 연결과의 분리

```text
Workspace 로그인
→ /auth/google/callback
→ 앱 계정/워크스페이스 인증

Gmail 메일 연결
→ /mail/connect/google
→ 메일 계정 OAuth/token/sync
```
