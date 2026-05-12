# Architecture Map

## Frontend

- Framework: Next.js App Router
- Main route files: `apps/web/app/**/page.tsx`
- Shared shell: `apps/web/components/AppShell.tsx`
- 일반 ERP 화면은 `shell-root`, `side-rail`, `content-area` 구조를 사용한다.
- 웹하드와 메일함은 `drive-host-root`를 통해 full-screen host로 분기된다.

## Backend

- Framework: FastAPI
- Main entry: `apps/api/app/main.py`
- Domain modules:
  - `apps/api/app/drive_service.py`
  - `apps/api/app/apps_stack.py`
  - `apps/api/app/mail_google_service.py`
  - `apps/api/app/models.py`
  - `apps/api/app/store.py`

## Storage

현재 프로젝트는 workspace 기반 API와 store abstraction을 사용한다. 기능별 데이터 모델은 각 기능의 `schema.md`에서 상세화한다.

## External integrations

| Integration | 파일 | 상태 |
|---|---|---|
| Google Workspace/Auth | `sessionAuthFlow.ts`, `main.py` | 계정/세션 인증 |
| Google Mail/Gmail | `mail_google_service.py`, `apps_stack.py` | 실제 OAuth/sync 구현 필요 |
| Billing/Credits | billing route/API | 상세 문서화 예정 |

## Workspace host pattern

`AppShell.tsx` 기준으로 다음 경로는 일반 ERP side rail이 아니라 full-screen host를 사용한다.

```text
/webhard
/share/*
/mailbox
/mail/connect/*
```

이 구조는 디자인 시스템의 `_design-system/specs/layout_patterns.md`와 연결된다.
