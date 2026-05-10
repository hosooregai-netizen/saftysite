# Data Flow: Photo Album

## Route to component

```text
/photo-album
→ apps/web/app/photo-album/page.tsx
→ ErpPhotoAlbumScreen
→ PhotoAlbumPanel
```

## Session flow

```text
ErpPhotoAlbumScreen
→ readGuestWorkspaceCache()
→ set guest headquarters/sites/photoAlbum
→ bootstrapDemoSession()
→ if authenticated:
   fetchSafetyHeadquarters()
   fetchSafetySitesAdmin()
   setGuestDirectoryCache()
→ PhotoAlbumPanel render
```

## Authenticated data flow

```text
PhotoAlbumPanel
→ default/server adapter
→ fetchWorkspacePhotoAlbum()
→ GET /api/v1/photo-album?headquarter_id=&site_id=&query=&limit=&offset=
→ main.py workspace_photo_album
→ list_workspace_photo_album_items
→ serialize_workspace_photo_album_item
→ PhotoAlbumListResponse
```

## Guest data flow

```text
PhotoAlbumPanel
→ guestAdapter.list
→ guestRows filter by headquarter/site/query
→ mapGuestPhotoItem
→ PhotoAlbumListResponse
```

## Upload flow

```text
file
→ prepareUploadImage()
→ GuestPhotoAlbumItem or server payload
→ createWorkspacePhotoAlbumItem() or upsertGuestPhotoAlbumItem()
→ PhotoAlbumItem row
```

## Delete/download/update flow

```text
selection
→ deleteSelection / downloadSelection / updateRounds
→ server API or guest cache mutation
→ list refresh
```
