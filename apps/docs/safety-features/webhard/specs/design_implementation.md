# Design Implementation Spec: Webhard Drive-like Design Implementation

## Layout Pattern

```text
Drive-like fullscreen file manager
```

## Target Routes

- /webhard
- /share/[token]

## Design Goal

Google Drive와 유사한 좌측 Drive navigation + 중앙 file canvas + optional detail panel 구조를 유지하고, 공유/권한/업로드 상태를 명확히 보여준다.

## Implementation Requirements

1. ERP 카드형 웹하드로 회귀하지 않는다.
2. 좌측 sidebar는 내 드라이브, 공유 문서함, 최근, 중요, 휴지통을 명확히 표시한다.
3. 중앙 file canvas가 화면의 주인공이어야 한다.
4. 공유 상태 badge는 비공개, 링크 공유, 제한 링크, 사용자 N명, 공유 중지됨을 구분한다.
5. share dialog는 접근 권한 / 일반 접근 / 링크 복사 / 링크 폐기 구조로 정리한다.
6. public share page는 shared root 기준 breadcrumb만 보여준다.

## Non-regression

- 탐색 카드 + 폴더 카드 + 자료 목록 카드 + 항상 열린 오른쪽 상세 카드 구조 금지
- 공유 root 밖 경로 노출 금지
- viewer에게 편집/삭제/공유 UI 표시 금지

## Target Files

- apps/web/features/drive/DriveScreen.tsx
- apps/web/features/drive/DriveShell.tsx
- apps/web/features/drive/DriveSidebar.tsx
- apps/web/features/drive/DriveTopbar.tsx
- apps/web/features/drive/DriveFileTable.tsx
- apps/web/features/drive/DriveGrid.tsx
- apps/web/features/drive/DriveShareDialog.tsx
- apps/web/features/drive/PublicDriveShareScreen.tsx
- apps/web/features/drive/DriveWorkspace.module.css

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
