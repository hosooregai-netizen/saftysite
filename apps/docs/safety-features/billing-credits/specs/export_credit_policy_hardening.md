# Export Credit Policy Hardening

보고서별 최초 final export 성공 시 1 credit만 차감한다.

```text
first PDF or first HWPX
→ 1 credit 차감

same report second format
→ 추가 차감 없음
```

## 필드

- `ReportRecord.final_export_consumed`
- `ReportExport.first_charge_applied`
- `CreditLedgerEntry.type = consume_export`
- `CreditLedgerEntry.report_id`

## QA

- balance 0 first export 실패
- balance 1 first PDF 성공 후 balance 0
- same report HWPX 성공, balance 유지
- different report export 실패
