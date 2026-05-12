# Permissions Spec: Webhard

## 1. Permission Goals

웹하드 권한 모델은 다음을 보장해야 한다.

1. 사용자는 자신이 읽을 수 있는 파일/폴더만 볼 수 있다.
2. 사용자는 edit 권한이 있는 항목만 수정/삭제/이동할 수 있다.
3. 사용자는 share 권한이 있는 항목만 공유할 수 있다.
4. 폴더 권한은 descendants에 상속된다.
5. 공개 링크는 공유 root 밖으로 나갈 수 없다.
6. 만료/폐기/삭제/휴지통 항목은 공유로 접근할 수 없다.

## 2. Roles

| Role | Read | Edit | Share | Owner Transfer | Notes |
|---|---:|---:|---:|---:|---|
| `owner` | yes | yes | yes | yes | item owner |
| `editor` | yes | yes | yes or limited | no | MVP can allow share, policy can narrow later |
| `commenter` | yes | no | no | no | model only; UI optional |
| `viewer` | yes | no | no | no | read-only |

## 3. Principal Types

| Type | Meaning |
|---|---|
| `user` | Workspace user |
| `group` | Workspace group |
| `workspace` | All workspace members |
| `domain` | Email domain policy |
| `anyone` | Public or link-level principal |

## 4. Effective Permission Resolution

Pseudo flow:

```text
resolve_effective_permission(user, item)
→ collect item and ancestors from item to root
→ find active permissions on each node
→ match principal against user
→ select highest role by role rank
→ return role/null
```

Role rank:

```text
owner > editor > commenter > viewer > none
```

Expiry rule:

```text
permission is active when expires_at is null or expires_at > now
```

## 5. Inheritance

Folder permission applies to descendants.

Example:

```text
Folder A: user kim@example.com viewer
└─ Folder B
   └─ File C
```

Effective result:

```text
Kim can read Folder A, Folder B, File C.
Kim cannot edit unless role is editor/owner.
```

Inherited permissions should be visible in share dialog but not directly editable from child item unless user navigates to the source item.

## 6. Owner Defaults

When item is created:

- `owner_user_id` is current user.
- owner permission is created for current user.
- workspace default/editor permission may be created depending on product policy.

## 7. Share Link Policy

Share link is separate from DrivePermission.

| Field | Meaning |
|---|---|
| `visibility` | `restricted` or `anyone_with_link` |
| `role` | `viewer` or `editor` |
| `expires_at` | Optional expiry |
| `is_revoked` | Revocation flag |

`restricted` means token alone is not enough unless optional logged-in user has permission. `anyone_with_link` means token grants public access to root and descendants with the configured role.

## 8. Public Token Boundary

Given share root `R`:

Allowed:

```text
R
R descendants
```

Forbidden:

```text
R parent
R sibling
workspace root outside R
any item from another workspace
trashed/deleted descendants
```

## 9. Error Policy

For private resource access failures, prefer 404 over 403 to avoid leaking existence.

| Case | Recommended |
|---|---|
| Item exists but user cannot read | 404 |
| Item exists but user cannot edit | 404 or 403; prefer 404 for privacy |
| Public token expired | 404 |
| Public token revoked | 404 |
| Parent outside shared root | 404 |
| Move into descendant | 400 |

## 10. Required Guard Functions

Backend should keep these functions centralized in `drive_service.py` or equivalent.

```python
can_read_item(store, user, item)
can_edit_item(store, user, item)
can_share_item(store, user, item)
resolve_effective_permission(store, user, item)
is_descendant_of(store, workspace_id, item_id, ancestor_id)
resolve_share_link_access(store, share, item, user)
```

## 11. Security Checklist

- [ ] Workspace id is checked for every item/share/permission/group.
- [ ] Public token cannot enumerate workspace items.
- [ ] `data_url`, `external_url`, `text_content` are only returned through content endpoints after access check.
- [ ] Revoked share never returns root metadata.
- [ ] Expired share never returns root metadata.
- [ ] Deleted/trashed items are excluded from public rows.
- [ ] Direct permission changes require share permission.
- [ ] Owner permission cannot be deleted casually.
