import { Suspense } from 'react';
import { ErpPhotoAlbumScreen } from '@/components/ErpPhotoAlbumScreen';

export default function PhotoAlbumPage() {
  return (
    <Suspense fallback={null}>
      <ErpPhotoAlbumScreen />
    </Suspense>
  );
}
