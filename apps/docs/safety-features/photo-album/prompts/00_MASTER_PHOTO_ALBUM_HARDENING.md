# Step 22 Master Prompt: Photo Album Hardening

```text
너는 Next.js 사진첩 기능을 실제 업무 기능으로 고도화하는 시니어 프론트엔드 엔지니어다.

목표:
Step 17 source recovery 이후 `PhotoAlbumPanel`을 현장 사진 보관 및 조회 기능으로 고도화하라.

핵심 대상:
- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css
- apps/web/types/photos.ts
- apps/web/lib/guestWorkspaceCache.ts

요구사항:
1. 사진 grid/list UI를 구현한다.
2. 사업장/현장/회차/검색 필터를 제공한다.
3. guest/auth data adapter shape을 통일한다.
4. 사진 업로드/다운로드/삭제 UX를 정리한다.
5. 보고서 evidence linking CTA를 제공한다.
6. ERP AppShell 사진첩 패턴을 유지한다.
7. 웹하드/메일함 기능은 수정하지 않는다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /photo-album route smoke 통과
- guest mode 사진첩 동작
- 필터와 empty state가 자연스럽게 동작
- visual regression 없음
```
