# 10_DESIGN_IMPLEMENTATION_PROMPT: Billing Credits Design Implementation

```text
너는 Billing checkout + credit ledger 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
결제/크레딧 화면에서 패키지 선택, 결제 진행, 성공/실패, credit balance, ledger 상태를 명확히 보여준다.

대상 route:
- /billing/checkout
- /billing/success
- /billing/fail
- /credits

대상 파일:
- apps/web/app/billing/checkout/page.tsx
- apps/web/app/billing/success/page.tsx
- apps/web/app/billing/fail/page.tsx
- apps/web/app/credits/page.tsx
- apps/web/components/AccountSettingsScreen.tsx

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/billing-credits/specs/ui_ux.md
- docs/safety-features/billing-credits/specs/validation.md
- docs/safety-features/billing-credits/specs/known_issues.md

구현 요구사항:
1. checkout 화면은 package, amount, credits, workspace, confirm CTA를 표시한다.
2. success 화면은 confirm 진행 중, 지급 완료, account 복귀 CTA를 분리한다.
3. fail 화면은 실패 사유와 다시 시도 CTA를 제공한다.
4. credits 화면은 balance와 purchase/consume_export ledger를 보여준다.
5. report export billing 정책을 UI 안내로 표시한다.

Non-regression:
- 결제 성공 전 credit 지급 완료처럼 보이면 안 됨
- same report re-export 추가 차감 안내 금지

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```
