# Current Baseline

이 문서는 최신 프로젝트 기준의 현재 상태를 간단히 기록한다. 상세 내용은 각 기능의 `specs/`에서 관리한다.

## 웹하드

현재 웹하드는 Drive-like 구조로 전환되어 있다.

- Route: `/webhard`, `/share/[token]`
- UI: full-screen workspace, left drive sidebar, file canvas, filter chips, list/grid/detail controls
- 주요 상태: 내 드라이브, 공유 문서함, 최근, 중요, 휴지통, 폴더 트리
- 남은 과제: 권한/공유 모델 문서화, public share boundary, 공유 상태 badge, upload progress, visual QA

## 메일함

현재 메일함은 3-pane shell로 전환 중이다.

- Route: `/mailbox`, `/mail/connect/google`, `/mail/connect/naver`, `/mail/connect/naver-works`
- UI: topbar, mailbox sidebar, thread list, viewer pane, compose panel 구조를 목표로 함
- 남은 과제: 누락 source file 복구, Gmail OAuth token exchange, Gmail sync, 3-pane visual polish, compose panel 안정화

## 보고서 자동작성

기존 문서가 `apps/docs/technical-guidance-auto-report/`에 존재한다. 새 구조에서는 `report-workspace` 기능 문서와 연결한다.

## Known source issue

메일함 최신 소스에서는 다음 import 대상이 실제 source tree에 없을 수 있다.

- `apps/web/types/mail.ts`
- `apps/web/lib/mail/apiClient.ts`
- `apps/web/features/mailbox/components/MailConnectCallback.tsx`
- `apps/web/features/mailbox/components/MailboxComposeToolbar.tsx`
- `apps/web/features/mailbox/components/MailboxRecipientField.tsx`
- `apps/web/features/mailbox/components/mailboxComposeHelpers.ts`

이 파일들은 `.next` 캐시에 존재해 보일 수 있으나 clean build 기준에서는 반드시 source tree에 있어야 한다.
