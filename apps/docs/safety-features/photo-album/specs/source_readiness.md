# Source Readiness: Photo Album

## 현재 위험

`ErpPhotoAlbumScreen.tsx`는 아래 source를 import한다.

```ts
import type { PhotoAlbumItem, PhotoAlbumListResponse } from '@/types/photos';
import {
  PhotoAlbumPanel,
  type PhotoAlbumDataAdapter,
} from '@/features/photos/components/PhotoAlbumPanel';
```

최신 압축본 기준으로 아래 파일들이 source tree에 없고 `.next` 캐시에만 남아 있을 수 있다.

```text
apps/web/types/photos.ts
apps/web/features/photos/components/PhotoAlbumPanel.tsx
apps/web/features/photos/components/PhotoAlbumPanel.module.css
```

이 파일들이 없으면 clean build 또는 배포에서 실패할 수 있다.

## 복구 기준

### `types/photos.ts`

반드시 export:

```text
PhotoAlbumItem
PhotoAlbumListResponse
PhotoAlbumListInput
PhotoAlbumUploadInput
PhotoAlbumSiteOption
```

### `PhotoAlbumPanel.tsx`

반드시 export:

```text
PhotoAlbumPanel
PhotoAlbumDataAdapter
```

Props:

```ts
type PhotoAlbumPanelProps = {
  capabilityNotice?: string | null;
  dataAdapter?: PhotoAlbumDataAdapter;
  initialHeadquarterId?: string | null;
  initialSiteId?: string | null;
  mode: 'admin' | 'picker';
  sites: PhotoAlbumSiteOption[];
};
```

## clean build 검증

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```
