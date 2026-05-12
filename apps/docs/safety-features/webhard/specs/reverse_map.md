# Reverse Map: Webhard

## 1. Feature Routes

| Route | Purpose |
|---|---|
| `/webhard` | Internal Drive-like file manager |
| `/share/[token]` | Public share viewer |

## 2. Frontend Map

| Area | File(s) | Role |
|---|---|---|
| Route | `apps/web/app/webhard/page.tsx` | Webhard route entry |
| Legacy wrapper | `apps/web/components/WebhardScreen.tsx` | Wraps or delegates to Drive feature |
| Main screen | `apps/web/features/drive/DriveScreen.tsx` | Container and orchestration |
| Shell | `DriveShell.tsx`, `DriveTopbar.tsx`, `DriveSidebar.tsx` | Layout |
| Navigation | `DriveBreadcrumbs.tsx`, `DriveSidebar.tsx` | Folder/scope navigation |
| Listing | `DriveFileTable.tsx`, `DriveGrid.tsx` | Table/grid views |
| Actions | `DriveToolbar.tsx`, `DriveCreateMenu.tsx`, `DriveContextMenu.tsx` | User operations |
| Details | `DrivePreviewPanel.tsx` | Metadata/preview/actions |
| Sharing | `DriveShareDialog.tsx` | People access + general access |
| State | `useDriveItems.ts`, `useDriveSelection.ts` | Items and selection state |
| API | `driveApi.ts`, `workspaceStorageApi.ts` | Client API mapping |
| Public share | `PublicDriveShareScreen.tsx` | Share token viewer |

## 3. Backend Map

| Area | File | Role |
|---|---|---|
| API routes | `apps/api/app/main.py` | FastAPI endpoints |
| Domain helpers | `apps/api/app/drive_service.py` | listing, serialization, permissions |
| Models | `apps/api/app/models.py` | DriveItem, DriveShare, DrivePermission |
| Store | `apps/api/app/store.py` | In-memory records |

## 4. User Flow to Code Map

| Flow | Frontend | API | Backend |
|---|---|---|---|
| List items | `useDriveItems`, `driveApi` | `GET /api/v1/drive/items` | `list_drive_items`, `can_read_item` |
| Create item | `DriveCreateMenu`, upload handlers | `POST /api/v1/drive/items` | `DriveItem`, default permissions |
| Update item | `DrivePreviewPanel`, context actions | `PATCH /api/v1/drive/items/{item_id}` | permission check + item update |
| Trash item | selection/context action | `DELETE /api/v1/drive/items/{item_id}` | soft delete or purge |
| List permissions | `DriveShareDialog` | `GET /items/{item_id}/permissions` | `list_effective_permissions` |
| Add permission | `DriveShareDialog` | `POST /items/{item_id}/permissions` | principal normalization/upsert |
| Update permission | `DriveShareDialog` | `PATCH /permissions/{permission_id}` | role/expiry update |
| Delete permission | `DriveShareDialog` | `DELETE /permissions/{permission_id}` | direct permission delete |
| Create share link | `DriveShareDialog` | `POST /drive/shares` | `DriveShare` token create |
| Revoke share link | `DriveShareDialog` | `DELETE /drive/shares/{share_id}` | `is_revoked=true` |
| Public root | `PublicDriveShareScreen` | `GET /drive/shares/{token}` | `ensure_public_share_root` |
| Public folder children | `PublicDriveShareScreen` | `GET /drive/shares/{token}/items` | descendant boundary check |
| Public file content | `PublicDriveShareScreen` | `GET /drive/shares/{token}/items/{item_id}` | content serializer |

## 5. Data Model Links

| Model | Used By |
|---|---|
| `DriveItem` | List, grid, detail, public share |
| `DriveShare` | Share dialog, public token routes |
| `DrivePermission` | Permission resolution, share dialog |
| `WorkspaceGroup` | Group permissions |

## 6. Design System Links

| Pattern | Document |
|---|---|
| Drive-like file manager | `docs/safety-features/_design-system/specs/layout_patterns.md` |
| Fullscreen workspace shell | `docs/safety-features/_design-system/specs/layout_patterns.md` |
| Share dialog | `specs/ui_ux.md`, `specs/permissions.md` |
| Public share viewer | `specs/public_share.md` |

## 7. Prompt Links

| Prompt | Purpose |
|---|---|
| `01_READ_AND_PLAN.md` | Read current implementation and propose plan |
| `02_SCHEMA_AND_API_PROMPT.md` | Stabilize schema and API contracts |
| `03_IMPLEMENT_PERMISSION_AND_SHARE.md` | Implement/fix permission and share logic |
| `04_IMPLEMENT_DRIVE_UI_PROMPT.md` | Polish Drive-like UI |
| `05_IMPLEMENT_PUBLIC_SHARE.md` | Harden public share page/API |
| `06_QA_REGRESSION.md` | Run regression and security checks |

## 8. Reverse Procedure

1. Read `feature.md` to understand purpose and scope.
2. Read `schema.md` and `api_contract.md` for data/API boundaries.
3. Read `permissions.md` and `public_share.md` for security-critical behavior.
4. Read `ui_ux.md` for desired screen behavior.
5. Use `reverse_map.md` to locate code files.
6. Use prompts in order to re-implement or improve.
7. Validate through `test_scenarios.md` and `validation.md`.
