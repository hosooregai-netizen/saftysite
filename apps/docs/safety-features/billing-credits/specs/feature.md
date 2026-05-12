# Feature Spec: Billing & Credits

## 목적

사용자가 보고서 최종 출력에 필요한 크레딧을 충전하고, workspace 단위로 잔액과 사용 이력을 추적할 수 있게 한다.

## 사용자 문제

- 보고서 최종 출력 전에 보유 크레딧을 확인해야 한다.
- 결제 실패/성공 상태를 명확히 알아야 한다.
- 동일 결제나 webhook 재전송으로 크레딧이 중복 지급되면 안 된다.
- 보고서 출력 시 언제 크레딧이 차감되는지 명확해야 한다.

## 핵심 사용자

- 기술지도 실무자
- 보고서 출력 담당자
- 결제/정산 관리자
- workspace 관리자

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 크레딧 잔액 조회 | workspace별 현재 balance 확인 | P0 |
| 크레딧 ledger | 지급/구매/차감 이력 조회 | P0 |
| 결제 패키지 선택 | starter/team/agency package 선택 | P0 |
| Toss checkout 생성 | Toss 결제창 URL 생성 | P0 |
| 결제 승인 확인 | success callback에서 confirm API 호출 | P0 |
| Toss webhook 처리 | 결제 상태 webhook 수신 및 idempotent credit 지급 | P0 |
| 보고서 출력 차감 | 최초 final export 시 1건 차감 | P0 |
| 무료 체험 지급 | 신규 workspace에 trial credit 지급 | P1 |
| 결제 실패 안내 | fail callback을 account billing section으로 전달 | P1 |

## 범위

포함:

- `/billing/checkout`
- `/billing/success`
- `/billing/fail`
- `/credits` redirect
- `/api/v1/billing/checkout`
- `/api/v1/billing/confirm`
- `/api/v1/billing/webhooks/toss`
- `/api/v1/credits/balance`
- `/api/v1/credits/ledger`
- report export credit consumption

제외:

- 세금계산서/영수증 발급
- 환불/부분취소
- 구독형 과금
- Toss 관리자 콘솔 운영 문서
- 실제 회계 정산 자동화

## 성공 기준

- 로그인하지 않은 사용자는 결제 checkout으로 바로 진입하지 못하고 `/account`로 안내된다.
- 결제 성공 후 credit ledger에 purchase entry가 1번만 생성된다.
- Toss webhook이 중복 도착해도 credit이 중복 지급되지 않는다.
- 보고서 최초 final export 성공 시 `consume_export -1` ledger entry가 생성된다.
- balance는 ledger 합계와 일치한다.
