import { Suspense } from 'react';
import { ReportWorkspaceScreen } from '@/components/ReportWorkspaceScreen';

export default async function ReportReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<{ entry?: string }>;
}) {
  const { reportId } = await params;
  const { entry } = await searchParams;
  const normalizedReportId = (() => {
    try {
      return decodeURIComponent(reportId);
    } catch {
      return reportId;
    }
  })();

  return (
    <Suspense fallback={null}>
      <ReportWorkspaceScreen reportId={normalizedReportId} initialEntry={entry ?? null} />
    </Suspense>
  );
}
