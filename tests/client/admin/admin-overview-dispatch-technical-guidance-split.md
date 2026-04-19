## Admin Proof Note

- Scope: `features/admin/**`
- Intent:
  - `발송 관리 대상` and `미발송 경과 현황` should reflect the technical-guidance dispatch queue.
  - `20억 이상 분기보고서 관리` should stay separate from that dispatch queue.
- Checks:
  - `npx tsc --noEmit`
  - `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/sections/overview/useAdminOverviewSectionState.ts`
