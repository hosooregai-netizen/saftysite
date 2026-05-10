# Guest/Auth Adapter Hardening

## 목표

PhotoAlbumPanel이 guest mode와 authenticated mode에서 동일한 response shape을 사용하도록 정리한다.

## Adapter interface

```ts
interface PhotoAlbumDataAdapter {
  listPhotos(input: {
    headquarterId: string;
    siteId: string;
    roundNo?: string;
    query: string;
    sourceKind?: string;
  }): Promise<PhotoAlbumListResponse>;
  uploadPhoto?(input: { file: File; siteId: string; roundNo: number; capturedAt?: string }): Promise<PhotoAlbumItem>;
  downloadPhoto?(item: PhotoAlbumItem): Promise<void>;
  deletePhoto?(item: PhotoAlbumItem): Promise<void>;
  updatePhoto?(itemId: string, input: Partial<PhotoAlbumItem>): Promise<PhotoAlbumItem>;
}
```

## Guest mode rules

- 업로드 사진은 local/guest cache에 저장한다.
- `uploadedByName`은 `임시 보관함`으로 표시한다.
- 서버 동기화/엑셀/공유 기능은 로그인 후 사용 가능으로 표시한다.
- guest item id는 `guest-photo-*` 형태를 사용한다.

## Authenticated mode rules

- 서버 API를 통해 list/upload/delete/update한다.
- workspace access를 검증한다.
- 사진은 workspace_id, headquarterId, siteId와 연결된다.
