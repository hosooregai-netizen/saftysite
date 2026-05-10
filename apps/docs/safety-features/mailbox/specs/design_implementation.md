# Design Implementation Spec: Mailbox Three-pane Design Implementation

## Layout Pattern

```text
Gmail/Naver-like three-pane mailbox
```

## Target Routes

- /mailbox
- /mail/connect/google

## Design Goal

Gmail/Naver Mail처럼 좌측 folder/account, 중앙 thread list, 우측 viewer, floating compose panel 구조를 안정화한다.

## Implementation Requirements

1. no account, OAuth pending, connected empty, sync needed, reconnect required 상태를 시각적으로 분리한다.
2. 연결 성공 메시지와 계정 없음 메시지가 동시에 보이지 않게 한다.
3. 새 메일 작성창은 floating panel로 유지하고 수신자, 참조, 제목, 본문, 첨부를 명확히 배치한다.
4. thread row는 unread, starred, attachment, account context를 쉽게 읽을 수 있어야 한다.
5. sync banner는 초기 백필, 동기화 중, 동기화 실패, 재연결 필요를 구분한다.

## Non-regression

- ERP 카드형 메일 화면으로 회귀 금지
- Workspace Google login과 Gmail connect CTA 혼동 금지
- 받는 사람 없는 상태에서 발송 가능 UI 금지

## Target Files

- apps/web/features/mailbox/components/MailboxShellScreen.tsx
- apps/web/features/mailbox/components/MailboxTopbar.tsx
- apps/web/features/mailbox/components/MailboxSidebar.tsx
- apps/web/features/mailbox/components/MailboxThreadListPane.tsx
- apps/web/features/mailbox/components/MailboxViewerPane.tsx
- apps/web/features/mailbox/components/MailboxComposePanel.tsx
- apps/web/features/mailbox/components/MailboxSyncStatusBanner.tsx
- apps/web/features/mailbox/components/MailboxShell.module.css

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
