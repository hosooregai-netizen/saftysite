# UI/UX Spec: Auth Workspace

## Account Settings 화면

`/account`는 인증/워크스페이스/결제 진입의 허브다.

### 표시 정보

- 현재 사용자 이름/이메일
- session mode
- workspace name
- credit balance
- Google Workspace 로그인 상태
- guest cache import 상태
- 결제 패키지 진입

## 상태별 UI

| 상태 | UI |
|---|---|
| authenticated | 계정 정보, workspace, credit, 결제 버튼 |
| anonymous | Google 로그인 CTA, 임시 데이터 이전 안내 |
| local | 로컬 임시 보관함, 로그인 후 가져오기 안내 |
| auth error | 오류 메시지 + 다시 시도 |
| billing intent | 로그인 후 checkout 이동 안내 |
| import success | 가져온 항목 count 표시 |

## Google login UX

- 버튼 문구: `Google로 로그인`
- 설명: `워크스페이스 계정으로 로그인합니다. Gmail 메일 계정 연결과는 별도입니다.`
- callback 중: `구글 로그인 확인 중입니다.`
- 완료: `계정을 연결했습니다. 작업 화면으로 이동합니다.`

## 금지 사항

- Gmail 연결 성공을 Workspace 로그인 성공처럼 표시하지 않는다.
- Workspace 로그인 성공을 Gmail 받은편지함 연결로 표시하지 않는다.
- 임시 데이터 import 실패 시 전체 로그인 실패로 처리하지 않는다.
