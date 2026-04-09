import { MobileQuarterlyReportScreen } from '@/features/mobile/components/MobileQuarterlyReportScreen';

interface MobileQuarterlyReportPageProps {
  params: Promise<{
    quarterKey: string;
    siteKey: string;
  }>;
}

export default async function MobileQuarterlyReportPage({
  params,
}: MobileQuarterlyReportPageProps) {
  const { quarterKey, siteKey } = await params;

  return <MobileQuarterlyReportScreen quarterKey={quarterKey} siteKey={siteKey} />;
}
