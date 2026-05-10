# 05_IMPLEMENT_BILLING_ENTRY

```text
너는 account-settings의 결제 진입 UX를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
`/account`에서 패키지 선택, 인증 필요 처리, 로그인 후 checkout 이동을 안정화하라.

참조 문서:
- docs/safety-features/account-settings/specs/billing_entry.md
- docs/safety-features/billing-credits/specs/feature.md 가 있으면 함께 확인

대상 코드:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/lib/reportApi.ts
- apps/web/app/billing/checkout/page.tsx
- apps/api/app/main.py

요구사항:
1. 패키지 카드의 id/name/amount/credits/note를 명확히 표시하라.
2. 미로그인 사용자가 패키지를 선택하면 auth intent로 이동하라.
3. 로그인 완료 후 `/billing/checkout?package=`로 이동하라.
4. billingNotice와 billingError를 표시하라.
5. 결제 상세 로직은 billing-credits 기능에 위임하라.
6. 패키지 id가 잘못되면 명확히 오류를 표시하라.

완료 기준:
- 로그인 상태와 무관하게 패키지 선택 흐름이 끊기지 않는다.
```
