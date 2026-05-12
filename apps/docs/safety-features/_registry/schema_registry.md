# Schema Registry

| Schema / Model | Feature | Docs |
|---|---|---|
| `User` | auth-workspace | `auth-workspace/specs/schema.md` |
| `Workspace` | auth-workspace | `auth-workspace/specs/schema.md` |
| `Membership` | auth-workspace | `auth-workspace/specs/schema.md` |
| `DemoSession` | auth-workspace/account-settings | `auth-workspace/specs/session_modes.md` |
| `GuestWorkspaceCache` | auth-workspace/account-settings/photo-album/webhard | `auth-workspace/specs/guest_import.md` |
| `ReportRecord` | report-workspace/report-list | `report-workspace/specs/schema.md` |
| `ReportPayload` | report-workspace | `report-workspace/specs/schema.md` |
| `PhotoAsset` | report-workspace/photo-album | `report-workspace/specs/schema.md`, `photo-album/specs/schema.md` |
| `ReportExport` | report-workspace/billing-credits | `billing-credits/specs/report_export_billing.md` |
| `SafetyHeadquarter` | headquarters-sites | `headquarters-sites/specs/schema.md` |
| `SafetySite` | headquarters-sites | `headquarters-sites/specs/schema.md` |
| `SafetyAssignment` | headquarters-sites | `headquarters-sites/specs/assignment.md` |
| `PhotoAlbumItem` | photo-album | `photo-album/specs/schema.md` |
| `DriveItem` | webhard | `webhard/specs/schema.md` |
| `DrivePermission` | webhard | `webhard/specs/permissions.md` |
| `DriveShare` | webhard | `webhard/specs/public_share.md` |
| `WorkspaceGroup` | webhard/auth-workspace | `webhard/specs/permissions.md` |
| `MailAccount` | mailbox | `mailbox/specs/schema.md` |
| `MailThread` | mailbox | `mailbox/specs/schema.md` |
| `MailMessage` | mailbox | `mailbox/specs/schema.md` |
| `MailboxDraft` | mailbox | `mailbox/specs/compose.md` |
| `BillingOrder` | billing-credits | `billing-credits/specs/schema.md` |
| `CreditLedgerEntry` | billing-credits | `billing-credits/specs/credit_ledger.md` |

## Naming compatibility watchlist

| Issue | Affected Feature |
|---|---|
| `userId` vs `user_id` | mailbox/auth-workspace |
| frontend camelCase vs backend snake_case | mailbox, billing, report |
| local/generated snapshot vs server payload | report-workspace/report-list |
| guest cache item IDs vs server IDs | webhard/photo-album/auth-workspace |
