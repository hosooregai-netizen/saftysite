# Data Flow: Webhard

## 1. Route Flow

```text
/webhard
→ apps/web/app/webhard/page.tsx
→ apps/web/components/WebhardScreen.tsx
→ apps/web/features/drive/DriveScreen.tsx
→ DriveShell / DriveTopbar / DriveSidebar / DriveFileTable / DriveGrid / DrivePreviewPanel / DriveShareDialog
```

```text
/share/[token]
→ apps/web/app/share/[token]/page.tsx
→ apps/web/components/PublicDriveShareScreen.tsx or apps/web/features/drive/PublicDriveShareScreen.tsx
→ public share API
```

## 2. Client State Flow

```text
DriveScreen
├─ useDriveItems
│  ├─ session/workspace resolution
│  ├─ current scope
│  ├─ current parent id
│  ├─ current path
│  ├─ drive items
│  ├─ shares
│  ├─ permissions
│  └─ CRUD/share actions
│
└─ useDriveSelection
   ├─ selected ids
   ├─ selected item
   ├─ detail panel open
   ├─ share dialog open
   ├─ create menu state
   └─ context menu state
```

## 3. API Client Flow

```text
features/drive/driveApi.ts
→ lib/workspaceStorageApi.ts
→ app API routes/proxy
→ FastAPI backend
```

The frontend uses camelCase domain types in `features/drive/types.ts` and maps backend snake_case records through `driveApi.ts`.

## 4. Backend Flow

```text
FastAPI main.py route
→ workspace/session validation
→ drive permission seed/defaults
→ drive_service permission check
→ InMemoryStore read/write
→ serialize_* response
```

## 5. Item List Flow

```text
GET /api/v1/drive/items?parent_id=&include_deleted=&query=
→ require_user
→ require_workspace_payload
→ seed_drive_permissions_for_workspace
→ parent permission check if parent_id exists
→ list_drive_items
→ can_read_item filter
→ serialize_drive_item rows
```

## 6. Create Item Flow

```text
POST /api/v1/drive/items
→ require_user
→ workspace_id
→ parent permission check
→ DriveItem create
→ create_item_default_permissions
→ serialize_drive_item
```

## 7. Share Link Flow

```text
DriveShareDialog
→ createWorkspaceDriveShareLink / updateWorkspaceDriveShareLink / revokeWorkspaceDriveShareLink
→ POST/PATCH/DELETE /api/v1/drive/shares
→ can_share_item
→ DriveShare persist
→ serialize_drive_share
```

## 8. Permission Flow

```text
DriveShareDialog People with access
→ GET /api/v1/drive/items/{item_id}/permissions
→ POST /api/v1/drive/items/{item_id}/permissions
→ PATCH /api/v1/drive/permissions/{permission_id}
→ DELETE /api/v1/drive/permissions/{permission_id}
```

Effective permission resolution:

```text
item
→ direct permissions
→ parent permissions
→ ancestor permissions
→ user/group/workspace/anyone principal matching
→ highest effective role
```

## 9. Public Share Flow

```text
/share/{token}
→ GET /api/v1/drive/shares/{token}
→ ensure_public_share_root
→ require_public_share_access
→ serialize root content or metadata
```

Folder children:

```text
GET /api/v1/drive/shares/{token}/items?parent_id={folderId}
→ ensure_public_share_root
→ require_public_share_access
→ require_public_share_descendant(root, parent_id)
→ list children
```

Item content:

```text
GET /api/v1/drive/shares/{token}/items/{item_id}
→ ensure_public_share_root
→ require_public_share_access
→ require_public_share_descendant(root, item_id)
→ serialize_public_drive_item_content
```

## 10. Local Guest Flow

When authenticated workspace sync is unavailable, guest/local snapshots may be read and written through `lib/webhard/driveGuestStore` or related storage helpers. Local flows must not weaken server-side permission contracts.
