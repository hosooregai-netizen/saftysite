import { SiteReportsScreen } from '@/features/site-reports/components/SiteReportsScreen';

interface SiteReportsPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteReportsPage({ params }: SiteReportsPageProps) {
  const { siteKey } = await params;

  return <SiteReportsScreen siteKey={siteKey} />;
}

