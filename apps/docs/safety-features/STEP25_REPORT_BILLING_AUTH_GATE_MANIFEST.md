# Step 25 Manifest: Report / Billing / Auth Gate Hardening

보고서 검토 완료, PDF/HWPX 출력, 크레딧 차감, Toss confirm/webhook, Workspace 인증/Guest Import를 하나의 release gate로 묶는다.

## 핵심 gate

- 검토 완료 전 export 차단
- generated/local snapshot은 server sync 전 export 차단
- 보고서별 최초 final export 1 credit 차감
- 같은 보고서의 후속 PDF/HWPX 추가 차감 방지
- Toss success confirm / webhook idempotency
- Workspace Google login과 Gmail connect 분리
- guest import ownership / idempotency
- workspace 밖 report/ledger 접근 차단
