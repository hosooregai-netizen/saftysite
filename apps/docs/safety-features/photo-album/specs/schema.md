# Schema: Photo Album

## PhotoAlbumItem

Frontend view model.

```ts
type PhotoAlbumItem = {
  id: string;
  siteId: string;
  siteName: string;
  headquarterId: string;
  headquarterName: string;
  roundNo: number;
  capturedAt: string;
  createdAt: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  previewUrl: string;
  downloadUrl: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  sourceKind: 'album_upload' | 'report_photo' | string;
  sourceReportKey: string;
  sourceReportTitle: string;
  sourceDocumentKey: string;
  sourceSlotKey: string;
  uploadedByUserId: string;
  uploadedByName: string;
};
```

## WorkspacePhotoAlbumRecord

API/server record.

```ts
type WorkspacePhotoAlbumRecord = {
  id: string;
  site_id: string;
  site_name: string;
  headquarter_id: string;
  headquarter_name: string;
  round_no: number;
  captured_at: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  data_url: string;
  source_kind: 'album_upload';
  uploaded_by_user_id: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
};
```

## GuestPhotoAlbumItem

Guest cache record.

```ts
type GuestPhotoAlbumItem = {
  id: string;
  siteId: string;
  headquarterId: string;
  roundNo: number;
  capturedAt: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  dataUrl: string;
  sourceKind: 'album_upload';
};
```

## PhotoAlbumListResponse

```ts
type PhotoAlbumListResponse = {
  rows: PhotoAlbumItem[];
  total: number;
  limit: number;
  offset: number;
  capabilities?: {
    deleteSupported?: boolean;
    roundUpdateSupported?: boolean;
  };
};
```

## PhotoAlbumDataAdapter

```ts
type PhotoAlbumDataAdapter = {
  list(input: PhotoAlbumListInput): Promise<PhotoAlbumListResponse>;
  upload?(input: PhotoAlbumUploadInput): Promise<PhotoAlbumItem>;
  deleteSelection?(itemIds: string[]): Promise<void>;
  downloadSelection?(itemIds: string[]): Promise<void>;
  updateRounds?(itemIds: string[], nextRoundNo: number): Promise<void>;
};
```

## Schema 원칙

- API는 snake_case, UI는 camelCase를 사용한다.
- 변환 함수는 PhotoAlbumPanel 또는 api client 근처에 둔다.
- `data_url`은 MVP용이며 실운영에서는 object storage URL로 전환해야 한다.
- sourceKind 확장 시 `album_upload`, `report_photo`를 구분한다.
