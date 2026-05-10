# Code Inventory: Webhard

This inventory is based on the latest project structure used for documentation.

## Frontend Routes

| File | Role |
|---|---|
| `apps/web/app/webhard/page.tsx` | Webhard app route |
| `apps/web/app/share/[token]/page.tsx` | Public share route |

## Frontend Components

| File | Role |
|---|---|
| `apps/web/components/WebhardScreen.tsx` | Compatibility wrapper / legacy entry |
| `apps/web/components/PublicDriveShareScreen.tsx` | Compatibility wrapper / legacy public entry |
| `apps/web/features/drive/DriveScreen.tsx` | Main Drive container |
| `apps/web/features/drive/DriveShell.tsx` | Fullscreen drive layout |
| `apps/web/features/drive/DriveTopbar.tsx` | Top search/app actions |
| `apps/web/features/drive/DriveSidebar.tsx` | Drive navigation |
| `apps/web/features/drive/DriveMainHeader.tsx` | Current folder header/actions |
| `apps/web/features/drive/DriveFilterChips.tsx` | Filter controls |
| `apps/web/features/drive/DriveFileTable.tsx` | Table view |
| `apps/web/features/drive/DriveGrid.tsx` | Grid view |
| `apps/web/features/drive/DrivePreviewPanel.tsx` | Detail/preview panel |
| `apps/web/features/drive/DriveShareDialog.tsx` | Sharing dialog |
| `apps/web/features/drive/DriveCreateMenu.tsx` | New folder/file/note/link menu |
| `apps/web/features/drive/DriveContextMenu.tsx` | Row context actions |
| `apps/web/features/drive/DriveSnackbar.tsx` | Feedback and upload state |
| `apps/web/features/drive/PublicDriveShareScreen.tsx` | Public share viewer |
| `apps/web/features/drive/useDriveItems.ts` | Item state and actions |
| `apps/web/features/drive/useDriveSelection.ts` | Selection state |
| `apps/web/features/drive/driveApi.ts` | API mapping layer |
| `apps/web/features/drive/types.ts` | Frontend domain types |
| `apps/web/features/drive/DriveWorkspace.module.css` | Layout styles |
| `apps/web/features/drive/DriveShareDialog.module.css` | Share dialog styles |

## Frontend Libraries

| File | Role |
|---|---|
| `apps/web/lib/workspaceStorageApi.ts` | Workspace/drive API functions |
| `apps/web/lib/webhard/driveGuestStore.ts` | Guest/local drive snapshots |
| `apps/web/lib/webhard/drivePreview.ts` | Preview/download helpers |

## Backend

| File | Role |
|---|---|
| `apps/api/app/main.py` | Drive API endpoints |
| `apps/api/app/drive_service.py` | Drive permission, listing, serialization helpers |
| `apps/api/app/models.py` | DriveItem, DriveShare, DrivePermission models |
| `apps/api/app/store.py` | InMemoryStore tables |

## Current Strengths

- Feature-based frontend drive components exist.
- Drive permissions and shares are present in backend model layer.
- Public share endpoints enforce token/root flow.
- UI has moved toward Drive-like fullscreen workspace.

## Areas to Re-verify

- Whether `restricted` public share requires logged-in permission exactly as product expects.
- Whether editor share links should allow public edit or remain read-only MVP.
- Whether all public serializers avoid private metadata leakage.
- Whether local guest store can produce states that server permissions later reject.
- Whether detail panel and context menu correctly hide disabled actions by permission.
