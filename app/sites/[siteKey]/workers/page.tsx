import { SiteWorkersScreen } from '@/features/erp/components/SiteWorkersScreen';

interface SiteWorkersPageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function SiteWorkersPage({ params }: SiteWorkersPageProps) {
  const { siteKey } = await params;

  return <SiteWorkersScreen siteKey={siteKey} />;
}
