# 17_DESIGN_IMPLEMENTATION_PROMPT: Photo Album Design Implementation

```text
너는 ERP photo grid/list 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
현장 사진 보관 및 조회 화면을 사업장/현장/회차/검색 필터와 grid/list/detail drawer 중심으로 개선한다.

대상 route:
- /photo-album

대상 파일:
- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css
- apps/web/types/photos.ts

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/photo-album/specs/ui_ux.md
- docs/safety-features/photo-album/specs/validation.md
- docs/safety-features/photo-album/specs/known_issues.md

구현 요구사항:
1. Grid/List 보기 전환을 제공한다.
2. 사업장, 현장, 회차, 출처, 검색 필터를 제공한다.
3. 사진 card는 thumbnail, fileName, siteName, headquarterName, roundNo, capturedAt을 표시한다.
4. detail drawer는 미리보기, 메타데이터, 다운로드, 삭제, 보고서 연결 CTA를 제공한다.
5. guest/auth adapter 상태를 UI에서 구분한다.

Non-regression:
- 사진첩을 웹하드 Drive shell로 바꾸지 말 것
- 현장 context 없이 업로드 가능하게 만들지 말 것

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
