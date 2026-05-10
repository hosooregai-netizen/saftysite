# API Contract Follow-up

## Mailbox

확인할 proxy path:

```text
frontend: /api/mail/*
proxy: /api/v1/mail/*
backend: apps/api/app/main.py
```

확인할 endpoint:

```text
GET /api/v1/mail/accounts
GET /api/v1/mail/providers/status
POST /api/v1/mail/accounts/connect/{provider}/start
POST /api/v1/mail/accounts/connect/{provider}/complete
GET /api/v1/mail/threads
GET /api/v1/mail/threads/{thread_id}
POST /api/v1/mail/send
POST /api/v1/mail/sync
```

## Safety/Admin

확인할 proxy path:

```text
frontend: /api/admin/*, /api/safety/*
proxy: /api/v1/admin/*, /api/v1/safety/*
```

## Documents

확인할 route:

```text
/api/documents/inspection/pdf
/api/documents/inspection/hwpx
```

이 route는 backend FastAPI가 아니라 Next.js server route helper를 사용한다.
