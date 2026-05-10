# 01_READ_AND_PLAN: Mailbox

## Role

너는 Next.js + React + FastAPI + MongoDB 기반 SaaS/ERP 프로젝트의 메일함 기능을 분석하는 시니어 풀스택 엔지니어다.

## Goal

메일함 기능을 구현하거나 수정하기 전에 현재 코드, 문서, route, API, schema, UI 상태를 읽고 안전한 구현 계획을 세운다. 아직 코드를 수정하지 말고 분석과 계획만 수행한다.

## Must Read

```text
docs/safety-features/mailbox/specs/feature.md
docs/safety-features/mailbox/specs/data_flow.md
docs/safety-features/mailbox/specs/schema.md
docs/safety-features/mailbox/specs/api_contract.md
docs/safety-features/mailbox/specs/oauth.md
docs/safety-features/mailbox/specs/gmail_sync.md
docs/safety-features/mailbox/specs/compose.md
docs/safety-features/mailbox/specs/ui_ux.md
docs/safety-features/mailbox/specs/known_issues.md
docs/safety-features/mailbox/specs/code_inventory.md
```

Then inspect source files:

```text
apps/web/app/mailbox/page.tsx
apps/web/app/mail/connect/google/page.tsx
apps/web/app/mail/connect/naver/page.tsx
apps/web/app/mail/connect/naver-works/page.tsx
apps/web/features/mailbox/components/*
apps/web/lib/mailboxApi.ts
apps/web/lib/mail/apiClient.ts
apps/web/types/mail.ts

apps/api/app/main.py
apps/api/app/apps_stack.py
apps/api/app/mail_google_service.py
apps/api/app/config.py
apps/api/app/models.py
apps/api/app/store.py
```

## Do Not Touch

```text
apps/web/.next
apps/api/.venv
__MACOSX
웹하드 구현 코드
보고서 구현 코드
사진첩 구현 코드
```

## Tasks

1. 현재 메일함 route와 component 구조를 요약한다.
2. missing source file이 있는지 확인한다.
3. backend Gmail OAuth/sync가 실제 구현인지 stub인지 확인한다.
4. API contract와 실제 route가 일치하는지 확인한다.
5. frontend type/API client contract가 존재하는지 확인한다.
6. UI가 3-pane shell 기준에 얼마나 맞는지 판단한다.
7. 구현 순서를 제안한다.

## Output Format

```md
# Mailbox Read and Plan

## Current State

## Missing / Risky Files

## Backend OAuth/Sync State

## Frontend UI State

## API Contract Gaps

## Recommended Implementation Order

## Files to Change

## Files Not to Change

## Test Plan
```

## Completion Criteria

- 구현 전 위험 요소가 명확히 정리되어 있어야 한다.
- source readiness가 우선인지, OAuth/sync가 우선인지, UI가 우선인지 판단되어야 한다.
- 코드 변경 전 단계별 프롬프트 실행 순서가 제안되어야 한다.
