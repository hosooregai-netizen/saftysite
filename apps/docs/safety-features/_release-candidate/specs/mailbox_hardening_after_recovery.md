# Mailbox Hardening After Recovery

## 목표

메일함을 source recovery 이후 실제 업무 메일 UX로 고도화한다.

## 기준

- 연결 성공 메시지와 계정 없음 메시지가 동시에 표시되면 안 된다.
- 계정 없음 state는 onboarding으로 표시한다.
- 계정 있음 + 메일 0건 state는 empty inbox로 표시한다.
- Gmail connect와 Workspace Google login은 분리한다.
- thread list / viewer / compose panel의 three-pane 구조를 유지한다.

## 우선 작업

1. `MailConnectCallback`의 success/error state 정리
2. `MailAccount` response mapping 확인
3. `MailProviderStatus`와 account list 상태 분리
4. Gmail OAuth/sync 실제 연동 전 stub/connected 상태 문구 정리
5. compose panel recipient/attachment/draft UX 보강

## QA

- `/mailbox` no account
- `/mailbox` connected account + 0 thread
- `/mail/connect/google?error=access_denied`
- 새 메일 열기/닫기/임시저장
