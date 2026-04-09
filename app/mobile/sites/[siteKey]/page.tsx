import { MobileSiteHomeScreen } from '@/features/mobile/components/MobileSiteHomeScreen';

interface MobileSiteHomePageProps {
  params: Promise<{
    siteKey: string;
  }>;
}

export default async function MobileSiteHomePage({
  params,
}: MobileSiteHomePageProps) {
  const { siteKey } = await params;

  return <MobileSiteHomeScreen siteKey={siteKey} />;
}
