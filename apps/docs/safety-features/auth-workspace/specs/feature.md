# Feature Spec: Auth Workspace

## 목적

사용자가 익명/로컬 상태에서 시작해 Google Workspace 계정 또는 일반 계정으로 전환하고, workspace 단위로 보고서/웹하드/사진첩/메일/결제 데이터를 안전하게 관리할 수 있게 한다.

## 사용자 문제

- 로그인 전에도 보고서 작성이나 사진/자료 임시 저장을 시작해야 한다.
- 로그인 후 임시 데이터가 사라지면 안 된다.
- Google 로그인과 Gmail 연결이 혼동되면 사용자가 잘못된 연결 상태를 이해하게 된다.
- workspace 권한 검증이 약하면 다른 사용자의 자료에 접근할 수 있다.

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| anonymous session | 비로그인 사용자의 임시 workspace 생성 | P0 |
| Google Workspace login | 앱 로그인용 Google OAuth | P0 |
| 일반 login/signup | 이메일/비밀번호 계정 | P1 |
| claim anonymous | 임시 workspace를 로그인 사용자에게 이전 | P0 |
| workspace membership | 사용자와 workspace 연결 | P0 |
| guest cache import | local guest cache를 workspace로 import | P0 |
| auth me | 현재 사용자 조회 | P0 |
| workspace list | 내 workspace 및 credit balance 조회 | P0 |
| token storage | 프론트/백엔드 token 관리 | P0 |

## 포함 범위

- `/account`
- `/auth/google/callback`
- `/api/v1/auth/*`
- `/api/v1/workspaces/*`
- session storage/local cache
- guest cache import
- workspace access guard

## 제외 범위

- Gmail 메일 계정 OAuth: `mailbox/specs/oauth.md`
- 결제 confirm/webhook 상세: `billing-credits/specs/*`
- Drive item 권한 상세: `webhard/specs/permissions.md`

## 성공 기준

- Google Workspace 로그인 후 session이 authenticated로 바뀐다.
- anonymous token이 있으면 claim-anonymous를 통해 임시 workspace가 이전된다.
- guest cache import 후 directory/photoAlbum/drive/mailboxDrafts가 workspace에 반영된다.
- workspace 밖 데이터 접근이 차단된다.
- Gmail 연결과 Workspace 로그인 상태가 UI/문서에서 분리되어 설명된다.
