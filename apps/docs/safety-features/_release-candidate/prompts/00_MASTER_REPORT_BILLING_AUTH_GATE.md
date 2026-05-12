# Step 25 Master Prompt: Report / Billing / Auth Gate Hardening

```text
너는 보고서 출력, 결제/크레딧, 인증/워크스페이스 흐름을 release gate 수준으로 안정화하는 시니어 풀스택 엔지니어다.

목표:
검토 완료 전 export 차단, 최초 final export credit 차감, Toss webhook idempotency, Workspace Google login과 Gmail connect 분리, guest import ownership을 검증/보강하라.

대상 파일:
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/app/auth/google/callback/page.tsx
- apps/web/app/billing/checkout/page.tsx
- apps/web/app/billing/success/page.tsx
- apps/web/app/billing/fail/page.tsx
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/services/credits.py
- apps/api/app/apps_stack.py

요구사항:
1. review_completed 전 PDF/HWPX export를 차단하라.
2. local/generated snapshot report는 server sync 전 export를 차단하라.
3. 최초 final export에서만 1 credit을 차감하라.
4. 같은 report의 후속 PDF/HWPX export는 추가 차감하지 마라.
5. Toss confirm과 webhook의 credit 지급을 idempotent하게 처리하라.
6. Workspace Google login과 Gmail connect 상태를 분리하라.
7. guest import가 같은 workspace에 중복 실행되지 않게 하라.
8. 모든 report/billing/auth API에 workspace access guard를 확인하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- report export gate 통과
- credit ledger reconciliation 통과
- Toss idempotency 테스트 통과
- auth/mail connect 분리 QA 통과
- guest import idempotency 통과
```
