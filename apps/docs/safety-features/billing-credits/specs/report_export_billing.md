# Report Export Billing Spec

## 목적

보고서 최종 출력 시 credit을 차감하고 출력 이력을 남긴다.

## 과금 정책

현재 기준:

```text
보고서별 최초 final export 성공 시 1 credit 차감
PDF와 HWPX 중 어떤 형식을 먼저 출력하든 최초 1회만 차감
같은 보고서의 후속 PDF/HWPX 출력은 추가 차감하지 않음
```

## Backend flow

```text
export_pdf/export_hwpx
→ report 존재 확인
→ workspace access 확인
→ review_completed 확인
→ confirm_reviewed 확인
→ disclaimer acceptance 확인
→ create_export
```

`create_export` 내부:

```text
if not report.final_export_consumed:
  balance = ledger_balance(report.workspace_id)
  if balance < 1:
    raise 402
  add_ledger_entry(type='consume_export', amount=-1, report_id=report.id)
  report.final_export_consumed = True
  first_charge = True

ReportExport(first_charge_applied=first_charge)
report.status='exported'
payload.status='exported'
```

## UI 표시

ReportWorkspace export 영역:

- 현재 credit balance
- 최초 출력 시 1건 차감 안내
- 이미 final export consumed이면 “재출력은 추가 차감 없음” 안내
- PDF/HWPX 출력 이력
- credit 부족 시 충전 CTA

ReportList:

- 미출력
- PDF 출력
- HWPX 출력
- PDF/HWPX 출력

## 검증

- review 완료 전 export는 409
- credit 0이면 export는 402
- 첫 PDF export는 -1
- 이후 HWPX export는 추가 차감 없음
- first_charge_applied는 첫 export에만 true
