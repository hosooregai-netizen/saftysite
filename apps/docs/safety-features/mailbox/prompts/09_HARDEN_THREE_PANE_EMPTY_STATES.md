# 09_HARDEN_THREE_PANE_EMPTY_STATES

```text
너는 메일함 3-pane UI를 고도화하는 시니어 프론트엔드 엔지니어다.

목표:
메일함의 sidebar, thread list, viewer empty state를 Gmail/Naver Mail처럼 명확하게 정리하라.

참조 문서:
- docs/safety-features/mailbox/specs/three_pane_hardening.md
- docs/safety-features/mailbox/specs/thread_empty_states.md

대상 코드:
- MailboxShellScreen.tsx
- MailboxSidebar.tsx
- MailboxThreadListPane.tsx
- MailboxViewerPane.tsx
- MailboxShell.module.css

요구사항:
1. no account, connected empty, search empty, filter empty를 다른 문구로 표시하라.
2. thread row unread/star/attachment/time 표시를 유지하라.
3. viewer 선택 전 상태를 간결하게 유지하라.
4. 모바일에서는 sidebar/viewer를 접을 수 있게 유지하라.
5. ERP 카드형 화면으로 회귀하지 마라.

완료 기준:
- three-pane 구조가 유지된다.
- empty state가 원인별로 명확하다.
- visual QA 기준을 통과한다.
```
