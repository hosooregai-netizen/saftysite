# Admin AIDLC Batch 31: Overview Dispatch Technical Guidance Split

## Goal

- treat overview `발송 관리 대상` and `미발송 경과 현황` as technical-guidance dispatch queues
- keep the `20억 이상 분기보고서 관리` section focused on quarterly follow-up only

## Scope

- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`

## Contract Pack

- admin proof: `tests/client/admin/admin-overview-dispatch-technical-guidance-split.md`

## Validation Commands

- `npx tsc --noEmit`
- `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/sections/overview/useAdminOverviewSectionState.ts`

## Implementation Record

- limited overview unsent rows to the technical-guidance queue instead of mixing quarterly rows into the same table
- kept client-side pagination/export wired to the normalized unsent rows after the dispatch queue split
- preserved the existing quarterly-management section so 20억 이상 기준 follow-up stays separate from the dispatch-aging dashboard
