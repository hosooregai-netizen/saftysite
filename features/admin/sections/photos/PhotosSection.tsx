'use client';

import { useSearchParams } from 'next/navigation';
import { PhotoAlbumPanel } from '@/features/photos/components/PhotoAlbumPanel';
import type { SafetySite } from '@/types/backend';

interface PhotosSectionProps {
  sites: SafetySite[];
}

export function PhotosSection({ sites }: PhotosSectionProps) {
  const searchParams = useSearchParams();

  return (
    <PhotoAlbumPanel
      backHref={searchParams.get('returnTo')}
      backLabel={searchParams.get('returnLabel') || '보고서로 돌아가기'}
      initialHeadquarterId={searchParams.get('headquarterId')}
      initialReportKey={searchParams.get('reportKey')}
      initialReportTitle={searchParams.get('reportTitle')}
      initialSiteId={searchParams.get('siteId')}
      mode="admin"
      sites={sites.map((site) => ({
        headquarterId: site.headquarter_id,
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '사업장 미상',
        id: site.id,
        siteName: site.site_name,
        totalRounds: site.total_rounds ?? null,
      }))}
    />
  );
}
