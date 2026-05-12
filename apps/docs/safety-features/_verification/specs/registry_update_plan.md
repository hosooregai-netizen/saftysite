# Registry Update Plan

## 1. Route registry

추가 후보:

```text
/dashboard
/pricing
```

분류 후보:

| Route | 권장 feature |
|---|---|
| `/dashboard` | project dashboard 또는 home |
| `/pricing` | billing-credits 또는 pricing |
| `/api/*` | frontend proxy route |

## 2. API registry

`actual_api_inventory.md`를 기준으로 endpoint를 group별로 재분류한다.

권장 group:

- health
- auth
- workspace
- reports
- report photos
- AI generation
- export
- billing/credits
- safety directory
- admin directory
- webhard/drive
- mailbox
- photo-album
- guest import

## 3. Schema registry

`schema_registry.md`에서 missing source와 관련된 타입을 별도 source readiness 항목으로 표시한다.

## 4. Known issue registry

다음 issue를 계속 유지한다.

- clean build missing source
- Workspace Google auth vs Gmail connect
- public share boundary
- Toss webhook idempotency
- report export billing
