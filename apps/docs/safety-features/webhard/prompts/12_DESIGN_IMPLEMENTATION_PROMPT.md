# 12_DESIGN_IMPLEMENTATION_PROMPT: Webhard Drive-like Design Implementation

```text
너는 Drive-like fullscreen file manager 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
Google Drive와 유사한 좌측 Drive navigation + 중앙 file canvas + optional detail panel 구조를 유지하고, 공유/권한/업로드 상태를 명확히 보여준다.

대상 route:
- /webhard
- /share/[token]

대상 파일:
- apps/web/features/drive/DriveScreen.tsx
- apps/web/features/drive/DriveShell.tsx
- apps/web/features/drive/DriveSidebar.tsx
- apps/web/features/drive/DriveTopbar.tsx
- apps/web/features/drive/DriveFileTable.tsx
- apps/web/features/drive/DriveGrid.tsx
- apps/web/features/drive/DriveShareDialog.tsx
- apps/web/features/drive/PublicDriveShareScreen.tsx
- apps/web/features/drive/DriveWorkspace.module.css

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/webhard/specs/ui_ux.md
- docs/safety-features/webhard/specs/validation.md
- docs/safety-features/webhard/specs/known_issues.md

구현 요구사항:
1. ERP 카드형 웹하드로 회귀하지 않는다.
2. 좌측 sidebar는 내 드라이브, 공유 문서함, 최근, 중요, 휴지통을 명확히 표시한다.
3. 중앙 file canvas가 화면의 주인공이어야 한다.
4. 공유 상태 badge는 비공개, 링크 공유, 제한 링크, 사용자 N명, 공유 중지됨을 구분한다.
5. share dialog는 접근 권한 / 일반 접근 / 링크 복사 / 링크 폐기 구조로 정리한다.
6. public share page는 shared root 기준 breadcrumb만 보여준다.

Non-regression:
- 탐색 카드 + 폴더 카드 + 자료 목록 카드 + 항상 열린 오른쪽 상세 카드 구조 금지
- 공유 root 밖 경로 노출 금지
- viewer에게 편집/삭제/공유 UI 표시 금지

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```
