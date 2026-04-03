import { SitePhotoAlbumScreen } from '@/features/photos/components/SitePhotoAlbumScreen';

interface SitePhotoAlbumPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SitePhotoAlbumPage({ params }: SitePhotoAlbumPageProps) {
  const { siteKey } = await params;

  return <SitePhotoAlbumScreen siteKey={siteKey} />;
}
