'use client';

import { use } from 'react';
import { QuarterlyReportPageScreen } from '@/features/site-reports/quarterly-report/QuarterlyReportPageScreen';

interface QuarterlyReportPageProps {
  params: Promise<{
    siteKey: string;
    quarterKey: string;
  }>;
}

export default function QuarterlyReportPage({ params }: QuarterlyReportPageProps) {
  const { siteKey, quarterKey } = use(params);

  return (
    <QuarterlyReportPageScreen
      siteKey={decodeURIComponent(siteKey)}
      quarterKey={decodeURIComponent(quarterKey)}
    />
  );
}
