# Prompt 01: Read and Plan Webhard

```text
너는 Next.js + React + FastAPI 기반 SaaS/ERP 프로젝트의 웹하드 기능을 분석하는 시니어 풀스택 엔지니어다.

목표:
웹하드 기능을 변경하기 전에 현재 구현 상태를 읽고, 기능/권한/UI/API/리스크를 정리한 실행 계획을 작성하라. 아직 코드는 수정하지 마라.

반드시 확인할 문서:
- docs/safety-features/webhard/specs/feature.md
- docs/safety-features/webhard/specs/data_flow.md
- docs/safety-features/webhard/specs/schema.md
- docs/safety-features/webhard/specs/api_contract.md
- docs/safety-features/webhard/specs/permissions.md
- docs/safety-features/webhard/specs/public_share.md
- docs/safety-features/webhard/specs/ui_ux.md
- docs/safety-features/webhard/specs/reverse_map.md

반드시 확인할 코드:
- apps/web/app/webhard/page.tsx
- apps/web/app/share/[token]/page.tsx
- apps/web/components/WebhardScreen.tsx
- apps/web/components/PublicDriveShareScreen.tsx
- apps/web/features/drive/DriveScreen.tsx
- apps/web/features/drive/DriveShell.tsx
- apps/web/features/drive/DriveTopbar.tsx
- apps/web/features/drive/DriveSidebar.tsx
- apps/web/features/drive/DriveFileTable.tsx
- apps/web/features/drive/DriveGrid.tsx
- apps/web/features/drive/DrivePreviewPanel.tsx
- apps/web/features/drive/DriveShareDialog.tsx
- apps/web/features/drive/driveApi.ts
- apps/web/features/drive/types.ts
- apps/web/features/drive/useDriveItems.ts
- apps/web/features/drive/useDriveSelection.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/web/lib/webhard/*
- apps/api/app/main.py
- apps/api/app/drive_service.py
- apps/api/app/models.py
- apps/api/app/store.py

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX
- 메일함, 보고서, 사진첩, 사업장/현장 기능 코드

분석 기준:
1. 현재 Drive-like UI가 어느 정도 구현되어 있는지 확인하라.
2. WebhardScreen이 thin wrapper인지, 아니면 legacy logic이 남아 있는지 확인하라.
3. DriveItem / DriveShare / DrivePermission / WorkspaceGroup 모델이 문서와 일치하는지 확인하라.
4. public share root boundary가 안전한지 확인하라.
5. data_url/text_content/external_url serializer가 권한 없는 사용자에게 노출되지 않는지 확인하라.
6. restricted / anyone_with_link / viewer / editor 정책이 UI와 backend에서 일관적인지 확인하라.
7. 폴더 권한 상속이 구현되어 있는지 확인하라.
8. 기존 UI가 ERP card layout으로 회귀할 위험이 있는지 확인하라.

산출물:
- 현재 구현 요약
- 문서와 코드의 일치/불일치 목록
- 보안상 즉시 확인해야 할 항목
- UI상 개선해야 할 항목
- 구현 우선순위
- 수정 대상 파일 목록
- 테스트 계획

완료 기준:
코드를 수정하지 않고, 다음 구현 프롬프트를 실행하기 위한 명확한 계획을 제시한다.
```
