# AGENTS.md

## Project

This repository is for the 대한안전산업연구원 safety-report SaaS workspace.

Core product areas:

- report-workspace: 새 보고서 작성, guided upload, AI draft, review queue, export gate
- report-list: 보고서 목록, status filters, export history
- headquarters-sites: 사업장/현장 ERP directory
- photo-album: 현장 사진첩
- webhard: Drive-like file manager and public share
- mailbox: Gmail/Naver-like three-pane mailbox
- account-settings: workspace login, guest import, billing entry
- billing-credits: checkout, credit ledger, report export billing
- auth-workspace: workspace auth, anonymous claim, guest import

## Source of truth

Use this hierarchy:

1. Actual source code
2. Markdown specs and prompts under `docs/safety-features/`
3. Service improvement docs under `docs/service-improvements/`
4. Reverse-map JSON under `docs/control-center/data/*.json`
5. HTML Control Center under `docs/control-center/index.html`

The HTML Control Center is not the source of truth. It is a navigation, prompt selection, QA, and blocker tracking interface.

## Work mode

Always work feature-by-feature.

Do not modify unrelated features in the same task.

Preferred order:

1. source recovery / clean build
2. mailbox
3. webhard
4. report-workspace
5. report-list
6. photo-album
7. headquarters-sites
8. account-settings
9. billing-credits / auth-workspace
10. final QA

## Do not touch

Never modify:

- `apps/web/.next`
- `apps/api/.venv`
- `__MACOSX`
- generated cache files unless explicitly requested
- unrelated feature files

Do not add production dependencies without explicit approval.

## Required checks

After modifying frontend code:

```bash
rm -rf apps/web/.next
cd apps/web
npm run build