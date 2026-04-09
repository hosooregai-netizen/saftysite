import { MobileSiteReportsScreen } from '@/features/mobile/components/MobileSiteReportsScreen';

interface MobileSiteReportsPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function MobileSiteReportsPage({
  params,
}: MobileSiteReportsPageProps) {
  const { siteKey } = await params;

  return <MobileSiteReportsScreen siteKey={siteKey} />;
}
