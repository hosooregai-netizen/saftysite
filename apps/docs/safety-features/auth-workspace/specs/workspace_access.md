# Workspace Access

## 목적

모든 업무 데이터가 workspace 범위 안에서만 조회/수정되도록 한다.

## Backend guard

```text
Authorization: Bearer <token>
→ require_user
→ user resolve
→ get_workspace_for_user / require_workspace_payload
→ workspace_id 획득
→ feature-specific data query
```

## 적용 대상

- reports
- drive items/shares/permissions
- mailbox accounts/drafts/messages
- photo album
- headquarters/sites
- billing orders/ledger

## 원칙

1. user가 membership이 없는 workspace 데이터는 반환하지 않는다.
2. URL에 workspace_id가 없더라도 현재 user의 workspace로 scope를 제한한다.
3. item_id/report_id/site_id가 workspace 밖이면 404 또는 403으로 처리한다.
4. public share 같은 예외 flow는 별도 token boundary를 사용한다.
5. admin endpoint도 workspace_id를 반드시 적용한다.

## 권한 단계

현재 membership은 `owner | member` 중심이다. 향후 다음 역할로 확장할 수 있다.

```text
owner
admin
controller
field_agent
client_viewer
```

사용자 role과 membership role은 혼동하지 않는다.
