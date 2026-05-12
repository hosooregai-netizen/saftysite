# Prompt 04: Implement Drive UI

```text
너는 Google Drive, Dropbox, Box 같은 파일 관리 SaaS UI를 구현해본 시니어 프론트엔드 엔지니어다.

목표:
웹하드 화면을 `docs/safety-features/webhard/specs/ui_ux.md` 기준으로 Drive-like fullscreen workspace로 유지/개선하라. 기존 ERP nested card layout으로 회귀하지 마라.

반드시 확인할 문서:
- docs/safety-features/webhard/specs/ui_ux.md
- docs/safety-features/webhard/specs/feature.md
- docs/safety-features/webhard/specs/reverse_map.md
- docs/safety-features/webhard/specs/validation.md

대상 코드:
- apps/web/app/webhard/page.tsx
- apps/web/components/WebhardScreen.tsx
- apps/web/features/drive/DriveScreen.tsx
- apps/web/features/drive/DriveShell.tsx
- apps/web/features/drive/DriveTopbar.tsx
- apps/web/features/drive/DriveSidebar.tsx
- apps/web/features/drive/DriveMainHeader.tsx
- apps/web/features/drive/DriveFilterChips.tsx
- apps/web/features/drive/DriveFileTable.tsx
- apps/web/features/drive/DriveGrid.tsx
- apps/web/features/drive/DrivePreviewPanel.tsx
- apps/web/features/drive/DriveShareDialog.tsx
- apps/web/features/drive/DriveContextMenu.tsx
- apps/web/features/drive/DriveSnackbar.tsx
- apps/web/features/drive/DriveWorkspace.module.css
- apps/web/features/drive/DriveShareDialog.module.css

UI 요구사항:
1. `/webhard`는 Drive-like fullscreen workspace로 보여야 한다.
2. 기존 ERP 사이드바는 상시 큰 영역으로 노출하지 말고 app menu drawer 또는 compact entry로 처리한다.
3. 좌측 sidebar는 flat navigation이다.
   - + 새로 만들기
   - 내 드라이브
   - 공유 문서함
   - 최근
   - 중요
   - 휴지통
   - 폴더 트리
4. 중앙 main canvas는 파일 목록/그리드를 넓게 보여준다.
5. search/filter/sort/view/detail controls는 상단 또는 main header에 정돈한다.
6. 선택 상태에서는 selection toolbar가 보여야 한다.
7. 상세 패널은 기본적으로 optional이어야 한다.
8. context menu와 row more menu는 같은 action set을 사용한다.
9. ShareDialog는 People with access / General access 구조를 사용한다.
10. Empty state는 action CTA를 포함한다.
11. 업로드/링크복사/휴지통 이동 등 routine success는 snackbar로 표시한다.

금지사항:
- `탐색`, `폴더`, `자료 목록`, `상세` 같은 nested card layout으로 되돌리지 마라.
- detail panel을 기본 고정으로 강제하지 마라.
- Google/Naver 로고 또는 상표를 그대로 쓰지 마라.
- 메일함/보고서/사진첩 코드를 수정하지 마라.

접근성:
- Enter로 폴더/파일 열기.
- Escape로 dialog/menu 닫기.
- share dialog focus trap.
- icon button aria-label.

완료 기준:
- 1440x900 기준으로 Drive-like file manager로 보인다.
- 좌측 navigation과 중앙 file canvas가 명확히 분리된다.
- selection toolbar와 context menu가 동작한다.
- 기존 웹하드 CRUD/share 기능이 깨지지 않는다.
```
