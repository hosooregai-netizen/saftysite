# Guest Import

## 목적

비로그인/로컬 상태에서 쌓인 데이터를 로그인 후 workspace로 이전한다.

## Import 대상

```text
directory.headquarters
directory.sites
mailboxDrafts
photoAlbum
drive.items
drive.shares
```

## ID mapping

```text
local headquarter id → server headquarter id
local site id → server site id
local drive item id → server drive item id
local share id → server share id
```

## Backend 처리 순서

1. headquarters import
2. sites import, headquarter id remap
3. mailbox drafts import, site/headquarter/report id remap
4. photo album import
5. drive items import, parent id remap
6. drive shares import, item id remap

## 중복 방지

- 이름/사업자등록번호/관리번호 등으로 기존 사업장 매칭
- site name/headquarter/address로 기존 현장 매칭
- guest cache의 `lastImportedWorkspaceId`와 `lastImportedAt` 기록

## 검증

- import 후 guest cache sync 상태 갱신
- 같은 cache를 두 번 import해도 중복 최소화
- import 실패 시 session은 유지
- 민감한 data_url은 필요할 때만 서버로 보낸다.
