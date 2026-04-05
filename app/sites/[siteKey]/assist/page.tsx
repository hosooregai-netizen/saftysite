import { SiteAssistScreen } from '@/features/assist/components/SiteAssistScreen';

interface SiteAssistPageProps {
  params: Promise<{
    siteKey: string;
  }>;
  searchParams: Promise<{
    scheduleId?: string;
  }>;
}

export default async function SiteAssistPage({
  params,
  searchParams,
}: SiteAssistPageProps) {
  const { siteKey } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <SiteAssistScreen
      siteKey={siteKey}
      scheduleId={resolvedSearchParams.scheduleId}
    />
  );
}
