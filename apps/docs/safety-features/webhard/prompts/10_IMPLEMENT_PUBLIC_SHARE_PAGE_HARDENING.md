# 10_IMPLEMENT_PUBLIC_SHARE_PAGE_HARDENING

```text
너는 public share page를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
/share/[token] 페이지를 shared root 내부만 탐색 가능한 public file viewer로 개선하라.

참조:
- docs/safety-features/webhard/specs/public_share_page_hardening.md
- docs/safety-features/webhard/specs/public_share_boundary_hardening.md

대상:
- apps/web/components/PublicDriveShareScreen.tsx
- apps/web/app/share/[token]/page.tsx
- apps/web/lib/workspaceStorageApi.ts

요구사항:
1. root item 정보를 로드한다.
2. folder share이면 하위 폴더 탐색을 지원한다.
3. breadcrumb는 shared root 기준 상대 경로만 표시한다.
4. expired/revoked/invalid token state를 분리한다.
5. viewer role에서 edit/delete/move/share UI를 숨긴다.
6. 파일 미리보기와 다운로드 fallback을 제공한다.

완료 기준:
- public share page에서 root 밖 경로가 노출되지 않는다.
- 하위 폴더 탐색이 가능하다.
- invalid/expired/revoked state가 명확하다.
```
