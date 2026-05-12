# 12_DESIGN_IMPLEMENTATION_PROMPT: Mailbox Three-pane Design Implementation

```text
너는 Gmail/Naver-like three-pane mailbox 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
Gmail/Naver Mail처럼 좌측 folder/account, 중앙 thread list, 우측 viewer, floating compose panel 구조를 안정화한다.

대상 route:
- /mailbox
- /mail/connect/google

대상 파일:
- apps/web/features/mailbox/components/MailboxShellScreen.tsx
- apps/web/features/mailbox/components/MailboxTopbar.tsx
- apps/web/features/mailbox/components/MailboxSidebar.tsx
- apps/web/features/mailbox/components/MailboxThreadListPane.tsx
- apps/web/features/mailbox/components/MailboxViewerPane.tsx
- apps/web/features/mailbox/components/MailboxComposePanel.tsx
- apps/web/features/mailbox/components/MailboxSyncStatusBanner.tsx
- apps/web/features/mailbox/components/MailboxShell.module.css

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/mailbox/specs/ui_ux.md
- docs/safety-features/mailbox/specs/validation.md
- docs/safety-features/mailbox/specs/known_issues.md

구현 요구사항:
1. no account, OAuth pending, connected empty, sync needed, reconnect required 상태를 시각적으로 분리한다.
2. 연결 성공 메시지와 계정 없음 메시지가 동시에 보이지 않게 한다.
3. 새 메일 작성창은 floating panel로 유지하고 수신자, 참조, 제목, 본문, 첨부를 명확히 배치한다.
4. thread row는 unread, starred, attachment, account context를 쉽게 읽을 수 있어야 한다.
5. sync banner는 초기 백필, 동기화 중, 동기화 실패, 재연결 필요를 구분한다.

Non-regression:
- ERP 카드형 메일 화면으로 회귀 금지
- Workspace Google login과 Gmail connect CTA 혼동 금지
- 받는 사람 없는 상태에서 발송 가능 UI 금지

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```
