# 03_SCHEMA_AND_API_PROMPT: Photo Album

```text
너는 사진첩 schema와 API contract를 정리하는 시니어 풀스택 엔지니어다.

목표:
PhotoAlbumItem, WorkspacePhotoAlbumRecord, GuestPhotoAlbumItem의 타입과 API 변환을 안정화하라.

대상 문서:
- docs/safety-features/photo-album/specs/schema.md
- docs/safety-features/photo-album/specs/api_contract.md

대상 코드:
- apps/web/types/photos.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/models.py

요구사항:
1. API snake_case와 UI camelCase 변환 기준을 명확히 하라.
2. server list/create/update/delete contract를 검증하라.
3. workspace 밖 site/headquarter/item 접근을 차단하라.
4. guest cache import와 server record 간 필드 차이를 정리하라.
5. 문서와 코드가 다르면 문서를 업데이트하라.
```
