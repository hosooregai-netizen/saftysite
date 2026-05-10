# Design Implementation Spec: Billing Credits Design Implementation

## Layout Pattern

```text
Billing checkout + credit ledger
```

## Target Routes

- /billing/checkout
- /billing/success
- /billing/fail
- /credits

## Design Goal

결제/크레딧 화면에서 패키지 선택, 결제 진행, 성공/실패, credit balance, ledger 상태를 명확히 보여준다.

## Implementation Requirements

1. checkout 화면은 package, amount, credits, workspace, confirm CTA를 표시한다.
2. success 화면은 confirm 진행 중, 지급 완료, account 복귀 CTA를 분리한다.
3. fail 화면은 실패 사유와 다시 시도 CTA를 제공한다.
4. credits 화면은 balance와 purchase/consume_export ledger를 보여준다.
5. report export billing 정책을 UI 안내로 표시한다.

## Non-regression

- 결제 성공 전 credit 지급 완료처럼 보이면 안 됨
- same report re-export 추가 차감 안내 금지

## Target Files

- apps/web/app/billing/checkout/page.tsx
- apps/web/app/billing/success/page.tsx
- apps/web/app/billing/fail/page.tsx
- apps/web/app/credits/page.tsx
- apps/web/components/AccountSettingsScreen.tsx

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
