# Three-pane Mailbox Hardening

## 목적

메일함을 Gmail/Naver Mail처럼 `sidebar → thread list → message viewer` 흐름이 명확한 3-pane 구조로 안정화한다.

## 기본 구조

```text
MailboxTopbar
├─ 업무 메뉴
├─ 메일 검색
├─ 새로고침/동기화
├─ 계정 상태
└─ 새 메일

MailboxBody
├─ MailboxSidebar
├─ MailThreadListPane
└─ MailboxViewerPane
```

## 상태별 layout

| 상태 | Sidebar | Thread List | Viewer |
|---|---|---|---|
| no account | 표시하되 disabled 가능 | onboarding | 도움말 |
| connected empty | 폴더/계정 표시 | empty inbox | 선택 안내 |
| selected thread | 폴더/계정 표시 | selected row | message detail |
| compose open | 유지 | 유지 | 유지 + floating compose |

## Non-regression

- ERP 카드형 메일 화면으로 회귀하지 않는다.
- 연결 계정 card와 thread list가 분리되어 보여야 한다.
- 상세 viewer는 오른쪽 pane에 유지한다.
- 모바일에서는 sidebar/viewer를 drawer 또는 stack으로 전환한다.

## Thread row 기준

- unread는 bold 또는 dot로 표시한다.
- star, sender, subject, snippet, attachment count, time이 한 row에서 확인되어야 한다.
- row click은 detail open, star click은 event propagation을 막는다.

## Viewer 기준

- 선택 전: `메일을 선택하세요.`
- 선택 후: 제목, 계정, 발신자, 수신자, 본문, 첨부, 답장/전달/보관/삭제 표시
- trash에서는 복원 액션 표시
