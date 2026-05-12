# Provider Extension Spec: Naver / Naver Works

## 1. Goal

메일함은 현재 Google Gmail을 P0 provider로 사용한다. 다만 route 구조에는 Naver와 Naver Works callback route가 존재하므로, provider abstraction을 문서화해 향후 확장에 대비한다.

## 2. Provider Interface

A provider should implement:

```text
start_oauth
complete_oauth
refresh_token
fetch_profile
initial_sync
incremental_sync
send_message
modify_thread_state
fetch_attachment
disconnect
```

## 3. Current Provider Routes

```text
/mail/connect/google
/mail/connect/naver
/mail/connect/naver-works
```

## 4. Provider Config

Each provider needs:

```text
CLIENT_ID
CLIENT_SECRET
ALLOWED_REDIRECT_URIS
SCOPES
TOKEN_SECRET / encryption policy
```

## 5. Provider Account Model

`MailAccount.provider` must distinguish:

```ts
'google' | 'naver_mail' | 'naver_works'
```

## 6. Extension Rules

- Do not hard-code Gmail labels in UI.
- UI folder names can stay Korean and provider-neutral.
- Provider-specific sync metadata must live under `account.metadata.provider`.
- Provider-specific API errors should be normalized into common account statuses.
- A new provider must not break Google Mail.
