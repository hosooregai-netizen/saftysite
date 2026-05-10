# UI/UX Spec: Account Settings

## 레이아웃

계정/설정은 ERP AppShell 안의 설정 화면이다. 웹하드/메일함처럼 full-screen shell로 전환하지 않는다.

## 화면 구성

```text
Header
→ 설정 / 계정 및 기본정보
→ 현재 세션 상태
→ auth/billing notice

Account panel
→ 사용자 정보
→ Google 로그인/연결 상태
→ workspace 정보

Guest import panel
→ 임시 작업 자료 존재 여부
→ 가져오기 상태
→ 마지막 import 시간

Billing entry panel
→ 패키지 카드
→ 결제 CTA
→ credit balance

Danger/utility area
→ 로그아웃
→ 세션 초기화
→ cache 상태 확인
```

## 상태

| 상태 | UI |
|---|---|
| 미로그인 | Google 로그인 CTA |
| 로그인 중 | loading button |
| 로그인 완료 | 사용자/워크스페이스 정보 |
| authError | error alert |
| auth required | next path 안내 |
| billing intent | 결제 이동 안내 |
| guest cache 있음 | 가져오기 CTA |
| guest import 성공 | success notice |
| guest import 실패 | retry CTA |

## UX 기준

- 인증과 결제 intent를 같은 화면에서 자연스럽게 처리한다.
- 사용자가 현재 어떤 계정/작업공간에 있는지 명확히 보여준다.
- “Google Workspace 로그인”과 “Google 메일 연결”은 구분해서 표현한다.
- 결제는 설정 화면에서 시작할 수 있지만 상세 처리는 billing 기능으로 이동한다.
