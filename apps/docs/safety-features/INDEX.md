# Safety Features Index

## 빠른 탐색

| Feature | Route | Layout Pattern | Priority | Docs |
|---|---|---|---|---|
| webhard | `/webhard`, `/share/[token]` | Drive-like fullscreen workspace | P0 | `webhard/specs/README.md` |
| mailbox | `/mailbox`, `/mail/connect/*` | Three-pane mailbox workspace | P0 | `mailbox/specs/README.md` |
| report-workspace | `/reports/new`, `/reports/[reportId]` | ERP report workspace | P0 | `report-workspace/specs/README.md` |
| report-list | `/reports` | ERP list management | P0 | `report-list/specs/README.md` |
| headquarters-sites | `/headquarters`, `/sites` | ERP directory management | P0 | `headquarters-sites/specs/README.md` |
| photo-album | `/photo-album` | ERP photo grid | P1 | `photo-album/specs/README.md` |
| account-settings | `/account` | ERP settings page | P0 | `account-settings/specs/README.md` |
| billing-credits | `/billing/*`, `/credits` | Billing/ledger flow | P0 | `billing-credits/specs/README.md` |
| auth-workspace | `/auth/*`, workspace/session APIs | Auth foundation | P0 | `auth-workspace/specs/README.md` |

## 기능별 핵심 확장 문서

| Feature | Key Specs |
|---|---|
| webhard | `permissions.md`, `public_share.md` |
| mailbox | `oauth.md`, `gmail_sync.md`, `compose.md`, `provider_extension.md` |
| report-workspace | `guided_upload.md`, `ai_generation.md`, `review_validation.md`, `export_dispatch.md` |
| report-list | `list_filter_sort.md`, `status_export.md` |
| headquarters-sites | `assignment.md`, `directory_usage.md`, `source_readiness.md` |
| photo-album | `album_filters.md`, `photo_evidence_linking.md`, `guest_cache.md`, `source_readiness.md` |
| account-settings | `google_workspace_auth.md`, `guest_import.md`, `billing_entry.md`, `session_state.md` |
| billing-credits | `checkout.md`, `toss_webhook.md`, `credit_ledger.md`, `report_export_billing.md` |
| auth-workspace | `session_modes.md`, `anonymous_claim.md`, `workspace_access.md`, `token_storage.md` |

## 구현 프롬프트 실행 원칙

1. 먼저 해당 기능의 `prompts/01_READ_AND_PLAN.md`를 실행한다.
2. schema/API 변경 전 `02_SCHEMA...` 프롬프트를 실행한다.
3. backend/UI 구현 프롬프트를 기능별 순서대로 실행한다.
4. 마지막으로 QA regression 프롬프트를 실행한다.
5. 구현 후 `_registry/`와 해당 기능의 `reverse_map.md`를 업데이트한다.
