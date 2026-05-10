# Workspace Access Matrix

| Resource | Workspace key | Public exception |
|---|---|---|
| ReportRecord | `workspace_id` | 없음 |
| PhotoAsset | `workspace_id` | 없음 |
| DriveItem | `workspace_id` | `/share/[token]` root boundary |
| DriveShare | `workspace_id` | token metadata only |
| MailAccount | `workspace_id`, `user_id` | 없음 |
| MailThread | `workspace_id`, `account_id` | 없음 |
| SafetyHeadquarter | `workspace_id` | 없음 |
| SafetySite | `workspace_id` | 없음 |
| PhotoAlbumItem | `workspace_id` | guest local only |
| CreditLedgerEntry | `workspace_id` | 없음 |

원칙: workspace 밖 resource는 403 또는 404다.
