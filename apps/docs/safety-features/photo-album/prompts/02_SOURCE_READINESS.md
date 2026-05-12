# 02_SOURCE_READINESS: Photo Album

```text
너는 Next.js clean build를 안정화하는 시니어 프론트엔드 엔지니어다.

목표:
사진첩 기능에서 `.next` 캐시에만 의존할 수 있는 source missing 문제를 해결하라.

반드시 확인할 파일:
- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/types/photos.ts
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css
- apps/web/lib/workspaceStorageApi.ts

요구사항:
1. `types/photos.ts`가 없으면 생성하라.
2. `PhotoAlbumPanel.tsx`가 없으면 source_readiness.md의 계약에 맞게 생성하라.
3. `PhotoAlbumPanel.module.css`가 없으면 생성하라.
4. ErpPhotoAlbumScreen import를 변경하지 않고 맞춰라.
5. clean build를 검증하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

절대 수정하지 말 것:
- 보고서/웹하드/메일함 로직
- .next
- .venv
```
