# UI/UX Spec: Mailbox

## 1. Target UX

메일함은 Gmail/Naver Mail과 유사한 3-pane workspace로 구성한다. 기존 ERP 카드형 화면을 유지하지 않는다.

```text
Topbar
├─ hamburger / 업무 메뉴
├─ 메일함 title
├─ large pill search
├─ account status
├─ sync
└─ compose

Body
├─ Left Sidebar
├─ Center Thread List
└─ Right Viewer

Overlay
└─ Floating Compose Panel
```

## 2. Topbar

Elements:

- hamburger or 업무 메뉴 drawer button
- product title: `메일함`
- search input: `메일 제목, 본문, 주소, 현장 키워드 검색`
- status badge:
  - connected
  - syncing
  - reconnect required
  - sync error
  - no account
- sync button
- new mail button
- user/account menu

## 3. Sidebar

Sections:

```text
+ 메일 작성

메일함
- 받은편지함
- 보낸편지함
- 임시보관함
- 중요
- 휴지통
- 전체 메일

연결 계정
- 전체 계정
- Google account rows
- 계정 추가
```

Rules:

- flat navigation, not nested cards.
- active nav row uses soft selected background.
- account row shows provider, email, connection status.
- connection error account should show warning badge.

## 4. Thread List Pane

Header:

- current folder title
- result count
- search result label if query active
- filter chips when search active

Thread row:

- checkbox or selection affordance
- star
- unread state
- sender/recipient
- subject
- snippet
- attachment icon/count
- timestamp
- site/report badges

Unread:

- bold sender and subject
- stronger timestamp

Selected:

- clear selected background
- viewer updates immediately

Empty states:

| State | Message |
|---|---|
| no account | `업무 메일을 사용하려면 계정을 연결하세요.` |
| empty inbox | `표시할 메일이 없습니다.` |
| search empty | `검색 결과가 없습니다.` |
| sync error | `동기화 중 오류가 발생했습니다.` |

## 5. Viewer Pane

No selected thread:

```text
메일을 선택하세요.
가운데 목록에서 메일을 선택하면 상세 내용을 확인할 수 있습니다.
```

Selected thread:

- title
- star/action row
- participants summary
- each message body
- collapsed/expanded history
- attachments
- reply/forward/delete/archive/restore actions

Trash state:

- show restore action.
- show permanent delete only if implemented and safe.

## 6. Compose Panel

Floating on desktop:

- bottom-right
- normal/minimized/maximized
- to/cc/subject/body/attachments
- send button
- draft status

Mobile:

- full-screen modal or bottom sheet.

## 7. Onboarding

No account should still show mailbox shell but guide user.

Primary CTA:

```text
구글 메일 연결
```

Secondary CTA:

```text
상태 확인
```

Do not show "connected success" and "no connected account" simultaneously.

## 8. App Menu

Because `/mailbox` should feel like a mail app, the ERP left sidebar should not permanently occupy space. Provide 업무 메뉴 drawer for navigation back to reports, webhard, photo album, settings.

## 9. Accessibility

- `aria-label` on icon buttons
- keyboard focus visible
- Enter opens selected thread
- Escape closes drawer/compose when safe
- compose modal/panel should manage focus
- unread/star buttons should be screen-reader clear

## 10. Non-regression Visual Rules

Do not return to:

- large ERP sidebar permanently visible
- mail list inside multiple nested cards
- right detail card with dotted placeholder only
- connection account card disconnected from mailbox shell
