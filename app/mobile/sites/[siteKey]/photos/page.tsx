import { MobileSitePhotoAlbumScreen } from '@/features/mobile/components/MobileSitePhotoAlbumScreen';

interface MobileSitePhotoAlbumPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function MobileSitePhotoAlbumPage({
  params,
}: MobileSitePhotoAlbumPageProps) {
  const { siteKey } = await params;

  return <MobileSitePhotoAlbumScreen siteKey={siteKey} />;
}
