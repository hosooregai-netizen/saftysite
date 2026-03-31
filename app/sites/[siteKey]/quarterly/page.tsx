import { SiteQuarterlyReportsScreen } from '@/features/site-reports/components/SiteQuarterlyReportsScreen';

interface SiteQuarterlyReportsPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteQuarterlyReportsPage({
  params,
}: SiteQuarterlyReportsPageProps) {
  const { siteKey } = await params;

  return <SiteQuarterlyReportsScreen siteKey={siteKey} />;
}
