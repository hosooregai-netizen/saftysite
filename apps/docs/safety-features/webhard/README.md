# Webhard Feature Pack

웹하드는 업무 문서, 링크, 메모, 업로드 파일을 폴더 기반으로 정리하고 공유하는 전역 자료함 기능이다.
이 기능은 일반 ERP 카드 화면이 아니라 Drive-like fullscreen workspace로 관리한다.

## Documentation Layout

```text
webhard/
├─ specs/
└─ prompts/
```

- `specs/`: 기능 명세, 데이터 흐름, schema, API, 권한, public share, UI/UX, 검증 기준
- `prompts/`: Codex/AI coding agent에게 실행할 구현 프롬프트

## Priority

P0. 웹하드는 업무 자료 저장과 공유 링크 흐름의 핵심 기능이다.

## Source Areas

### Frontend

- `apps/web/app/webhard/page.tsx`
- `apps/web/app/share/[token]/page.tsx`
- `apps/web/components/WebhardScreen.tsx`
- `apps/web/components/PublicDriveShareScreen.tsx`
- `apps/web/features/drive/*`
- `apps/web/lib/workspaceStorageApi.ts`
- `apps/web/lib/webhard/*`

### Backend

- `apps/api/app/main.py`
- `apps/api/app/drive_service.py`
- `apps/api/app/models.py`
- `apps/api/app/store.py`

## Core Specs

- `specs/feature.md`: 목적과 기능 범위
- `specs/user_flows.md`: 사용자 흐름
- `specs/data_flow.md`: route → component → API → backend → store 흐름
- `specs/schema.md`: DriveItem, DriveShare, DrivePermission, WorkspaceGroup schema
- `specs/api_contract.md`: endpoint와 request/response 계약
- `specs/permissions.md`: 권한/공유/폴더 상속 모델
- `specs/public_share.md`: `/share/[token]` 공개 공유 화면과 API 경계
- `specs/ui_ux.md`: Drive-like UI/UX 기준
- `specs/validation.md`: 보안/기능/시각 검증 기준
- `specs/reverse_map.md`: 기능을 코드와 프롬프트로 역추적하는 지도
- `specs/test_scenarios.md`: 회귀 테스트 시나리오

## Prompt Order

1. `01_READ_AND_PLAN.md`
2. `02_SCHEMA_AND_API_PROMPT.md`
3. `03_IMPLEMENT_PERMISSION_AND_SHARE.md`
4. `04_IMPLEMENT_DRIVE_UI_PROMPT.md`
5. `05_IMPLEMENT_PUBLIC_SHARE.md`
6. `06_QA_REGRESSION.md`
