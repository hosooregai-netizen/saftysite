# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`
- [ ] `cd apps/api && python -m compileall app`

## Report export

- [ ] required review item이 있으면 다운로드 차단
- [ ] validation blocking issue가 있으면 다운로드 차단
- [ ] responsibility confirmation 없으면 review-complete 실패
- [ ] review-complete 후 PDF export 가능
- [ ] review-complete 후 HWPX export 가능
- [ ] 최초 export만 first_charge_applied=true
- [ ] 같은 report 후속 export는 first_charge_applied=false

## Billing

- [ ] confirm 2회 호출 시 purchase credit 1회만 지급
- [ ] webhook 2회 호출 시 purchase credit 1회만 지급
- [ ] confirm 후 webhook 호출해도 중복 지급 없음
- [ ] webhook 후 confirm 호출해도 중복 지급 없음
- [ ] ledger balance = ledger amount sum
