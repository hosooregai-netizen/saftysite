# 07_PROVIDER_EXTENSION: Naver / Naver Works

## Role

너는 다중 메일 provider 연동을 설계하는 시니어 백엔드/풀스택 엔지니어다.

## Goal

Google Mail 연동을 깨지 않고 Naver Mail 또는 Naver Works provider를 추가할 수 있는 provider abstraction을 설계/구현한다.

## Must Read

```text
docs/safety-features/mailbox/specs/provider_extension.md
docs/safety-features/mailbox/specs/oauth.md
docs/safety-features/mailbox/specs/schema.md
docs/safety-features/mailbox/specs/api_contract.md

apps/api/app/apps_stack.py
apps/api/app/mail_google_service.py
apps/api/app/config.py
apps/web/app/mail/connect/naver/page.tsx
apps/web/app/mail/connect/naver-works/page.tsx
apps/web/types/mail.ts
```

## Requirements

1. Add provider-neutral interface.
2. Keep Google implementation unchanged.
3. Add provider config env vars.
4. Implement provider status.
5. Implement provider-specific start/complete OAuth.
6. Normalize account metadata and statuses.
7. Keep UI provider-neutral.

## Do Not

- Do not remove Google provider.
- Do not hard-code provider-specific labels into core UI.
- Do not expose tokens.

## Completion Criteria

- Google flow still works.
- New provider can be configured independently.
- Provider status UI shows available/unavailable clearly.
