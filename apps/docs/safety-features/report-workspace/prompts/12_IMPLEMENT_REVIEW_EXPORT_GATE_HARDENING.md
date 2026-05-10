# 12_IMPLEMENT_REVIEW_EXPORT_GATE_HARDENING

```text
검토 완료 전 PDF/HWPX 출력이 불가능하도록 frontend/backend를 모두 보강하라.

대상:
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/models.py

요구사항:
1. unresolved review error가 있으면 export CTA disabled.
2. responsibility confirmation 없으면 review-complete disabled.
3. review_completed false이면 export API 409.
4. local/generated snapshot은 server sync 전 export disabled.
5. export 실패 사유를 사용자 메시지로 표시하라.
```
