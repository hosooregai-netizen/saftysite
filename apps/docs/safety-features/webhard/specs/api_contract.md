# API Contract: Webhard

Base path: `/api/v1/drive`

## 1. Authenticated Item APIs

### GET `/items`

List drive items.

Query:

| Name | Type | Description |
|---|---|---|
| `parent_id` | string/null | Folder id to list children |
| `include_deleted` | boolean | Include trashed/deleted items |
| `query` | string | Search query |

Response:

```json
{
  "rows": [
    {
      "id": "drive_...",
      "workspace_id": "workspace_...",
      "kind": "folder",
      "name": "자료함",
      "parent_id": null,
      "file_type": null,
      "is_deleted": false,
      "is_starred": false,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

Security:

- Requires authenticated user.
- Only rows where `can_read_item(user, item)` is true are returned.
- If `parent_id` is provided, parent must be readable.

### POST `/items`

Create folder/file/note/link.

Request body uses `GuestWorkspaceDriveItemInput` shape.

Important fields:

```json
{
  "local_id": "local_optional",
  "kind": "file",
  "name": "webhard.pdf",
  "parent_local_id": "drive_parent_or_null",
  "file_type": "binary",
  "content_type": "application/pdf",
  "size_bytes": 492000,
  "data_url": "data:application/pdf;base64,...",
  "text_content": "",
  "external_url": ""
}
```

Rules:

- Parent must exist in same workspace.
- Parent must be editable.
- New item owner defaults to current user.
- Default owner/editor permissions are created.

### PATCH `/items/{item_id}`

Update metadata or content fields.

Supported payload keys:

```json
{
  "name": "새 이름",
  "parent_id": "drive_parent_or_null",
  "text_content": "...",
  "external_url": "https://...",
  "file_type": "note",
  "content_type": "text/plain",
  "size_bytes": 123,
  "data_url": "...",
  "thumbnail_data_url": "...",
  "headquarter_id": "...",
  "site_id": "...",
  "is_deleted": true,
  "restore": true,
  "is_starred": true,
  "last_opened_at": "..."
}
```

Rules:

- User must have edit permission.
- Moving into self or descendant is forbidden.
- Moving into a parent requires edit permission on parent.

### DELETE `/items/{item_id}`

Move to trash or purge.

Query:

| Name | Type | Description |
|---|---|---|
| `purge` | boolean | Permanently delete item tree |

Rules:

- User must have edit permission.
- `purge=false` sets `is_deleted=true` and `trashed_at`.
- `purge=true` removes item tree and associated records.

## 2. Permission APIs

### GET `/items/{item_id}/permissions`

Query:

| Name | Type | Description |
|---|---|---|
| `include_inherited` | boolean | Include effective inherited permissions |

Response:

```json
{
  "rows": [
    {
      "id": "perm_...",
      "workspace_id": "...",
      "item_id": "drive_...",
      "principal_type": "user",
      "principal_id": "user_...",
      "email": "user@example.com",
      "role": "viewer",
      "inherited_from_item_id": null,
      "expires_at": null,
      "is_inherited": false
    }
  ]
}
```

Rules:

- User must have share permission.
- Inherited permissions are read-only display rows.

### POST `/items/{item_id}/permissions`

Create or upsert direct permission.

Request:

```json
{
  "principal_type": "user",
  "principal_id": "user_...",
  "email": "user@example.com",
  "role": "viewer",
  "expires_at": null
}
```

Rules:

- User must have share permission.
- `owner` role can only be assigned to a user.
- Existing same principal permission is updated.

### PATCH `/permissions/{permission_id}`

Update role or expiry.

Request:

```json
{
  "role": "editor",
  "expires_at": "2026-12-31T23:59:59Z"
}
```

Rules:

- User must have share permission on the target item.
- Owner role update is restricted.

### DELETE `/permissions/{permission_id}`

Delete direct permission.

Rules:

- User must have share permission.
- Default owner permission cannot be deleted.

## 3. Group APIs

- GET `/groups`
- POST `/groups`
- PATCH `/groups/{group_id}`
- DELETE `/groups/{group_id}`
- POST `/groups/{group_id}/members`
- DELETE `/groups/{group_id}/members/{member_id}`

Groups are workspace-scoped.

## 4. Share Link APIs

### GET `/shares`

Query:

| Name | Type | Description |
|---|---|---|
| `item_id` | string | Optional item filter |

Rules:

- Only shares for items the user can share are returned.

### POST `/shares`

Create share link.

Request:

```json
{
  "item_id": "drive_...",
  "visibility": "anyone_with_link",
  "role": "viewer",
  "expires_at": null
}
```

Response:

```json
{
  "id": "share_...",
  "item_id": "drive_...",
  "token": "public_...",
  "visibility": "anyone_with_link",
  "role": "viewer",
  "expires_at": null,
  "is_revoked": false
}
```

Rules:

- User must have share permission.
- Token is generated server-side.

### PATCH `/shares/{share_id}`

Update visibility, role, expiry, revoked flag.

Request:

```json
{
  "visibility": "restricted",
  "role": "viewer",
  "expires_at": null,
  "is_revoked": false
}
```

### DELETE `/shares/{share_id}`

Revoke share link.

Response:

```json
{ "ok": true }
```

## 5. Public Share APIs

### GET `/shares/{token}`

Returns root shared item and immediate children when root is folder.

### GET `/shares/{token}/items?parent_id={folderId}`

Returns children of a folder under the shared root.

### GET `/shares/{token}/items/{item_id}`

Returns content of a file under the shared root.

Rules:

- Token must be active.
- Share must not be expired or revoked.
- Root item must not be deleted/trashed.
- Requested parent/item must be root or descendant of root.
- Public payload must not include private workspace metadata beyond the minimum needed for display.
