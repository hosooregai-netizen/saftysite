import { MobileSiteQuarterlyReportsScreen } from '@/features/mobile/components/MobileSiteQuarterlyReportsScreen';

interface MobileSiteQuarterlyReportsPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function MobileSiteQuarterlyReportsPage({
  params,
}: MobileSiteQuarterlyReportsPageProps) {
  const { siteKey } = await params;

  return <MobileSiteQuarterlyReportsScreen siteKey={siteKey} />;
}
