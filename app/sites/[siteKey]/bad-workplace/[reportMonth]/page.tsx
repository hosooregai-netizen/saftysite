'use client';

import { use } from 'react';
import { BadWorkplaceReportPageScreen } from '@/features/site-reports/bad-workplace/BadWorkplaceReportPageScreen';

interface BadWorkplaceReportPageProps {
  params: Promise<{
    reportMonth: string;
    siteKey: string;
  }>;
}

export default function BadWorkplaceReportPage({
  params,
}: BadWorkplaceReportPageProps) {
  const { reportMonth, siteKey } = use(params);

  return (
    <BadWorkplaceReportPageScreen
      reportMonth={decodeURIComponent(reportMonth)}
      siteKey={decodeURIComponent(siteKey)}
    />
  );
}
