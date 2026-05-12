# Workspace Access Guard Hardening

## 대상

- ReportRecord
- DriveItem / DriveShare
- MailAccount / MailThread
- SafetyHeadquarter / SafetySite
- PhotoAlbumItem
- CreditLedgerEntry

resource.workspace_id와 current workspace id가 일치해야 한다. user-specific resource는 user_id도 함께 검증한다.

## QA

다른 workspace report/drive/mail/photo/ledger 접근 차단.
