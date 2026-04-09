import { MobileBadWorkplaceReportScreen } from '@/features/mobile/components/MobileBadWorkplaceReportScreen';

interface MobileBadWorkplaceReportPageProps {
  params: Promise<{
    reportMonth: string;
    siteKey: string;
  }>;
}

export default async function MobileBadWorkplaceReportPage({
  params,
}: MobileBadWorkplaceReportPageProps) {
  const { reportMonth, siteKey } = await params;

  return (
    <MobileBadWorkplaceReportScreen
      reportMonth={reportMonth}
      siteKey={siteKey}
    />
  );
}
