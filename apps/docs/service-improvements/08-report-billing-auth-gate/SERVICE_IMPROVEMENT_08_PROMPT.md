# Service Improvement 08 Prompt: Report Export / Billing / Auth Gate

```text
너는 보고서 출력, 크레딧 ledger, Toss 결제 idempotency를 안정화하는 시니어 풀스택 엔지니어다.

목표:
검토 완료 전 report export를 차단하고, 보고서별 최초 final export credit 차감과 Toss confirm/webhook idempotency를 보장하라.

대상 파일:
- apps/api/app/services/credits.py
- apps/api/app/main.py
- apps/web/components/ReportWorkspace.tsx

요구사항:
1. review-complete는 responsibility_confirmed=false이면 실패해야 한다.
2. required review item 또는 validation blocking issue가 남아 있으면 review-complete가 실패해야 한다.
3. frontend download는 필수 검토 항목이 남아 있으면 confirm 우회 없이 차단해야 한다.
4. 보고서별 최초 final export만 1 credit을 차감해야 한다.
5. 같은 report의 후속 PDF/HWPX export는 추가 차감하지 않아야 한다.
6. CreditLedgerEntry purchase는 paymentKey/orderId 기준으로 idempotent해야 한다.
7. Toss confirm/webhook 중복 호출이 credit 중복 지급을 만들면 안 된다.
8. consume_export ledger도 report_id 기준으로 중복 차감을 방지해야 한다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

cd apps/api
python -m compileall app

완료 기준:
- review/export gate 통과
- first export charge only once
- Toss duplicate confirm/webhook no double credit
- UI에서 필수 검토 항목 우회 출력 불가
```
