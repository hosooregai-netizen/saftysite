import { SitePhotoAlbumScreen } from '@/features/photos/components/SitePhotoAlbumScreen';

interface SitePhotoAlbumPageProps {
  params: Promise<{
    siteKey: string;
  }>;
  searchParams: Promise<{
    backHref?: string;
    backLabel?: string;
    reportKey?: string;
    reportTitle?: string;
  }>;
}

export default async function SitePhotoAlbumPage({
  params,
  searchParams,
}: SitePhotoAlbumPageProps) {
  const { siteKey } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <SitePhotoAlbumScreen
      siteKey={siteKey}
      backHref={resolvedSearchParams.backHref}
      backLabel={resolvedSearchParams.backLabel}
      reportKey={resolvedSearchParams.reportKey}
      reportTitle={resolvedSearchParams.reportTitle}
    />
  );
}
