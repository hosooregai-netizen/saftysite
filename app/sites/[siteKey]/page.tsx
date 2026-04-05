import { SiteDashboardScreen } from '@/features/erp/components/SiteDashboardScreen';

interface SiteDashboardPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteDashboardPage({ params }: SiteDashboardPageProps) {
  const { siteKey } = await params;

  return <SiteDashboardScreen siteKey={siteKey} />;
}
