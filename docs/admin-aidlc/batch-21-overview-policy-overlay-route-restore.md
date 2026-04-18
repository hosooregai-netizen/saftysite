# Admin AIDLC Batch 21: Overview Policy Overlay Route Restore

## Goal

- restore the server-side overview policy overlay path for `/api/admin/dashboard/overview`
- bring back `발송 관리 대상` and `20억 이상 분기보고서 관리` rows that were dropped by the route regression

## Scope

- Next admin overview route merge path
- real-admin smoke proof coverage for the overview response shape

## Contract Pack

- admin proof: `scripts/smoke-real-client/admin-sections/control-center.ts`

## Validation Commands

- `npx tsc --noEmit --pretty false`
- local API probe with the controller test account against `http://127.0.0.1:3100/api/admin/dashboard/overview`

## Implementation Record

- confirmed the upstream safety API still returned overview payload data for the controller test account, while the Next route dropped the server-side policy overlay merge
- restored the overview route to fetch the upstream payload and overlay in parallel, then merge them before returning the JSON response
- verified the fixed local route changed the overview counts from `unsentReportRows=0 / priorityQuarterlyManagementRows=0` to `unsentReportRows=220 / priorityQuarterlyManagementRows=9`
- confirmed the latest production deployment commit (`5c801ad`, deployed on 2026-04-18) still lacked this route restore, so the deployed app remained on the regressed path until this change is pushed and redeployed
- tightened the real-admin smoke section to observe `/api/admin/dashboard/overview` and fail if the response shape stops including the derived overview arrays

## Residual Debt

- production verification is still gated by Vercel deployment protection, so post-deploy app-level confirmation may need a bypass token or authenticated Vercel access
