# 04_IMPLEMENT_THREE_PANE_UI

## Role

너는 Gmail, Naver Mail, Outlook Web 같은 메일 클라이언트 UI를 구현해본 시니어 프론트엔드 엔지니어이자 UX 디자이너다.

## Goal

메일함을 ERP 카드 화면이 아닌 full-screen 3-pane mailbox shell로 개선한다.

## Must Read

```text
docs/safety-features/mailbox/specs/ui_ux.md
docs/safety-features/mailbox/specs/feature.md
docs/safety-features/mailbox/specs/user_flows.md
docs/safety-features/mailbox/specs/reverse_map.md
docs/safety-features/mailbox/specs/validation.md

apps/web/features/mailbox/components/MailboxShellScreen.tsx
apps/web/features/mailbox/components/MailboxTopbar.tsx
apps/web/features/mailbox/components/MailboxSidebar.tsx
apps/web/features/mailbox/components/MailboxThreadListPane.tsx
apps/web/features/mailbox/components/MailboxViewerPane.tsx
apps/web/features/mailbox/components/MailboxOnboardingState.tsx
apps/web/features/mailbox/components/MailboxShell.module.css
```

## Requirements

### 1. Layout

Use:

```text
64px topbar
240-280px sidebar
360-440px thread list
remaining width viewer
floating compose overlay
```

Mobile:

- sidebar drawer
- list/detail stack
- compose modal/bottom sheet

### 2. Topbar

Include:

- 업무 메뉴 button
- 메일함 title
- large pill search
- account/sync status badge
- sync button
- new mail button
- user/account menu if available

### 3. Sidebar

Include:

- large `+ 메일 작성`
- inbox/sent/drafts/starred/trash/all
- connected accounts
- account status badge
- account add/disconnect actions

Flat nav style. Avoid nested cards.

### 4. Thread List

Each row includes:

- star
- unread state
- sender
- subject
- snippet
- attachment
- timestamp
- site/report badges
- selected state

### 5. Viewer

No selection:

```text
메일을 선택하세요.
가운데 목록에서 메일을 선택하면 상세 내용을 확인할 수 있습니다.
```

Selected:

- title
- participants
- message body
- attachments
- reply/forward/trash/archive/restore actions
- collapsed history

### 6. Empty/Error States

Handle:

- no account
- OAuth error
- sync error
- empty inbox
- empty search
- thread loading
- detail loading

### 7. Visual Rules

- No permanent ERP sidebar.
- No card-nesting layout.
- Use thin borders and calm workspace background.
- Keep information density like mail client.

## Do Not

- Do not implement backend Gmail changes in this step.
- Do not change report/webhard/photo code.
- Do not use Google/Naver logos or trademarked UI assets.

## Validation

- `/mailbox` desktop screenshot should read as mail client.
- success notice and no account state cannot appear together.
- thread selection updates viewer.
- search and filters remain functional.
- clean build passes.
