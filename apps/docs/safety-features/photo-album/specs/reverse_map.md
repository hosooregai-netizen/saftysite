# Reverse Map: Photo Album

## Route map

| Route | 역할 |
|---|---|
| `/photo-album` | 사진첩 메인 |
| `/api/v1/photo-album` | 서버 사진첩 API |

## Code map

| 흐름 | Frontend | Backend | 문서 |
|---|---|---|---|
| 화면 진입 | `app/photo-album/page.tsx` | - | `data_flow.md` |
| 세션/디렉터리 로드 | `ErpPhotoAlbumScreen.tsx` | safety API | `data_flow.md` |
| grid/list UI | `PhotoAlbumPanel.tsx` | - | `ui_ux.md` |
| 목록 조회 | `workspaceStorageApi.ts` | `GET /photo-album` | `api_contract.md` |
| 업로드 | `prepareUploadImage`, adapter | `POST /photo-album` | `schema.md` |
| 삭제 | adapter | `DELETE /photo-album/{id}` | `api_contract.md` |
| 회차 수정 | adapter | `PATCH /photo-album/{id}` | `api_contract.md` |
| guest cache | `guestWorkspaceCache.ts` | import cache API | `guest_cache.md` |

## Related feature map

| 기능 | 연결 |
|---|---|
| headquarters-sites | site/headquarter options |
| report-workspace | report photo evidence |
| webhard | 향후 이미지 파일 공유 가능 |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현황 분석 |
| `02_SOURCE_READINESS.md` | 누락 source 복구 |
| `03_SCHEMA_AND_API_PROMPT.md` | schema/API 정리 |
| `04_IMPLEMENT_PHOTO_GRID.md` | grid/list 구현 |
| `05_IMPLEMENT_FILTERS_AND_LINKING.md` | 필터/보고서 연결 |
| `06_VISUAL_POLISH.md` | UI polish |
| `07_QA_REGRESSION.md` | QA |
