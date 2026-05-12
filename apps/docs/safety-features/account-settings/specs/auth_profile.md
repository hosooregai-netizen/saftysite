# Auth & Profile Spec

## 목적

현재 사용자가 어떤 인증 상태인지 명확히 보여주고, 필요한 경우 Google 로그인 또는 일반 로그인/회원가입 흐름으로 연결한다.

## 세션 모드

| Mode | 의미 | UI 표시 |
|---|---|---|
| local | localStorage 기반 임시 작업 | 로컬 임시 보관함 |
| anonymous | 서버 anonymous token 기반 | 임시 작업공간 |
| authenticated | 로그인된 사용자 | 사용자명/워크스페이스 표시 |

## Profile 표시 항목

- 사용자명
- 이메일
- auth provider
- workspace name
- workspace id
- membership role
- credit balance
- session mode
- guest import status

## UX 기준

- 로그인 전에는 Google 로그인 CTA를 가장 명확하게 둔다.
- 로그인 후에는 계정 정보와 워크스페이스 정보를 분리해서 보여준다.
- authError가 있으면 상단 alert로 표시하고 재시도 버튼을 제공한다.
- Google 로그인 중에는 버튼 disabled + loading state를 표시한다.
- 이미 로그인된 사용자가 Google 로그인 버튼을 누르면 `/account#account`로 이동하거나 현재 계정 상태를 보여준다.
