import { SiteSafetyBoardScreen } from '@/features/erp/components/SiteSafetyBoardScreen';

interface SiteSafetyBoardPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteSafetyBoardPage({
  params,
}: SiteSafetyBoardPageProps) {
  const { siteKey } = await params;

  return <SiteSafetyBoardScreen siteKey={siteKey} />;
}
