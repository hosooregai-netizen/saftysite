# 06_VISUAL_POLISH

```text
너는 ERP/SaaS 결제 설정 UI를 개선하는 시니어 프론트엔드 엔지니어다.

목표:
`/account#billing` 섹션에서 크레딧 잔액, 패키지 카드, 결제 상태, 최근 ledger를 사용자가 명확히 이해할 수 있도록 UI를 개선하라.

참조 문서:
- docs/safety-features/billing-credits/specs/ui_ux.md
- docs/safety-features/billing-credits/specs/account_entry.md
- docs/safety-features/account-settings/specs/ui_ux.md

대상 코드:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/components/BillingCheckoutScreen.tsx
- apps/web/components/BillingSuccessScreen.tsx
- apps/web/components/BillingFailScreen.tsx
- apps/web/lib/reportApi.ts

요구사항:
1. 현재 크레딧 잔액을 prominent하게 표시하라.
2. 패키지 카드는 credits/price/value가 한눈에 보여야 한다.
3. billingNotice/billingError를 명확한 alert/toast로 표시하라.
4. ledger 최근 이력을 표 또는 list로 표시하라.
5. credit 부족 시 report export 화면에서 충전 CTA를 제공하라.
6. 결제 진행 route는 loading state만 보여주고 account로 복귀해야 한다.
7. 접근성: 버튼 label, aria-live error/notice, keyboard navigation.

완료 기준:
- 사용자가 현재 잔액과 결제 CTA를 쉽게 찾을 수 있다.
- 결제 성공/실패 후 account billing section에서 결과가 명확히 보인다.
```
