# 05_IMPLEMENT_REPORT_EXPORT_BILLING

```text
너는 보고서 최종 출력 credit 차감 정책을 구현/검증하는 시니어 풀스택 엔지니어다.

목표:
보고서별 최초 final export 성공 시 credit 1건만 차감되고, 재출력은 중복 차감되지 않도록 검증하라.

참조 문서:
- docs/safety-features/billing-credits/specs/report_export_billing.md
- docs/safety-features/report-workspace/specs/export_dispatch.md
- docs/safety-features/report-workspace/specs/review_validation.md

대상 코드:
- apps/api/app/main.py
- apps/api/app/services/credits.py
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts

요구사항:
1. review_completed=false이면 export 차단하라.
2. confirm_reviewed=false이면 export 차단하라.
3. disclaimer 미확인 시 export 차단하라.
4. credit balance < 1이면 402를 반환하라.
5. first export에서만 consume_export -1 ledger entry를 만들라.
6. report.final_export_consumed가 true이면 추가 차감하지 마라.
7. PDF 먼저 출력 후 HWPX 출력, HWPX 먼저 출력 후 PDF 출력 모두 검증하라.
8. UI에 현재 잔액과 차감 정책을 명확히 보여라.

완료 기준:
- 보고서 하나당 최초 final export 1회만 credit 차감
- first_charge_applied가 첫 export에만 true
- ledger와 balance가 정확
```
