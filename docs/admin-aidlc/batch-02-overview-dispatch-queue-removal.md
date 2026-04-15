# Admin AIDLC Follow-up: Overview Dispatch Queue Removal

## Summary

- Removed the redundant site-grouped `발송 필요 미해결 현장` table from the admin overview screen.
- Removed the `현장대리인 메일 미등록 현장` table from the overview dashboard as well.
- Kept the report-level `발송 관리 대상` table and the aggregated `미발송 경과 현황` card as the remaining dispatch surfaces.

## Reason

- `발송 필요 미해결 현장` repeated the same underlying unsent-dispatch information in a site-grouped form.
- `현장대리인 메일 미등록 현장` was a secondary operational queue that no longer needs to be surfaced on the main overview dashboard.
- Operators can still review the actionable report list in `발송 관리 대상` and the overall volume split in `미발송 경과 현황`.

## UI Impact

- The overview still shows:
  - `발송 관리 대상`
  - `미발송 경과 현황`
  - `20억 이상 현장 관리`
- The overview no longer shows:
  - `발송 필요 미해결 현장`
  - `현장대리인 메일 미등록 현장`

## Validation

- `npx tsc --noEmit --pretty false`
  - passed
