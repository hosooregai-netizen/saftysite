# Prompt Registry

## 공통 실행 순서

```text
01_READ_AND_PLAN
→ 02_SCHEMA_AND_API_PROMPT
→ backend/domain implementation prompt
→ UI implementation prompt
→ QA_REGRESSION
```

## Feature prompt map

| Feature | Prompt Folder | First Prompt | QA Prompt |
|---|---|---|---|
| webhard | `webhard/prompts/` | `01_READ_AND_PLAN.md` | `06_QA_REGRESSION.md` |
| mailbox | `mailbox/prompts/` | `01_READ_AND_PLAN.md` | `06_QA_REGRESSION.md` |
| report-workspace | `report-workspace/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |
| report-list | `report-list/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |
| headquarters-sites | `headquarters-sites/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |
| photo-album | `photo-album/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |
| account-settings | `account-settings/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |
| billing-credits | `billing-credits/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |
| auth-workspace | `auth-workspace/prompts/` | `01_READ_AND_PLAN.md` | `07_QA_REGRESSION.md` |

## Cross-feature prompt rules

- Webhard permission changes must update auth-workspace access assumptions.
- Mailbox OAuth changes must not alter Workspace Google auth.
- Report export billing changes must update billing-credits and report-workspace docs.
- Guest import changes must update auth-workspace, account-settings, webhard, photo-album.
- Directory schema changes must update report-workspace, report-list, photo-album, mailbox suggestions.
