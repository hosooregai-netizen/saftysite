# Feature Spec: Account Settings

## 목적

계정/설정은 사용자가 로그인 상태, 워크스페이스, Google 계정 연결, 게스트 데이터 가져오기, 결제 진입을 관리하는 허브다.

## 사용자 문제

- 비로그인/게스트 상태에서 만든 보고서·사진·웹하드 자료가 로그인 후 워크스페이스에 연결되어야 한다.
- Google 로그인 성공/실패, 인증 필요 redirect, 결제 intent가 한 화면에서 자연스럽게 처리되어야 한다.
- 사용자는 현재 세션이 로컬/익명/인증 상태 중 무엇인지 명확히 알아야 한다.
- 결제 패키지 선택 전 로그인 또는 워크스페이스 연결이 필요하다.

## 핵심 사용자

- 처음 서비스를 사용하는 게스트 사용자
- Google 계정으로 전환하려는 사용자
- 결제 패키지를 구매하려는 사용자
- 이미 로그인한 워크스페이스 사용자
- 관리자 또는 보고서 작성자

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 세션 상태 표시 | local / anonymous / authenticated 구분 | P0 |
| Google Workspace OAuth 시작 | Google 로그인 URL 생성 및 이동 | P0 |
| Google OAuth callback 처리 | code/state 검증 후 session 생성 | P0 |
| guest cache import | 로그인 후 게스트 자료를 workspace로 가져오기 | P0 |
| workspace 정보 표시 | workspaceId, workspaceName, membership | P0 |
| billing intent 처리 | 결제 intent가 있으면 로그인 후 checkout으로 이동 | P0 |
| auth required redirect | 인증 필요 상태에서 로그인 후 next로 복귀 | P0 |
| error/notice 표시 | authError, billingError, billingNotice | P0 |
| 패키지 카드 표시 | 결제 패키지 가격/크레딧 안내 | P1 |

## 성공 기준

- `/account`에서 현재 계정/워크스페이스 상태가 명확히 보인다.
- Google 로그인 후 `/auth/google/callback`에서 callback이 완료되고 intended destination으로 이동한다.
- anonymous token이 있으면 claim/import 흐름이 실행된다.
- guest cache가 import되면 중복 없이 workspace data로 이동한다.
- billing intent가 있으면 로그인 후 checkout으로 이어진다.
