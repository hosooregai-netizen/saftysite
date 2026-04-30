import { WorkerSiteInfoScreen } from '@/features/home/components/WorkerSiteInfoScreen';

interface HeadquarterSiteCreatePageProps {
  params: Promise<{
    headquarterId: string;
  }>;
}

export default async function HeadquarterSiteCreatePage({
  params,
}: HeadquarterSiteCreatePageProps) {
  const { headquarterId } = await params;
  return <WorkerSiteInfoScreen mode="create" headquarterId={headquarterId} />;
}
