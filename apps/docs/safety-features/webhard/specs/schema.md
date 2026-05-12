# Schema: Webhard

## 1. Frontend Domain Types

Source: `apps/web/features/drive/types.ts`

### DriveItemRecord

```ts
interface DriveItemRecord {
  id: string;
  kind: 'folder' | 'file';
  name: string;
  parentId: string | null;
  headquarterId: string | null;
  siteId: string | null;
  fileType: 'note' | 'link' | 'binary' | null;
  textContent: string;
  externalUrl: string;
  contentType: string;
  sizeBytes: number;
  dataUrl: string;
  thumbnailDataUrl: string;
  isDeleted: boolean;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  ownerUserId: string | null;
  updatedByUserId: string | null;
  lastOpenedAt: string | null;
  trashedAt: string | null;
}
```

### DriveShareRecord

```ts
interface DriveShareRecord {
  id: string;
  itemId: string;
  token: string | null;
  visibility: 'restricted' | 'anyone_with_link';
  role: 'viewer' | 'editor';
  expiresAt: string | null;
  revokedAt: string | null;
  isRevoked: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
```

### DrivePermissionRecord

```ts
interface DrivePermissionRecord {
  id: string;
  workspaceId: string;
  itemId: string;
  principalType: 'user' | 'group' | 'domain' | 'anyone' | 'workspace';
  principalId: string;
  email: string | null;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  inheritedFromItemId: string | null;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isInherited: boolean;
  sourceItemId: string | null;
  sourceItemName: string | null;
  itemName: string | null;
}
```

## 2. Backend Models

Source: `apps/api/app/models.py`

### DriveItem

Expected fields:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Server id |
| `workspace_id` | string | Workspace boundary |
| `source_local_id` | string/null | Legacy or local id |
| `kind` | folder/file | Item kind |
| `name` | string | Display name |
| `parent_id` | string/null | Parent folder |
| `headquarter_id` | string/null | Optional ERP linkage |
| `site_id` | string/null | Optional ERP linkage |
| `file_type` | note/link/binary/null | File subtype |
| `text_content` | string | Memo or text content |
| `external_url` | string | Link URL |
| `content_type` | string | MIME type |
| `size_bytes` | number | File size |
| `data_url` | string | MVP binary payload |
| `thumbnail_data_url` | string | Thumbnail |
| `is_deleted` | boolean | Trash flag |
| `is_starred` | boolean | Important flag |
| `created_by` | string/null | Creator |
| `owner_user_id` | string/null | Owner |
| `updated_by_user_id` | string/null | Last editor |
| `last_opened_at` | string/null | Recent tracking |
| `trashed_at` | string/null | Trash timestamp |
| `created_at` | string | Created timestamp |
| `updated_at` | string | Updated timestamp |

### DriveShare

| Field | Meaning |
|---|---|
| `id` | Share record id |
| `workspace_id` | Workspace boundary |
| `source_local_id` | Optional local id |
| `token` | Public share token |
| `item_id` | Shared root item |
| `visibility` | `restricted` or `anyone_with_link` |
| `role` | `viewer` or `editor` |
| `expires_at` | Optional expiry |
| `is_revoked` | Revoked flag |
| `revoked_at` | Revoked timestamp |
| `created_by` | Creator |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

### DrivePermission

| Field | Meaning |
|---|---|
| `id` | Permission id |
| `workspace_id` | Workspace boundary |
| `item_id` | Target item |
| `principal_type` | user/group/domain/anyone/workspace |
| `principal_id` | Principal id or normalized key |
| `email` | Optional email for display/invite |
| `role` | owner/editor/commenter/viewer |
| `inherited_from_item_id` | Source ancestor item |
| `expires_at` | Permission expiry |
| `created_by` | Creator |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

### WorkspaceGroup / WorkspaceGroupMember

Groups are used to grant permissions to multiple workspace users.

## 3. Serialization Rules

Backend returns snake_case. Frontend domain uses camelCase. Mapping lives in `features/drive/driveApi.ts`.

Examples:

| Backend | Frontend |
|---|---|
| `parent_id` | `parentId` |
| `file_type` | `fileType` |
| `data_url` | `dataUrl` |
| `thumbnail_data_url` | `thumbnailDataUrl` |
| `is_deleted` | `isDeleted` |
| `is_starred` | `isStarred` |
| `owner_user_id` | `ownerUserId` |
| `expires_at` | `expiresAt` |
| `is_revoked` | `isRevoked` |

## 4. Item Type Rules

| UX Type | `kind` | `file_type` | Data fields |
|---|---|---|---|
| Folder | folder | null | no content payload |
| Binary file | file | binary | content_type, size_bytes, data_url |
| Note | file | note | text_content |
| Link | file | link | external_url |

## 5. Future Storage Migration

Current MVP may store binary as `data_url`. Future object storage migration should keep DriveItem metadata and replace payload fields with object metadata.

Future fields may include:

```text
storage_provider
object_key
bucket
checksum
version_id
content_disposition
```

Migration must keep public share and permission checks at metadata/API layer, not in object storage URL exposure.
