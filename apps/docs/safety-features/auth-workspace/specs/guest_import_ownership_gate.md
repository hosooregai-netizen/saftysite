# Guest Import Ownership Gate

## Import 대상

- directory.headquarters
- directory.sites
- mailboxDrafts
- photoAlbum
- drive.items
- drive.shares
- report drafts

## Guard

- `sync.lastImportedWorkspaceId`
- `sync.lastImportedAt`
- anonymous claim status
- idempotency key per guest item

## QA

guest cache import 2회 호출 시 중복 생성 없음.
