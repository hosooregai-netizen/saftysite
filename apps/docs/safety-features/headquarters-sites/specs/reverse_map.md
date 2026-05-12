# Reverse Map: Headquarters & Sites

## Route map

| Route | 역할 |
|---|---|
| `/headquarters` | 사업장/현장 관리 |
| `/sites` | `/headquarters?scope=assigned` redirect |
| `/reports/new` | 사업장/현장 선택 연계 |
| `/photo-album?headquarterId=&siteId=` | 사진첩 연계 |

## Code map

| 흐름 | Frontend | Backend | 문서 |
|---|---|---|---|
| 사업장 목록 | `HeadquartersHubScreen` | `GET /safety/headquarters`, `/admin/headquarters/list` | `api_contract.md` |
| 사업장 편집 | `HeadquarterEditorModal` | `POST/PATCH /safety/headquarters` | `schema.md` |
| 현장 목록 | `SitesTable`, `SiteManagementMainPanel` | `GET /safety/sites`, `/admin/sites/list` | `api_contract.md` |
| 현장 편집 | `SiteEditorModal` | `POST/PATCH /safety/sites` | `schema.md` |
| 현장 배정 | assignment components/state | `/safety/assignments` | `assignment.md` |
| 사업장 배정 | assignment components/state | `/safety/headquarter-assignments` | `assignment.md` |
| 보고서 연계 | `/reports/new` | `CreateReportRequest` | `directory_usage.md` |
| 사진첩 연계 | `buildPhotoAlbumHref` | photo album API | `directory_usage.md` |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현재 코드/누락 파일/흐름 분석 |
| `02_SCHEMA_AND_API_PROMPT.md` | schema/API 정리 |
| `03_IMPLEMENT_DIRECTORY_CRUD.md` | 사업장/현장 CRUD 안정화 |
| `04_IMPLEMENT_ASSIGNMENT.md` | 배정 관리 구현/검증 |
| `05_SOURCE_READINESS.md` | clean build source 복구 |
| `06_VISUAL_POLISH.md` | ERP 기준정보 UI polish |
| `07_QA_REGRESSION.md` | 회귀 테스트 |
