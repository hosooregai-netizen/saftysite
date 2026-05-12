# Test Scenarios: Auth Workspace

## Smoke

- [ ] `/account`
- [ ] `/auth/google/callback?error=access_denied`
- [ ] `/auth/google/callback?code=dummy&state=dummy`

## Anonymous

- [ ] anonymous session 생성
- [ ] anonymous workspace 생성
- [ ] anonymous report/webhard/photo 작업 가능
- [ ] anonymous 상태에서 결제 시 로그인 유도

## Google Workspace Auth

- [ ] start authorization_url 반환
- [ ] callback code/state complete
- [ ] state 재사용 실패
- [ ] redirect URI mismatch 실패
- [ ] user 생성 또는 기존 user 조회
- [ ] session authenticated 저장

## Claim

- [ ] anonymousToken이 있는 로그인에서 claim 성공
- [ ] anonymous workspace owner 이전
- [ ] 기존 authenticated membership이 있으면 재사용
- [ ] anonymous token 제거

## Guest Import

- [ ] directory import
- [ ] photoAlbum import
- [ ] drive item/share import
- [ ] mailbox draft import
- [ ] id mapping 반환
- [ ] 중복 import 방지

## Workspace Access

- [ ] 다른 workspace report 차단
- [ ] 다른 workspace drive item 차단
- [ ] 다른 workspace mail account 차단
- [ ] 다른 workspace billing ledger 차단
