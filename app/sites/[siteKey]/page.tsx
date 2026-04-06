import { SiteReportsScreen } from '@/features/site-reports/components/SiteReportsScreen';

interface SiteDashboardPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteDashboardPage({ params }: SiteDashboardPageProps) {
  const { siteKey } = await params;

  return <SiteReportsScreen siteKey={siteKey} />;
}
