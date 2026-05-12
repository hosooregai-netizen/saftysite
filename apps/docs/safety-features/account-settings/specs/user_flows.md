# User Flows: Account Settings

## 1. 비로그인 사용자가 설정 진입

```text
사용자
→ /account
→ local/anonymous 상태 확인
→ Google 로그인 CTA 표시
→ 패키지 카드와 로그인 필요 안내 표시
```

## 2. Google Workspace 로그인

```text
/account
→ Google 로그인 클릭
→ beginGoogleWorkspaceAuth()
→ startGoogleWorkspaceAuth()
→ POST /api/v1/auth/google/start
→ authUrl + state 수신
→ sessionStorage에 state context 저장
→ Google OAuth 동의 화면
→ /auth/google/callback?code=&state=
→ completeGoogleWorkspaceAuthCallback()
→ POST /api/v1/auth/google/complete
→ session 저장
→ anonymous claim 또는 guest cache import
→ nextPath로 이동
```

## 3. 인증 필요 페이지에서 복귀

```text
보호 기능 접근
→ /account?auth=required&next=/target
→ Google 로그인
→ callback 완료
→ canUseWorkspaceServerApis=true
→ /target으로 이동
```

## 4. 결제 intent 처리

```text
사용자 패키지 선택
→ /account?intent=billing&package=starter-10
→ 로그인 상태 확인
→ 미로그인: Google 로그인
→ 로그인 완료
→ /billing/checkout?package=starter-10
```

## 5. 게스트 데이터 가져오기

```text
게스트 상태에서 데이터 생성
→ guestWorkspaceCache에 저장
→ Google 로그인
→ anonymous token claim
→ importGuestWorkspaceCache()
→ reports/photos/mailboxDrafts/photoAlbum/drive/directory import
→ markGuestWorkspaceImported()
→ cache import 완료 표시
```

## 6. 오류 처리

```text
Google provider error
→ /account?authError=...
→ error banner 표시

callback code/state 누락
→ /account?authError=...
→ 재시도 CTA 표시

billing error
→ /account?billingError=...
→ 결제 페이지 재진입 CTA 표시
```
