# Admin AIDLC Follow-up: Overview Dispatch Queue Removal

## Summary

- Removed the redundant site-grouped `발송 필요 미해결 현장` table from the admin overview screen.
- Kept the report-level `발송 관리 대상` table and the aggregated `미발송 경과 현황` card as the remaining dispatch surfaces.

## Reason

- `발송 필요 미해결 현장` repeated the same underlying unsent-dispatch information in a site-grouped form.
- Operators can already review the actionable report list in `발송 관리 대상` and the overall volume split in `미발송 경과 현황`.
- Removing the extra queue reduces confusion between report-count and site-count views on the same screen.

## UI Impact

- The overview still shows:
  - `발송 관리 대상`
  - `미발송 경과 현황`
  - `20억 이상 현장 관리`
  - `현장대리인 메일 미등록 현장`
- The removed queue is no longer rendered in `AdminOverviewSection.tsx`.

## Validation

- `npx tsc --noEmit --pretty false`
  - passed
