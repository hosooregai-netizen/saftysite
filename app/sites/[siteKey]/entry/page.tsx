import { SiteEntryHubScreen } from '@/features/home/components/SiteEntryHubScreen';

interface SiteEntryPageProps {
  params: Promise<{
    siteKey: string;
  }>;
  searchParams: Promise<{
    entry?: string | string[];
  }>;
}

export default async function SiteEntryPage({
  params,
  searchParams,
}: SiteEntryPageProps) {
  const { siteKey } = await params;
  const { entry } = await searchParams;
  const initialEntry = Array.isArray(entry) ? entry[0] : entry;

  return <SiteEntryHubScreen siteKey={siteKey} initialEntry={initialEntry} />;
}
