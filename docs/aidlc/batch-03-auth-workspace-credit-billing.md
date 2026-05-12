# Batch 03. Auth Workspace Credit Billing

## 요구사항

- 워크스페이스 생성 시 무료 2건 지급
- 최초 final export 성공 시 1건 차감
- 결제 패키지는 10, 30, 100건 기준

## 계약

- `apps/api/app/models.py`
- `apps/api/app/services/credits.py`
- `GET /api/v1/credits/balance`
- `GET /api/v1/credits/ledger`

## 입출력 예시

- 입력: `workspace_id`, `package_id`
- 출력: credit ledger entry, current balance

## 검증

- 무료 지급
- 최초 export 차감
- 재다운로드 무료

## 잔여 리스크

- Toss 실제 webhook 검증 서명 로직은 아직 없다.
