import { WorkerSiteInfoScreen } from '@/features/home/components/WorkerSiteInfoScreen';

interface SiteEditPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteEditPage({ params }: SiteEditPageProps) {
  const { siteKey } = await params;
  return <WorkerSiteInfoScreen mode="edit" siteId={siteKey} />;
}
