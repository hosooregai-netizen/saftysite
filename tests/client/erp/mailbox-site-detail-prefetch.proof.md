# ERP Proof: Mailbox Site Detail Prefetch

## Covered Behavior

- Admin mailbox initial report option loading keeps using canonical report rows without hydrating missing recipient emails from site detail endpoints.
- Opening the report picker still allows recipient email hydration for the current paginated report rows.
- Selected report hydration still loads the single missing site detail needed for recipient accuracy.

## Verification

- `npx tsx --test features\mailbox\components\adminMailboxReportData.test.ts features\mailbox\components\mailboxReportPickerHelpers.test.ts`
- `npx eslint features/mailbox/components/adminMailboxReportData.ts features/mailbox/components/useMailboxReportState.ts features/mailbox/components/adminMailboxReportData.test.ts`
