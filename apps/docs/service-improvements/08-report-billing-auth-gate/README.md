# Service Improvement 08: Report Export / Billing / Auth Gate

## 목적

보고서 출력, 크레딧 차감, Toss confirm/webhook, Workspace 인증 gate를 실제 코드에서 더 안전하게 만든다.

## 적용 파일

```text
apps/api/app/services/credits.py
apps/api/app/main.py
apps/web/components/ReportWorkspace.tsx
```

## 핵심 개선

- review-complete API에서 책임 확인이 없으면 실패
- review queue의 required 항목과 validation blocking issue가 남아 있으면 검토 완료 실패
- 프론트에서 필수 검토 항목이 남아 있으면 다운로드 confirm으로 우회하지 않고 차단
- 보고서별 최초 final export만 1 credit 차감
- 같은 report의 PDF/HWPX 후속 출력은 추가 차감하지 않음
- purchase ledger idempotency 강화
- Toss confirm/webhook 중복 호출 시 credit 중복 지급 방지
- report export consume ledger idempotency 강화

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_08_report_billing_auth_gate_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```

Backend도 확인한다.

```bash
cd apps/api
python -m compileall app
```
