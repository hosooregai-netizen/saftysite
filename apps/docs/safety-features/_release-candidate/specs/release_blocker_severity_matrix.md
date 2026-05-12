# Release Blocker Severity Matrix

## Severity

| Level | 의미 | Release |
|---|---|---|
| S0 | 보안/결제/인증/데이터 손상 | Hold |
| S1 | 핵심 업무 flow 실패 | Hold |
| S2 | 주요 UX 실패, workaround 있음 | 조건부 Hold 또는 Known Issue |
| S3 | 사소한 시각/문구 이슈 | Release 가능 |
| S4 | 문서 보강/후속 개선 | Release 가능 |

## S0 예시

- workspace 밖 resource 접근 가능
- public share root 밖 접근 가능
- expired/revoked share가 데이터 반환
- Toss confirm/webhook 중복 credit 지급
- report export gate 실패
- Gmail refresh token 평문 노출
- 다른 workspace ledger 조회 가능

## S1 예시

- clean build 실패
- `/reports/new` 진입 실패
- `/webhard` 진입 실패
- `/mailbox` 진입 실패
- 사업장/현장 기준정보 불러오기 실패
- 보고서 생성 → 검토 → 출력 happy path 실패

## S2 예시

- mailbox empty state 문구 혼란
- photo-album guest upload 일부 실패
- webhard share dialog 일부 상태 누락
- report list filter/sort 일부 미동작

## S3 예시

- 버튼 간격
- badge 문구
- mobile layout minor issue
- toast 위치

## 분류 원칙

release 결정은 가장 높은 severity 기준으로 판단한다.
