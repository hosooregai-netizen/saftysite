# Guest Cache Spec: Photo Album

## 목적

비로그인 또는 임시 세션 상태에서도 사진첩을 사용할 수 있게 한다.

## 관련 코드

```text
readGuestWorkspaceCache
writeGuestWorkspaceCache
upsertGuestPhotoAlbumItem
setGuestDirectoryCache
createGuestLocalId
```

## Guest flow

```text
/photo-album
→ guest cache read
→ directory/headquarters/sites/photoAlbum load
→ PhotoAlbumPanel에 guestAdapter 전달
→ upload/delete/download/updateRounds는 local cache에서 수행
```

## Login 이후 import

guest workspace cache import 시 사진첩은 다음 payload로 서버에 전달된다.

```ts
GuestWorkspacePhotoAlbumInput[]
```

서버는 local_id를 source_local_id로 저장하고 새 workspace photo id를 발급한다.

## 주의점

- guest data_url은 브라우저 storage 크기 제한을 초과할 수 있다.
- 로그인 후 import 전에 사용자가 cache를 삭제할 수 있다.
- source_local_id 중복 처리 정책이 필요하다.
- guest photo는 workspace 권한이 없으므로 서버 전송 전까지 private local data다.
