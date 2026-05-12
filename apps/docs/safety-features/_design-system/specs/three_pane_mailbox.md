# Three-pane Mailbox Pattern

## 사용 기능

- mailbox

메일함은 Gmail/Naver Mail처럼 폴더, 목록, 본문이 동시에 보이는 구조를 목표로 한다.

## 구조

```text
Topbar
├─ 업무 메뉴
├─ 메일 검색
├─ 동기화
├─ 계정 전환
└─ 새 메일

Left Sidebar
├─ + 메일 작성
├─ 받은편지함
├─ 보낸메일함
├─ 임시보관함
├─ 중요
├─ 휴지통
└─ 연결 계정

Center Thread List
├─ folder title
├─ filters
├─ selection toolbar
└─ thread rows

Right Message Viewer
├─ empty state
├─ subject
├─ sender/recipients/time
├─ attachments
├─ body
└─ reply/forward/delete actions
```

## Thread row

- unread: bold
- sender/recipient
- subject
- snippet
- attachment icon
- time
- star/important
- context badge(report/site)

## Compose panel

- floating panel 또는 drawer
- to/cc/subject/body/attachments
- draft saved state
- minimize/maximize/close

## Known UX issue

메일 연결 성공 메시지와 “연결된 메일 계정이 없습니다”가 동시에 보이는 경우는 인증 상태와 mailbox 계정 조회 상태가 어긋난 것이다. UI는 이 상태를 명확히 분리해서 보여야 한다.
