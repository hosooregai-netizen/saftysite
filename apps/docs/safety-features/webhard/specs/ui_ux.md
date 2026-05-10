# UI/UX Spec: Webhard

## 1. Benchmark

- Google Drive style information architecture
- Dropbox/Box style file management patterns

Do not copy brand, logo, or proprietary iconography. Use the pattern only.

## 2. Layout Pattern

Webhard uses Drive-like fullscreen workspace.

```text
Topbar
├─ menu / app navigation
├─ feature title
├─ search
└─ utilities

Body
├─ DriveSidebar
├─ Main File Canvas
└─ Optional Detail Panel
```

## 3. Current Baseline

Current visual baseline includes:

- left navigation with `내 드라이브`, `공유 문서함`, `최근`, `중요`, `휴지통`
- folder section
- main canvas with current folder title
- filter chips for type/person/date/share
- file list table
- sort/view/detail controls

This is the baseline that must not regress back to a nested ERP card layout.

## 4. Topbar

Required:

- hamburger or app menu drawer entry
- `웹하드` feature title
- large search input for file name, memo, link, type
- upload/new action affordance
- view/detail utility buttons

Optional:

- user/account button
- storage status
- workspace selector

## 5. Sidebar

Required sections:

```text
+ 새로 만들기
내 드라이브
공유 문서함
최근
중요
휴지통
폴더
  내 자료함
  하위 폴더...
```

Rules:

- Flat navigation rows, not nested cards.
- Active item uses subtle blue highlight.
- Counts/badges are shown when useful.
- Folder tree can collapse/expand.

## 6. Main Header

Required:

- current folder/scope name
- breadcrumb
- sort control
- list/grid toggle
- detail panel toggle
- filter chips

Selection mode:

```text
1개 선택됨 | 공유 | 다운로드 | 이름 변경 | 이동 | 중요 표시 | 휴지통 | 더보기
```

## 7. File Table

Columns:

- name
- owner/creator
- updated at
- size
- share status
- more

Row rules:

- Single click selects item.
- Double click or Enter opens folder/file.
- Hover background is subtle.
- Unavailable actions are disabled based on permission.
- More menu and context menu share same action list.

## 8. Grid View

Grid tile includes:

- folder/file icon or thumbnail
- name
- more menu
- optional share badge

Do not overuse shadows.

## 9. Detail Panel

Default closed.

When open:

```text
Preview
Name
Type
Location
Owner/creator
Created at
Updated at
Size
Share status
Quick actions
```

Quick actions:

- share
- download/open
- rename
- move
- star
- trash/restore

## 10. Share Dialog

Information structure:

```text
공유 "파일명"

[사용자, 그룹 또는 이메일 추가]

People with access
- Owner
- Direct users/groups
- Inherited permissions

General access
- Restricted / Anyone with link
- Viewer / Editor
- Expires at

[링크 복사] [완료]
```

Folder guidance:

```text
이 폴더를 공유하면 하위 파일과 폴더에도 접근 권한이 적용됩니다.
```

## 11. Empty States

### Empty folder

```text
아직 이 폴더에 자료가 없습니다.
파일을 끌어다 놓거나 새 폴더를 만들어 자료를 정리해보세요.
```

Actions:

- 파일 업로드
- 새 폴더 만들기

### Search no results

```text
검색 결과가 없습니다.
검색어를 바꾸거나 필터를 해제해 보세요.
```

### Trash empty

```text
휴지통이 비어 있습니다.
```

## 12. Snackbar / Upload Panel

Use bottom snackbar or upload panel for:

- upload progress
- item created
- link copied
- item moved to trash
- restore complete

Avoid top full-width alert blocks for routine actions.

## 13. Responsive Rules

Desktop:

```text
sidebar + main + optional details panel
```

Tablet:

```text
sidebar collapsible, details as drawer
```

Mobile:

```text
topbar + single-column list, sidebar/detail/compose as drawers
```

## 14. Visual Non-Regressions

Do not return to:

- ERP left sidebar permanently occupying large space in webhard route
- `탐색`, `폴더`, `자료 목록`, `상세` as nested cards
- search inside a card instead of top workspace area
- detail panel always open by default
