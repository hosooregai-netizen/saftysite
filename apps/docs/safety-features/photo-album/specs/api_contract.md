# API Contract: Photo Album

## `GET /api/v1/photo-album`

사진첩 목록을 조회한다.

Query:

```ts
{
  headquarter_id?: string;
  site_id?: string;
  query?: string;
  limit?: number;
  offset?: number;
}
```

Response:

```ts
{
  rows: WorkspacePhotoAlbumRecord[];
  total: number;
  limit: number;
  offset: number;
}
```

## `POST /api/v1/photo-album`

사진첩 항목을 생성한다.

Request:

```ts
{
  local_id?: string;
  site_id: string;
  headquarter_id: string;
  round_no: number;
  captured_at?: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  data_url: string;
  source_kind: 'album_upload';
}
```

Response:

```ts
WorkspacePhotoAlbumRecord
```

## `PATCH /api/v1/photo-album/{item_id}`

사진첩 항목의 메타데이터를 수정한다.

Request:

```ts
{
  round_no?: number;
  captured_at?: string;
}
```

Response:

```ts
WorkspacePhotoAlbumRecord
```

## `DELETE /api/v1/photo-album/{item_id}`

사진첩 항목을 삭제한다.

Response:

```ts
{ ok: true }
```

## 보안 기준

- 모든 endpoint는 authenticated user가 필요하다.
- workspace 밖 item은 404 또는 403 처리한다.
- workspace 밖 site_id/headquarter_id로 생성하면 차단해야 한다.
- 삭제/수정은 workspace 소속 항목만 가능하다.

## 향후 확장 API

```text
POST /api/v1/photo-album/bulk
PATCH /api/v1/photo-album/bulk-round
POST /api/v1/photo-album/{item_id}/link-report
GET /api/v1/photo-album/{item_id}/download
```
